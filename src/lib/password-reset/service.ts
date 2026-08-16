import { createHash, randomBytes, randomInt } from "node:crypto";

import { headers } from "next/headers";

import {
  CENTRAL_SITE_URL,
  customerWorkspaceOrigin,
  getRequestHost,
  parseClientPlatformSubdomainSafe,
} from "@/lib/app-domains";
import { sendMailboxEmail } from "@/lib/email/smtp";
import {
  ensurePlatformPasswordResetTokensTable,
  withPlatformPasswordResetTokensTable,
} from "@/lib/internal-db-migrations";
import {
  buildPasswordResetConfirmationEmail,
  buildPasswordResetEmail,
} from "@/lib/password-reset/emails";
import {
  hashPlatformPasswordForUser,
  normalizePlatformUsername,
  type PlatformUserRecord,
} from "@/lib/platform-auth";
import { validatePlatformSignupPasswordConfirmation } from "@/lib/platform-password-validation";
import {
  findPlatformUserByUsername,
  findPlatformUsersByEmail,
} from "@/lib/platform-users-service";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { createTenancyServerClient } from "@/lib/supabase/tenancy-server";
import { resolveWorkspaceBrandFor } from "@/lib/workspace-brand-server";
import { findWorkspaceBySlug } from "@/lib/workspace-host";

export const PASSWORD_RESET_EXPIRY_MINUTES = 60;
export const PASSWORD_RESET_OTP_LENGTH = 6;

const GENERIC_RESET_MESSAGE =
  "If an account matches that email address, we sent a one-time code and reset link.";

function requireSupabase() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }
  return createTenancyServerClient();
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function hashResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function hashOtp(otp: string) {
  return createHash("sha256").update(otp.trim()).digest("hex");
}

function createResetTokenValue() {
  return randomBytes(32).toString("base64url");
}

function createOtpCode() {
  return String(randomInt(100000, 999999));
}

async function resolveRequestOrigin(): Promise<string> {
  try {
    const requestHeaders = await headers();
    const host = getRequestHost({ headers: requestHeaders });
    const slug = parseClientPlatformSubdomainSafe(host);
    if (slug) {
      const origin = customerWorkspaceOrigin(slug);
      if (origin) return origin;
    }
    if (host) {
      const proto =
        (requestHeaders.get("x-forwarded-proto") || "https").split(",")[0]?.trim() || "https";
      return `${proto}://${host}`;
    }
  } catch {
    /* fall through */
  }
  return (process.env.NEXT_PUBLIC_SITE_URL ?? CENTRAL_SITE_URL).replace(/\/$/, "");
}

async function buildResetUrl(token: string) {
  const origin = await resolveRequestOrigin();
  return `${origin}/resetpassword?token=${encodeURIComponent(token)}`;
}

async function buildLoginUrl() {
  const origin = await resolveRequestOrigin();
  return `${origin}/login`;
}

function validateNewPassword(password: string, confirmPassword: string) {
  const error = validatePlatformSignupPasswordConfirmation(password, confirmPassword);
  if (error) throw new Error(error);
}

async function resolveUserEmail(user: PlatformUserRecord): Promise<string | null> {
  if (user.email?.trim()) {
    return normalizeEmail(user.email);
  }

  const supabase = requireSupabase();
  const username = normalizePlatformUsername(user.username);

  if (user.user_type === "internal") {
    const { data, error } = await supabase
      .from("internal_operators")
      .select("email")
      .eq("username", username)
      .maybeSingle();

    if (error) throw new Error(error.message);
    const email = data?.email ? normalizeEmail(String(data.email)) : null;
    return email || null;
  }

  return null;
}

async function resolveHostWorkspaceSlug(): Promise<string | null> {
  try {
    const host = getRequestHost({ headers: await headers() });
    return parseClientPlatformSubdomainSafe(host);
  } catch {
    return null;
  }
}

async function findUserForPasswordResetByEmail(
  submittedEmail: string,
): Promise<PlatformUserRecord | null> {
  const matches = await findPlatformUsersByEmail(submittedEmail);
  const emailMatches: PlatformUserRecord[] = [];
  for (const user of matches) {
    if (!user.is_active) continue;
    const accountEmail = await resolveUserEmail(user);
    if (accountEmail === submittedEmail) emailMatches.push(user);
  }

  if (emailMatches.length > 0) {
    const hostSlug = await resolveHostWorkspaceSlug();
    if (hostSlug) {
      const workspace = await findWorkspaceBySlug(hostSlug);
      if (workspace) {
        const { authorizeUserForWorkspace } = await import("@/lib/workspace-authorization");
        const authorized: PlatformUserRecord[] = [];
        for (const candidate of emailMatches) {
          const decision = await authorizeUserForWorkspace(candidate.id, workspace.id, {
            workspace,
            userTypeHint: candidate.user_type,
          });
          if (decision.allowed) authorized.push(candidate);
        }
        if (authorized.length > 0) {
          authorized.sort((a, b) => {
            const aExact = normalizePlatformUsername(a.username) === submittedEmail ? 0 : 1;
            const bExact = normalizePlatformUsername(b.username) === submittedEmail ? 0 : 1;
            if (aExact !== bExact) return aExact - bExact;
            const aInternal = a.user_type === "internal" ? 0 : 1;
            const bInternal = b.user_type === "internal" ? 0 : 1;
            if (aInternal !== bInternal) return aInternal - bInternal;
            return String(a.created_at).localeCompare(String(b.created_at));
          });
          return authorized[0];
        }
      }
    }

    emailMatches.sort((a, b) => {
      const aExact = normalizePlatformUsername(a.username) === submittedEmail ? 0 : 1;
      const bExact = normalizePlatformUsername(b.username) === submittedEmail ? 0 : 1;
      if (aExact !== bExact) return aExact - bExact;
      const aInternal = a.user_type === "internal" ? 0 : 1;
      const bInternal = b.user_type === "internal" ? 0 : 1;
      if (aInternal !== bInternal) return aInternal - bInternal;
      return String(a.created_at).localeCompare(String(b.created_at));
    });
    return emailMatches[0];
  }

  const supabase = requireSupabase();
  const { data: operator, error } = await supabase
    .from("internal_operators")
    .select("username, email")
    .ilike("email", submittedEmail)
    .maybeSingle();

  if (error && !error.message.includes("email")) {
    throw new Error(error.message);
  }

  if (operator?.username) {
    const user = await findPlatformUserByUsername(String(operator.username));
    if (user?.is_active) {
      const accountEmail = await resolveUserEmail(user);
      if (accountEmail === submittedEmail) return user;
      if (operator.email && normalizeEmail(String(operator.email)) === submittedEmail) {
        return user;
      }
    }
  }

  return null;
}

async function resolveRequestBrand() {
  try {
    const host = getRequestHost({ headers: await headers() });
    const slug = parseClientPlatformSubdomainSafe(host);
    if (!slug) return undefined;
    const workspace = await findWorkspaceBySlug(slug);
    return resolveWorkspaceBrandFor({
      workspace: workspace
        ? { id: workspace.id, slug: workspace.slug, name: workspace.name }
        : null,
      slug,
      name: workspace?.name ?? slug,
    });
  } catch {
    return undefined;
  }
}

async function ensureOtpColumns() {
  const supabase = requireSupabase();
  // Probe by selecting; if columns missing, apply migration SQL via ensure helper path.
  const { error } = await supabase
    .from("platform_password_reset_tokens")
    .select("id, otp_hash, otp_verified_at, otp_attempts")
    .limit(1);
  if (!error) return;
  if (!/otp_hash|otp_verified|otp_attempts|column/i.test(error.message)) {
    // Table may be empty / RLS — ignore non-column errors here
    if (!/does not exist|schema cache/i.test(error.message)) return;
  }
  await ensurePlatformPasswordResetTokensTable();
  // Re-probe — surface a clear error if migration still did not land.
  const { error: after } = await supabase
    .from("platform_password_reset_tokens")
    .select("id, otp_hash, otp_verified_at, otp_attempts")
    .limit(1);
  if (
    after &&
    /otp_hash|otp_verified|otp_attempts|column|schema cache/i.test(after.message)
  ) {
    throw new Error(
      "Password reset is temporarily unavailable (schema update pending). Please try again in a minute.",
    );
  }
}

export async function requestPlatformPasswordReset(input: { email: string }) {
  await ensurePlatformPasswordResetTokensTable();
  await ensureOtpColumns();

  const submittedEmail = normalizeEmail(input.email);

  if (!submittedEmail) {
    throw new Error("Email address is required.");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(submittedEmail)) {
    throw new Error("Please enter a valid email address.");
  }

  const user = await findUserForPasswordResetByEmail(submittedEmail);
  if (!user) {
    return { message: GENERIC_RESET_MESSAGE };
  }

  const accountEmail = (await resolveUserEmail(user)) ?? submittedEmail;

  const token = createResetTokenValue();
  const tokenHash = hashResetToken(token);
  const otp = createOtpCode();
  const otpHash = hashOtp(otp);
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_EXPIRY_MINUTES * 60_000).toISOString();

  await withPlatformPasswordResetTokensTable(async () => {
    const supabase = requireSupabase();

    await supabase
      .from("platform_password_reset_tokens")
      .delete()
      .eq("platform_user_id", user.id)
      .is("used_at", null);

    const { error } = await supabase.from("platform_password_reset_tokens").insert({
      platform_user_id: user.id,
      token_hash: tokenHash,
      otp_hash: otpHash,
      otp_attempts: 0,
      otp_verified_at: null,
      expires_at: expiresAt,
    });

    if (error) throw new Error(error.message);
  });

  const resetUrl = await buildResetUrl(token);
  const brand = await resolveRequestBrand();
  const emailContent = buildPasswordResetEmail({
    displayName: user.display_name,
    resetUrl,
    otp,
    expiresInMinutes: PASSWORD_RESET_EXPIRY_MINUTES,
    brand,
  });

  await sendMailboxEmail({
    account: "info",
    to: accountEmail,
    subject: emailContent.subject,
    html: emailContent.html,
    text: emailContent.text,
  });

  return { message: GENERIC_RESET_MESSAGE };
}

export async function verifyPlatformPasswordResetOtp(input: {
  token?: string;
  email?: string;
  otp: string;
}) {
  await ensurePlatformPasswordResetTokensTable();
  await ensureOtpColumns();

  const otp = input.otp.trim();
  if (!/^\d{6}$/.test(otp)) throw new Error("Enter the 6-digit code from your email.");

  const token = input.token?.trim() ?? "";
  const email = normalizeEmail(input.email ?? "");
  if (!token && !email) {
    throw new Error("Reset link is invalid or has expired.");
  }

  const otpHash = hashOtp(otp);

  return withPlatformPasswordResetTokensTable(async () => {
    const supabase = requireSupabase();

    let tokenRow: {
      id: string;
      expires_at: string;
      used_at: string | null;
      otp_hash: string | null;
      otp_verified_at: string | null;
      otp_attempts: number | null;
      token_hash?: string;
    } | null = null;

    if (token) {
      const tokenHash = hashResetToken(token);
      const { data, error: tokenError } = await supabase
        .from("platform_password_reset_tokens")
        .select("id, expires_at, used_at, otp_hash, otp_verified_at, otp_attempts, token_hash")
        .eq("token_hash", tokenHash)
        .maybeSingle();
      if (tokenError) throw new Error(tokenError.message);
      tokenRow = data;
    } else {
      const user = await findUserForPasswordResetByEmail(email);
      if (!user) {
        throw new Error("That code is incorrect. Check your email and try again.");
      }
      const { data, error: tokenError } = await supabase
        .from("platform_password_reset_tokens")
        .select("id, expires_at, used_at, otp_hash, otp_verified_at, otp_attempts, token_hash")
        .eq("platform_user_id", user.id)
        .is("used_at", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (tokenError) throw new Error(tokenError.message);
      tokenRow = data;
    }

    if (!tokenRow || tokenRow.used_at) {
      throw new Error("Reset link is invalid or has expired.");
    }
    if (new Date(String(tokenRow.expires_at)).getTime() < Date.now()) {
      throw new Error("Reset link has expired. Please request a new one.");
    }

    const attempts = Number(tokenRow.otp_attempts ?? 0);
    if (attempts >= 5) {
      throw new Error("Too many incorrect codes. Please request a new reset email.");
    }

    if (!tokenRow.otp_verified_at) {
      if (!tokenRow.otp_hash || String(tokenRow.otp_hash) !== otpHash) {
        await supabase
          .from("platform_password_reset_tokens")
          .update({ otp_attempts: attempts + 1 })
          .eq("id", tokenRow.id);
        throw new Error("That code is incorrect. Check your email and try again.");
      }
    }

    // Same-page email+OTP flow has no URL token yet — rotate to a continuation token
    // the client can use for the password step (proves mailbox access via OTP).
    let continuationToken = token || "";
    const now = new Date().toISOString();
    if (!continuationToken) {
      continuationToken = createResetTokenValue();
      const { error: rotateError } = await supabase
        .from("platform_password_reset_tokens")
        .update({
          token_hash: hashResetToken(continuationToken),
          otp_verified_at: now,
          otp_attempts: attempts,
        })
        .eq("id", tokenRow.id);
      if (rotateError) throw new Error(rotateError.message);
    } else if (!tokenRow.otp_verified_at) {
      const { error: verifyError } = await supabase
        .from("platform_password_reset_tokens")
        .update({ otp_verified_at: now, otp_attempts: attempts })
        .eq("id", tokenRow.id);
      if (verifyError) throw new Error(verifyError.message);
    }

    return {
      message: "Code verified. Choose your new password.",
      verified: true as const,
      token: continuationToken,
    };
  });
}

export async function completePlatformPasswordReset(input: {
  token: string;
  password: string;
  confirmPassword: string;
}) {
  await ensurePlatformPasswordResetTokensTable();
  await ensureOtpColumns();
  validateNewPassword(input.password, input.confirmPassword);

  const token = input.token.trim();
  if (!token) {
    throw new Error("Reset link is invalid or has expired.");
  }

  const tokenHash = hashResetToken(token);

  return withPlatformPasswordResetTokensTable(async () => {
    const supabase = requireSupabase();

    const { data: tokenRow, error: tokenError } = await supabase
      .from("platform_password_reset_tokens")
      .select("id, platform_user_id, expires_at, used_at, otp_verified_at, otp_hash")
      .eq("token_hash", tokenHash)
      .maybeSingle();

    if (tokenError) throw new Error(tokenError.message);
    if (!tokenRow || tokenRow.used_at) {
      throw new Error("Reset link is invalid or has expired.");
    }
    if (new Date(String(tokenRow.expires_at)).getTime() < Date.now()) {
      throw new Error("Reset link has expired. Please request a new one.");
    }
    // Require OTP when the challenge includes one (new flow).
    if (tokenRow.otp_hash && !tokenRow.otp_verified_at) {
      throw new Error("Enter the one-time code from your email before setting a new password.");
    }

    const { data: user, error: userError } = await supabase
      .from("platform_users")
      .select("*")
      .eq("id", tokenRow.platform_user_id)
      .eq("is_active", true)
      .maybeSingle();

    if (userError) throw new Error(userError.message);
    if (!user) {
      throw new Error("Reset link is invalid or has expired.");
    }

    const platformUser = user as PlatformUserRecord;
    const passwordHash = hashPlatformPasswordForUser(platformUser.username, input.password);
    const now = new Date().toISOString();

    const { error: updateUserError } = await supabase
      .from("platform_users")
      .update({ password_hash: passwordHash, updated_at: now })
      .eq("id", platformUser.id);

    if (updateUserError) throw new Error(updateUserError.message);

    const { error: markUsedError } = await supabase
      .from("platform_password_reset_tokens")
      .update({ used_at: now })
      .eq("id", tokenRow.id);

    if (markUsedError) throw new Error(markUsedError.message);

    const accountEmail = await resolveUserEmail(platformUser);
    if (accountEmail) {
      const brand = await resolveRequestBrand();
      const loginUrl = await buildLoginUrl();
      const confirmation = buildPasswordResetConfirmationEmail({
        displayName: platformUser.display_name,
        loginUrl,
        brand,
      });
      try {
        await sendMailboxEmail({
          account: "info",
          to: accountEmail,
          subject: confirmation.subject,
          html: confirmation.html,
          text: confirmation.text,
        });
      } catch {
        // Password already saved — do not fail the reset if confirmation email fails.
      }
    }

    return {
      message:
        "Your password has been updated. Check your email for confirmation, then sign in with your new password.",
    };
  });
}
