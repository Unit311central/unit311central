import "server-only";

import { scryptSync, timingSafeEqual } from "node:crypto";

import {
  hashPlatformPasswordForUser,
  normalizePlatformUsername,
} from "@/lib/platform-auth";
import { validatePlatformSignupPassword } from "@/lib/platform-password-validation";
import { provisionInitialWorkspaceAdministrator } from "@/lib/platform-workspaces/initial-admin-provisioning-adapter";
import {
  PAILEX_DISPLAY_NAME,
  PAILEX_SLUG,
} from "@/lib/pailex/pailex-surface";
import { findWorkspaceBySlug } from "@/lib/workspace-host";
import { createTenancyServerClient } from "@/lib/supabase/tenancy-server";

export const PAILEX_ADMIN_EMAIL = "admin@pailex.unit311central.com";

export type ResetPailexAdminResult = {
  ok: true;
  workspaceId: string;
  workspaceSlug: string;
  adminEmail: string;
  userId: string;
  passwordVerifies: boolean;
  loginUrl: string;
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
 * Reset (or create) the PAILEX initial administrator password.
 * Idempotent — safe to re-run after deploy or credential rotation.
 */
export async function resetPailexAdminPassword(password: string): Promise<ResetPailexAdminResult> {
  const nextPassword = password.trim();
  const passwordError = validatePlatformSignupPassword(nextPassword);
  if (passwordError) {
    throw new Error(passwordError);
  }

  const workspace = await findWorkspaceBySlug(PAILEX_SLUG);
  if (!workspace) {
    throw new Error(
      `PAILEX workspace "${PAILEX_SLUG}" was not found. Run provision-pailex first.`,
    );
  }

  const admin = await provisionInitialWorkspaceAdministrator({
    workspaceId: workspace.id,
    workspaceSlug: PAILEX_SLUG,
    companyName: PAILEX_DISPLAY_NAME,
    administrator: {
      firstName: "PAILEX",
      lastName: "Administrator",
      email: PAILEX_ADMIN_EMAIL,
      password: nextPassword,
      confirmPassword: nextPassword,
    },
  });

  if (!admin.userId) {
    throw new Error("PAILEX administrator reset did not return a user id.");
  }

  const supabase = createTenancyServerClient();
  const { data: userRow, error } = await supabase
    .from("platform_users")
    .select("password_hash")
    .eq("id", admin.userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!userRow?.password_hash) {
    throw new Error("PAILEX administrator password hash missing after reset.");
  }

  const passwordVerifies = verifyPassword(nextPassword, String(userRow.password_hash));

  return {
    ok: true,
    workspaceId: workspace.id,
    workspaceSlug: PAILEX_SLUG,
    adminEmail: PAILEX_ADMIN_EMAIL,
    userId: admin.userId,
    passwordVerifies,
    loginUrl: "https://pailex.unit311central.com/login",
  };
}

export async function verifyPailexAdminPassword(password: string): Promise<boolean> {
  const supabase = createTenancyServerClient();
  const username = normalizePlatformUsername(PAILEX_ADMIN_EMAIL);
  const { data: userRow } = await supabase
    .from("platform_users")
    .select("password_hash")
    .eq("username", username)
    .maybeSingle();
  if (!userRow?.password_hash) return false;
  return verifyPassword(password.trim(), String(userRow.password_hash));
}
