import { NextRequest, NextResponse } from "next/server";

import {
  getExpenseRun,
  refreshExpenseRunTotals,
  updateExpenseRunStatus,
} from "@/lib/expense-management/runs-service";
import type { ExpenseRunStatus } from "@/lib/expense-management/types";
import { requirePlatformSession } from "@/lib/platform-session";
import { requireCurrentWorkspace } from "@/lib/workspace-context";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    await requirePlatformSession();
    const workspace = await requireCurrentWorkspace();
    const { id } = await context.params;
    const run = await getExpenseRun(workspace.id, id);
    if (!run) return NextResponse.json({ error: "Expense run not found" }, { status: 404 });
    return NextResponse.json({ run });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load expense run";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    await requirePlatformSession();
    const workspace = await requireCurrentWorkspace();
    const { id } = await context.params;
    const body = (await request.json()) as {
      status?: ExpenseRunStatus;
      paymentReference?: string | null;
      action?: string;
    };

    if (body.action === "refresh_totals") {
      const run = await refreshExpenseRunTotals(workspace.id, id);
      return NextResponse.json({ run });
    }

    if (!body.status) {
      return NextResponse.json({ error: "status is required" }, { status: 400 });
    }

    const run = await updateExpenseRunStatus(workspace.id, id, body.status, {
      paymentReference: body.paymentReference,
    });
    return NextResponse.json({ run });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update expense run";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
