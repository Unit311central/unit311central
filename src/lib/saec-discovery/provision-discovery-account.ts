import "server-only";

import { scryptSync, timingSafeEqual } from "node:crypto";

import {
  hashPlatformPasswordForUser,
  normalizePlatformUsername,
} from "@/lib/platform-auth";
import { validatePlatformSignupPassword } from "@/lib/platform-password-validation";
import {
  SAEC_DISCOVERY_DISPLAY_NAME,
  SAEC_DISCOVERY_USER_ID,
  SAEC_DISCOVERY_USERNAME,
} from "@/lib/saec-discovery/discovery-auth";
import { SAEC_SLUG } from "@/lib/saec-surface";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { createTenancyServerClient } from "@/lib/supabase/tenancy-server";

export type ProvisionSaecDiscoveryAccountResult = {
  ok: true;
  userId: string;
  email: string;
  workspaceId: string;
  workspaceSlug: string;
  passwordVerifies: boolean;
  created: boolean;
};

function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64).toString("hex");
  try {
    return timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(candidate, "hex"));
  } catch {
    return false;
  }
}

/**
 * Upsert discovery@unit311central.com in the SAEC workspace for questionnaire login.
 * Password is supplied at runtime only (Vercel env / GitHub secret).
 */
export async function provisionSaecDiscoveryAccount(
  password: string,
): Promise<ProvisionSaecDiscoveryAccountResult> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured on this deployment.");
  }

  const validationError = validatePlatformSignupPassword(password);
  if (validationError) throw new Error(validationError);

  const supabase = createTenancyServerClient();
  const { data: workspace, error: workspaceError } = await supabase
    .from("workspaces")
    .select("id, slug, name")
    .eq("slug", SAEC_SLUG)
    .maybeSingle();
  if (workspaceError || !workspace?.id) {
    throw new Error(`SAEC workspace missing: ${workspaceError?.message || "not found"}`);
  }

  const email = SAEC_DISCOVERY_USERNAME.trim().toLowerCase();
  const username = normalizePlatformUsername(email);
  const passwordHash = hashPlatformPasswordForUser(username, password);
  const now = new Date().toISOString();

  const { data: byId } = await supabase
    .from("platform_users")
    .select("id")
    .eq("id", SAEC_DISCOVERY_USER_ID)
    .maybeSingle();
  const { data: byEmail } = await supabase
    .from("platform_users")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  const { data: byUsername } = await supabase
    .from("platform_users")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  const existingId = byId?.id ?? byEmail?.id ?? byUsername?.id;
  if (byEmail?.id && byUsername?.id && byEmail.id !== byUsername.id) {
    throw new Error(`Conflicting platform_users rows for ${email} — manual cleanup required.`);
  }

  const patch = {
    username,
    display_name: SAEC_DISCOVERY_DISPLAY_NAME,
    password_hash: passwordHash,
    user_type: "internal" as const,
    redirect_path: "/saec-discovery",
    client_name: workspace.name,
    is_active: true,
    email,
    email_verified_at: now,
    workspace_id: workspace.id,
    updated_at: now,
  };

  let created = false;
  if (existingId) {
    const { error } = await supabase.from("platform_users").update(patch).eq("id", existingId);
    if (error) throw new Error(`platform_users update: ${error.message}`);
  } else {
    const { error } = await supabase.from("platform_users").insert({
      id: SAEC_DISCOVERY_USER_ID,
      ...patch,
      created_at: now,
    });
    if (error) throw new Error(`platform_users insert: ${error.message}`);
    created = true;
  }

  const userId = existingId ?? SAEC_DISCOVERY_USER_ID;

  const { data: membership, error: membershipError } = await supabase
    .from("workspace_users")
    .select("id, role")
    .eq("workspace_id", workspace.id)
    .eq("user_id", userId)
    .maybeSingle();
  if (membershipError) throw new Error(`workspace_users lookup: ${membershipError.message}`);

  if (!membership) {
    const { error } = await supabase.from("workspace_users").insert({
      workspace_id: workspace.id,
      user_id: userId,
      role: "member",
      is_owner: false,
      created_at: now,
      updated_at: now,
    });
    if (error) throw new Error(`workspace_users insert: ${error.message}`);
  }

  const { data: stored } = await supabase
    .from("platform_users")
    .select("password_hash")
    .eq("id", userId)
    .maybeSingle();
  if (!stored?.password_hash) throw new Error("Password hash missing after provisioning.");
  const passwordVerifies = verifyPassword(password, stored.password_hash);
  if (!passwordVerifies) throw new Error("Password verification failed after provisioning.");

  return {
    ok: true,
    userId,
    email,
    workspaceId: workspace.id,
    workspaceSlug: workspace.slug,
    passwordVerifies,
    created,
  };
}
