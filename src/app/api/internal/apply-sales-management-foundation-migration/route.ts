import { assertDemoMutationAllowedForRequest } from "@/lib/demo/mutation-guard";
import { NextRequest, NextResponse } from "next/server";

import {
  ensureSalesManagementFoundationTables,
  reloadPostgrestSchema,
  SALES_MANAGEMENT_FOUNDATION_MIGRATION_PATH,
} from "@/lib/internal-db-migrations";

export const dynamic = "force-dynamic";

function isAuthorized(request: NextRequest) {
  const secret = process.env.INTERNAL_FILES_SETUP_SECRET?.trim();
  if (!secret) return false;
  const header = request.headers.get("authorization");
  if (header === `Bearer ${secret}`) return true;
  return request.headers.get("x-setup-secret") === secret;
}

/** One-shot: sales teams, targets, commissions foundation (migration 149). */
export async function POST(request: NextRequest) {
  const demoMutationBlock = await assertDemoMutationAllowedForRequest(request);
  if (demoMutationBlock) return demoMutationBlock;

  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const applied = await ensureSalesManagementFoundationTables();
    await reloadPostgrestSchema();
    return NextResponse.json({
      ok: applied,
      applied,
      migration: SALES_MANAGEMENT_FOUNDATION_MIGRATION_PATH,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to apply sales management foundation migration.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
