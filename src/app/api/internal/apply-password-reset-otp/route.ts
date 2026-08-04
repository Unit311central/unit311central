import { NextRequest, NextResponse } from "next/server";

import {
  PLATFORM_PASSWORD_RESET_OTP_MIGRATION_PATH,
  ensurePlatformPasswordResetTokensTable,
  reloadPostgrestSchema,
} from "@/lib/internal-db-migrations";

export const dynamic = "force-dynamic";

function isAuthorized(request: NextRequest) {
  const secret = process.env.INTERNAL_FILES_SETUP_SECRET?.trim();
  if (!secret) return false;
  const header = request.headers.get("authorization");
  if (header === `Bearer ${secret}`) return true;
  return request.headers.get("x-setup-secret") === secret;
}

/**
 * One-shot: ensure platform_password_reset_tokens OTP columns exist + reload PostgREST.
 */
export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const applied = await ensurePlatformPasswordResetTokensTable();
    await reloadPostgrestSchema();
    return NextResponse.json({
      ok: true,
      applied,
      migration: PLATFORM_PASSWORD_RESET_OTP_MIGRATION_PATH,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to apply OTP migration.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
