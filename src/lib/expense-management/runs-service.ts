import type { ExpenseRun, ExpenseRunStatus } from "@/lib/expense-management/types";
import {
  buildExpenseRunLabel,
  calculateExpectedPaymentDate,
  periodBoundsForPaymentMonth,
} from "@/lib/expense-management/payment-schedule";
import { getExpensePaymentSchedule } from "@/lib/expense-management/config-service";
import { createTenancyServerClient } from "@/lib/supabase/tenancy-server";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { resolveWorkspaceReportingCurrency } from "@/lib/workspace-reporting-currency-server";

function requireSupabase() {
  if (!isSupabaseConfigured()) throw new Error("Supabase is not configured.");
  return createTenancyServerClient();
}

function mapRun(row: Record<string, unknown>): ExpenseRun {
  return {
    id: String(row.id),
    workspaceId: String(row.workspace_id),
    label: String(row.label),
    periodStart: String(row.period_start),
    periodEnd: String(row.period_end),
    cutoffDate: String(row.cutoff_date),
    paymentDate: String(row.payment_date),
    status: row.status as ExpenseRunStatus,
    totalAmount: Number(row.total_amount ?? 0),
    currency: String(row.currency ?? "USD"),
    expenseCount: Number(row.expense_count ?? 0),
    paymentReference: row.payment_reference ? String(row.payment_reference) : null,
    paidAt: row.paid_at ? String(row.paid_at) : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export async function listExpenseRuns(workspaceId: string): Promise<ExpenseRun[]> {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("expense_runs")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("payment_date", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapRun);
}

export async function getExpenseRun(workspaceId: string, runId: string): Promise<ExpenseRun | null> {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("expense_runs")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("id", runId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapRun(data) : null;
}

export async function ensureOpenExpenseRun(workspaceId: string, workspaceSlug?: string): Promise<ExpenseRun> {
  const supabase = requireSupabase();
  const schedule = await getExpensePaymentSchedule(workspaceId);
  const paymentDate = calculateExpectedPaymentDate(schedule);
  const { periodStart, periodEnd } = periodBoundsForPaymentMonth(paymentDate);
  const cutoffDate = `${paymentDate.slice(0, 8)}${String(schedule.cutoffDay).padStart(2, "0").slice(-2)}`;
  const currency = await resolveWorkspaceReportingCurrency(workspaceId, workspaceSlug);

  const { data: existing } = await supabase
    .from("expense_runs")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("payment_date", paymentDate)
    .maybeSingle();

  if (existing) return mapRun(existing);

  const label = buildExpenseRunLabel(paymentDate);
  const { data, error } = await supabase
    .from("expense_runs")
    .insert({
      workspace_id: workspaceId,
      label,
      period_start: periodStart,
      period_end: periodEnd,
      cutoff_date: cutoffDate.length === 10 ? cutoffDate : paymentDate,
      payment_date: paymentDate,
      status: "open",
      currency,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return mapRun(data);
}

export async function refreshExpenseRunTotals(workspaceId: string, runId: string): Promise<ExpenseRun> {
  const supabase = requireSupabase();
  const { data: expenses, error: listError } = await supabase
    .from("financial_expenses")
    .select("amount, currency")
    .eq("workspace_id", workspaceId)
    .eq("expense_run_id", runId);
  if (listError) throw new Error(listError.message);

  const total = (expenses ?? []).reduce((sum, row) => sum + Number(row.amount ?? 0), 0);
  const count = expenses?.length ?? 0;

  const { data, error } = await supabase
    .from("expense_runs")
    .update({
      total_amount: Math.round(total * 100) / 100,
      expense_count: count,
      updated_at: new Date().toISOString(),
    })
    .eq("workspace_id", workspaceId)
    .eq("id", runId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return mapRun(data);
}

export async function updateExpenseRunStatus(
  workspaceId: string,
  runId: string,
  status: ExpenseRunStatus,
  patch?: { paymentReference?: string | null },
): Promise<ExpenseRun> {
  const supabase = requireSupabase();
  const payload: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };
  if (patch?.paymentReference !== undefined) {
    payload.payment_reference = patch.paymentReference;
  }
  if (status === "paid") {
    payload.paid_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("expense_runs")
    .update(payload)
    .eq("workspace_id", workspaceId)
    .eq("id", runId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  if (status === "paid") {
    await supabase
      .from("financial_expenses")
      .update({
        workflow_status: "paid",
        paid: true,
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("workspace_id", workspaceId)
      .eq("expense_run_id", runId);
  }

  return mapRun(data);
}

export async function assignExpenseToRun(
  workspaceId: string,
  expenseId: string,
  runId: string,
  expectedPaymentDate: string,
) {
  const supabase = requireSupabase();
  const { error } = await supabase
    .from("financial_expenses")
    .update({
      expense_run_id: runId,
      workflow_status: "scheduled",
      expected_payment_date: expectedPaymentDate,
      updated_at: new Date().toISOString(),
    })
    .eq("workspace_id", workspaceId)
    .eq("id", expenseId);
  if (error) throw new Error(error.message);
  await refreshExpenseRunTotals(workspaceId, runId);
}
