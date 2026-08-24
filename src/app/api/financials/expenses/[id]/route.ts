import { assertDemoMutationAllowedForRequest } from "@/lib/demo/mutation-guard";
import { NextRequest, NextResponse } from "next/server";

import type { ExpenseCurrency } from "@/lib/expenses-data";
import { deleteExpense, getExpense, updateExpense } from "@/lib/financial-expenses-service";
import { requirePlatformSession } from "@/lib/platform-session";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { requireCurrentWorkspace } from "@/lib/workspace-context";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    await requirePlatformSession();
    const workspace = await requireCurrentWorkspace();
    const { id } = await context.params;
    const expense = await getExpense(id, { workspaceId: workspace.id });
    if (!expense) return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    return NextResponse.json({ expense });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load expense";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const demoMutationBlock = await assertDemoMutationAllowedForRequest(request);
  if (demoMutationBlock) return demoMutationBlock;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    await requirePlatformSession();
    const workspace = await requireCurrentWorkspace();
    const { id } = await context.params;
    const body = (await request.json()) as {
      submitterUserId?: string;
      purposeDescription?: string;
      description?: string;
      amount?: number;
      currency?: ExpenseCurrency;
      dateSubmitted?: string;
      paid?: boolean;
      supplier?: string | null;
      categoryAccountCode?: string | null;
      expenseDate?: string;
      paymentMethod?: string | null;
      reference?: string | null;
      attachmentPath?: string | null;
      recordStatus?: "draft" | "finalized";
      reimbursable?: boolean;
      claimantEmployeeId?: string | null;
      expenseCategoryId?: string | null;
      billingCodeId?: string | null;
      expenseType?: "standard" | "mileage";
      mileageFrom?: string | null;
      mileageTo?: string | null;
      mileageDistance?: number | null;
      mileageDistanceUnit?: "miles" | "kilometres" | null;
      mileageRate?: number | null;
      mileageCalculatedAmount?: number | null;
    };

    const expense = await updateExpense(id, body, { workspaceId: workspace.id });
    return NextResponse.json({ expense });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update expense";
    const status =
      message.includes("Authentication required") || message.includes("Workspace context")
        ? 401
        : 500;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const demoMutationBlock = await assertDemoMutationAllowedForRequest(request);
  if (demoMutationBlock) return demoMutationBlock;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    await requirePlatformSession();
    const workspace = await requireCurrentWorkspace();
    const { id } = await context.params;
    await deleteExpense(id, { workspaceId: workspace.id });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete expense";
    const status =
      message.includes("Authentication required") || message.includes("Workspace context")
        ? 401
        : 500;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
