import {
  buildPlatformSession,
  createPlatformSessionToken,
  normalizePlatformUsername,
  verifyPlatformPassword,
  type PlatformSession,
  type PlatformUserRecord,
} from "@/lib/platform-auth";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

function requirePlatformUsersSupabase() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured");
  }

  return createSupabaseServerClient();
}

export async function findPlatformUserByUsername(username: string) {
  const supabase = requirePlatformUsersSupabase();
  const normalized = normalizePlatformUsername(username);

  const { data, error } = await supabase
    .from("platform_users")
    .select("*")
    .eq("username", normalized)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as PlatformUserRecord | null) ?? null;
}

export async function authenticatePlatformUser(username: string, password: string) {
  const user = await findPlatformUserByUsername(username);
  if (!user || !verifyPlatformPassword(password, user.password_hash)) {
    return null;
  }

  return user;
}

export function createSessionForUser(user: PlatformUserRecord) {
  const session = buildPlatformSession(user);
  return {
    session,
    token: createPlatformSessionToken(session),
    redirectPath: user.redirect_path,
  };
}

export async function loginPlatformUser(username: string, password: string) {
  const user = await authenticatePlatformUser(username, password);
  if (!user) {
    return null;
  }

  return createSessionForUser(user);
}

export type { PlatformSession, PlatformUserRecord };
