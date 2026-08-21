import { NextRequest, NextResponse } from "next/server";

import {
  ensureSalesManagementFoundationTables,
  reloadPostgrestSchema,
  SALES_MANAGEMENT_FOUNDATION_MIGRATION_PATH,
} from "@/lib/internal-db-migrations";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET?.trim();
  const setupSecret = process.env.INTERNAL_FILES_SETUP_SECRET?.trim();
  const allowed =
    (cronSecret && auth === `Bearer ${cronSecret}`) ||
    (setupSecret && auth === `Bearer ${setupSecret}`);

  if (!allowed) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
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
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Sales management foundation ensure failed.",
      },
      { status: 500 },
    );
  }
}
