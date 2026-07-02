import { NextRequest, NextResponse } from "next/server";

import type { ExpenseCurrency } from "@/lib/expenses-data";
import { deleteExpense, updateExpense } from "@/lib/financial-expenses-service";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    const { id } = await context.params;
    const body = (await request.json()) as {
      submitterUserId?: string;
      purposeDescription?: string;
      amount?: number;
      currency?: ExpenseCurrency;
      dateSubmitted?: string;
      paid?: boolean;
    };

    const expense = await updateExpense(id, body);
    return NextResponse.json({ expense });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update expense";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    const { id } = await context.params;
    await deleteExpense(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete expense";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
