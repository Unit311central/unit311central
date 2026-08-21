import { NextRequest, NextResponse } from "next/server";

import {
  applySalesManagementFoundationMigration,
  getMigrationReadiness,
  SALES_MANAGEMENT_FOUNDATION_MIGRATION_PATH,
} from "@/lib/internal-db-migrations";

export const dynamic = "force-dynamic";

function isAuthorized(request: NextRequest) {
  const auth = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET?.trim();
  const setupSecret = process.env.INTERNAL_FILES_SETUP_SECRET?.trim();
  if (cronSecret && auth === `Bearer ${cronSecret}`) return true;
  if (setupSecret && auth === `Bearer ${setupSecret}`) return true;
  if (setupSecret && request.headers.get("x-setup-secret") === setupSecret) return true;
  if (request.headers.get("x-vercel-cron-auth-token")) return true;
  return false;
}

async function applyViaPendingMigrationsEndpoint(request: NextRequest) {
  const setupSecret = process.env.INTERNAL_FILES_SETUP_SECRET?.trim();
  if (!setupSecret) return null;

  const origin = new URL(request.url).origin;
  const response = await fetch(`${origin}/api/internal/apply-unit311central-pending-migrations`, {
    method: "POST",
    headers: {
      "x-setup-secret": setupSecret,
      "Content-Type": "application/json",
    },
  });
  const body = (await response.json().catch(() => null)) as {
    ok?: boolean;
    applied?: Array<{ migration: string; method: string }>;
    errors?: Array<{ migration: string; method: string; data?: unknown }>;
  } | null;

  return {
    status: response.status,
    ok: Boolean(body?.ok),
    applied149: (body?.applied ?? []).some(
      (entry) => entry.migration === SALES_MANAGEMENT_FOUNDATION_MIGRATION_PATH,
    ),
    error149: (body?.errors ?? []).find(
      (entry) => entry.migration === SALES_MANAGEMENT_FOUNDATION_MIGRATION_PATH,
    ),
  };
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const pending = await applyViaPendingMigrationsEndpoint(request);
    const applied = await applySalesManagementFoundationMigration();
    return NextResponse.json({
      ok: applied.ok,
      migration: SALES_MANAGEMENT_FOUNDATION_MIGRATION_PATH,
      applied,
      readiness: getMigrationReadiness(),
      pendingEndpoint: pending,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Sales management foundation ensure failed.",
      },
      { status: 500 },
    );
  }
}
