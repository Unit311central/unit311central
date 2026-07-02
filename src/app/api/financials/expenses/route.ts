import { NextRequest, NextResponse } from "next/server";

import type { ExpenseCurrency } from "@/lib/expenses-data";
import { createExpense, listExpenses } from "@/lib/financial-expenses-service";
import { ensureFinancialExpensesTable } from "@/lib/internal-db-migrations";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    await ensureFinancialExpensesTable();
    const expenses = await listExpenses();
    return NextResponse.json({ expenses });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load expenses";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    const body = (await request.json()) as {
      submitterUserId?: string;
      purposeDescription?: string;
      amount?: number;
      currency?: ExpenseCurrency;
      dateSubmitted?: string;
      paid?: boolean;
    };

    if (!body.submitterUserId?.trim()) {
      return NextResponse.json({ error: "Submitter is required" }, { status: 400 });
    }
    if (!body.purposeDescription?.trim()) {
      return NextResponse.json({ error: "Purpose description is required" }, { status: 400 });
    }
    if (body.amount === undefined || Number.isNaN(body.amount) || body.amount < 0) {
      return NextResponse.json({ error: "Valid amount is required" }, { status: 400 });
    }

    await ensureFinancialExpensesTable();
    const expense = await createExpense({
      submitterUserId: body.submitterUserId,
      purposeDescription: body.purposeDescription,
      amount: body.amount,
      currency: body.currency,
      dateSubmitted: body.dateSubmitted,
      paid: body.paid,
    });

    return NextResponse.json({ expense });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create expense";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
