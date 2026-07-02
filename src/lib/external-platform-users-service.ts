import {
  createBlankExternalUserInput,
  mapExternalUser,
  type ExternalUser,
} from "@/lib/external-users-data";
import {
  ensurePlatformUsersLastLoginColumn,
  withPlatformUsersLastLoginColumn,
} from "@/lib/internal-db-migrations";
import {
  generatePlatformPassword,
  hashPlatformPasswordForUser,
  normalizePlatformUsername,
} from "@/lib/platform-auth";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

type DbPlatformUser = Parameters<typeof mapExternalUser>[0];

const PLATFORM_USER_COLUMNS =
  "id, username, display_name, user_type, redirect_path, client_name, is_active, last_login_at, created_at, updated_at";

function requirePlatformSupabase() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY.");
  }
  return createSupabaseServerClient();
}

export async function listExternalUsers(): Promise<ExternalUser[]> {
  await ensurePlatformUsersLastLoginColumn();
  return withPlatformUsersLastLoginColumn(async () => {
    const supabase = requirePlatformSupabase();
    const { data, error } = await supabase
      .from("platform_users")
      .select(PLATFORM_USER_COLUMNS)
      .eq("user_type", "external")
      .order("display_name", { ascending: true });

    if (error) throw new Error(error.message);
    return (data as DbPlatformUser[]).map(mapExternalUser);
  });
}

export async function createExternalUser(input: {
  name: string;
  organisation: string;
  username: string;
  redirectPath?: string;
  password?: string;
}): Promise<{ user: ExternalUser; temporaryPassword: string }> {
  await ensurePlatformUsersLastLoginColumn();
  return withPlatformUsersLastLoginColumn(async () => {
    const supabase = requirePlatformSupabase();
    const blank = createBlankExternalUserInput();
    const username = normalizePlatformUsername(input.username);
    const password = input.password?.trim() || generatePlatformPassword();
    const passwordHash = hashPlatformPasswordForUser(username, password);

    const { data, error } = await supabase
      .from("platform_users")
      .insert({
        username,
        display_name: input.name.trim() || "New Client User",
        password_hash: passwordHash,
        user_type: "external",
        redirect_path: input.redirectPath?.trim() || blank.redirectPath,
        client_name: input.organisation.trim() || null,
        is_active: true,
      })
      .select(PLATFORM_USER_COLUMNS)
      .single();

    if (error) throw new Error(error.message);
    return { user: mapExternalUser(data as DbPlatformUser), temporaryPassword: password };
  });
}

export async function updateExternalUser(
  id: string,
  patch: Partial<{
    name: string;
    organisation: string;
    username: string;
    redirectPath: string;
    isActive: boolean;
  }>,
): Promise<ExternalUser> {
  await ensurePlatformUsersLastLoginColumn();
  return withPlatformUsersLastLoginColumn(async () => {
    const supabase = requirePlatformSupabase();
    const payload: Record<string, string | boolean | null> = {
      updated_at: new Date().toISOString(),
    };

    if (patch.name !== undefined) payload.display_name = patch.name.trim();
    if (patch.organisation !== undefined) payload.client_name = patch.organisation.trim() || null;
    if (patch.username !== undefined) payload.username = normalizePlatformUsername(patch.username);
    if (patch.redirectPath !== undefined) payload.redirect_path = patch.redirectPath.trim();
    if (patch.isActive !== undefined) payload.is_active = patch.isActive;

    const { data, error } = await supabase
      .from("platform_users")
      .update(payload)
      .eq("id", id)
      .eq("user_type", "external")
      .select(PLATFORM_USER_COLUMNS)
      .single();

    if (error) throw new Error(error.message);
    return mapExternalUser(data as DbPlatformUser);
  });
}

export async function resetExternalUserPassword(id: string): Promise<{ temporaryPassword: string }> {
  const supabase = requirePlatformSupabase();
  const { data: existing, error: loadError } = await supabase
    .from("platform_users")
    .select("username")
    .eq("id", id)
    .eq("user_type", "external")
    .single();

  if (loadError || !existing) throw new Error(loadError?.message ?? "User not found");

  const password = generatePlatformPassword();
  const passwordHash = hashPlatformPasswordForUser(existing.username, password);

  const { error } = await supabase
    .from("platform_users")
    .update({
      password_hash: passwordHash,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_type", "external");

  if (error) throw new Error(error.message);
  return { temporaryPassword: password };
}

export async function deleteExternalUser(id: string) {
  const supabase = requirePlatformSupabase();
  const { error } = await supabase
    .from("platform_users")
    .delete()
    .eq("id", id)
    .eq("user_type", "external");

  if (error) throw new Error(error.message);
}

export async function recordPlatformUserLogin(userId: string) {
  const supabase = requirePlatformSupabase();
  const { error } = await supabase
    .from("platform_users")
    .update({
      last_login_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error && !error.message.includes("last_login_at")) {
    throw new Error(error.message);
  }
}
