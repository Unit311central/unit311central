import { NextRequest, NextResponse } from "next/server";

import { validateEmployeeCsv } from "@/lib/platform-workspaces/csv-import";
import { requireInternalWorkspacesAccess } from "@/lib/platform-workspaces/internal-workspaces-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const auth = await requireInternalWorkspacesAccess(request);
  if ("error" in auth) return auth.error;

  const body = (await request.json().catch(() => null)) as { csv?: string } | null;
  const csv = body?.csv ?? "";
  const result = validateEmployeeCsv(csv);
  return NextResponse.json(result);
}
