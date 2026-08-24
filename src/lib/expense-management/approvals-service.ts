import type { ExpenseApprovalEvent } from "@/lib/expense-management/types";
import { assignExpenseToRun, ensureOpenExpenseRun } from "@/lib/expense-management/runs-service";
import { getExpensePaymentSchedule } from "@/lib/expense-management/config-service";
import { calculateExpectedPaymentDate } from "@/lib/expense-management/payment-schedule";
import { createExpenseNotification } from "@/lib/expense-management/notifications-service";
import { createTenancyServerClient } from "@/lib/supabase/tenancy-server";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { getExpense, updateExpense } from "@/lib/financial-expenses-service";

function requireSupabase() {
  if (!isSupabaseConfigured()) throw new Error("Supabase is not configured.");
  return createTenancyServerClient();
}

function mapEvent(row: Record<string, unknown>): ExpenseApprovalEvent {
  return {
    id: String(row.id),
    workspaceId: String(row.workspace_id),
    expenseId: String(row.expense_id),
    actorUserId: String(row.actor_user_id),
    actorName: String(row.actor_name ?? ""),
    action: String(row.action),
    comment: row.comment ? String(row.comment) : null,
    createdAt: String(row.created_at),
  };
}

export async function listExpenseApprovalEvents(
  workspaceId: string,
  expenseId: string,
): Promise<ExpenseApprovalEvent[]> {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("expense_approval_events")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("expense_id", expenseId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapEvent);
}

async function recordApprovalEvent(input: {
  workspaceId: string;
  expenseId: string;
  actorUserId: string;
  actorName: string;
  action: string;
  comment?: string | null;
}) {
  const supabase = requireSupabase();
  const { error } = await supabase.from("expense_approval_events").insert({
    workspace_id: input.workspaceId,
    expense_id: input.expenseId,
    actor_user_id: input.actorUserId,
    actor_name: input.actorName,
    action: input.action,
    comment: input.comment ?? null,
  });
  if (error) throw new Error(error.message);
}

export async function submitExpenseForApproval(
  expenseId: string,
  workspaceId: string,
  actor: { userId: string; displayName: string },
) {
  const expense = await getExpense(expenseId, { workspaceId });
  if (!expense) throw new Error("Expense not found.");
  if (expense.workflowStatus !== "draft" && expense.workflowStatus !== "changes_requested") {
    throw new Error("Only draft or changes-requested expenses can be submitted.");
  }

  const schedule = await getExpensePaymentSchedule(workspaceId);
  const expectedPaymentDate = calculateExpectedPaymentDate(schedule);

  await updateExpense(
    expenseId,
    {
      recordStatus: "finalized",
      reimbursable: true,
      paymentMethod: "personally_paid",
    },
    { workspaceId },
  );

  const supabase = requireSupabase();
  const { error } = await supabase
    .from("financial_expenses")
    .update({
      workflow_status: "submitted",
      submitted_at: new Date().toISOString(),
      expected_payment_date: expectedPaymentDate,
      description: expense.description || expense.purposeDescription,
      updated_at: new Date().toISOString(),
    })
    .eq("id", expenseId)
    .eq("workspace_id", workspaceId);
  if (error) throw new Error(error.message);

  await recordApprovalEvent({
    workspaceId,
    expenseId,
    actorUserId: actor.userId,
    actorName: actor.displayName,
    action: expense.workflowStatus === "changes_requested" ? "resubmitted" : "submitted",
  });
}

export async function approveExpense(
  expenseId: string,
  workspaceId: string,
  workspaceSlug: string,
  actor: { userId: string; displayName: string },
  comment?: string,
) {
  const expense = await getExpense(expenseId, { workspaceId });
  if (!expense) throw new Error("Expense not found.");

  const schedule = await getExpensePaymentSchedule(workspaceId);
  const expectedPaymentDate =
    expense.expectedPaymentDate ?? calculateExpectedPaymentDate(schedule);
  const run = await ensureOpenExpenseRun(workspaceId, workspaceSlug);

  const supabase = requireSupabase();
  const { error } = await supabase
    .from("financial_expenses")
    .update({
      workflow_status: "approved",
      approved_at: new Date().toISOString(),
      expected_payment_date: expectedPaymentDate,
      updated_at: new Date().toISOString(),
    })
    .eq("id", expenseId)
    .eq("workspace_id", workspaceId);
  if (error) throw new Error(error.message);

  await recordApprovalEvent({
    workspaceId,
    expenseId,
    actorUserId: actor.userId,
    actorName: actor.displayName,
    action: "approved",
    comment,
  });

  await createExpenseNotification({
    workspaceId,
    recipientUserId: expense.submitterUserId,
    expenseId,
    kind: "approved",
    message: `Your expense ${expense.expenseNumber ?? expense.id.slice(0, 8)} was approved. Expected payment: ${expectedPaymentDate}.`,
  });
}

export async function rejectExpense(
  expenseId: string,
  workspaceId: string,
  actor: { userId: string; displayName: string },
  comment?: string,
) {
  const expense = await getExpense(expenseId, { workspaceId });
  if (!expense) throw new Error("Expense not found.");

  const supabase = requireSupabase();
  const { error } = await supabase
    .from("financial_expenses")
    .update({
      workflow_status: "rejected",
      updated_at: new Date().toISOString(),
    })
    .eq("id", expenseId)
    .eq("workspace_id", workspaceId);
  if (error) throw new Error(error.message);

  await recordApprovalEvent({
    workspaceId,
    expenseId,
    actorUserId: actor.userId,
    actorName: actor.displayName,
    action: "rejected",
    comment,
  });

  await createExpenseNotification({
    workspaceId,
    recipientUserId: expense.submitterUserId,
    expenseId,
    kind: "rejected",
    message: `Your expense ${expense.expenseNumber ?? ""} was rejected.${comment ? ` Reason: ${comment}` : ""}`,
  });
}

export async function requestExpenseChanges(
  expenseId: string,
  workspaceId: string,
  actor: { userId: string; displayName: string },
  comment?: string,
) {
  const expense = await getExpense(expenseId, { workspaceId });
  if (!expense) throw new Error("Expense not found.");

  const supabase = requireSupabase();
  const { error } = await supabase
    .from("financial_expenses")
    .update({
      workflow_status: "changes_requested",
      record_status: "draft",
      updated_at: new Date().toISOString(),
    })
    .eq("id", expenseId)
    .eq("workspace_id", workspaceId);
  if (error) throw new Error(error.message);

  await recordApprovalEvent({
    workspaceId,
    expenseId,
    actorUserId: actor.userId,
    actorName: actor.displayName,
    action: "changes_requested",
    comment,
  });

  await createExpenseNotification({
    workspaceId,
    recipientUserId: expense.submitterUserId,
    expenseId,
    kind: "changes_requested",
    message: `Changes requested on expense ${expense.expenseNumber ?? ""}.${comment ? ` ${comment}` : ""}`,
  });
}

export async function scheduleApprovedExpense(
  expenseId: string,
  workspaceId: string,
  workspaceSlug: string,
) {
  const expense = await getExpense(expenseId, { workspaceId });
  if (!expense || expense.workflowStatus !== "approved") return;

  const schedule = await getExpensePaymentSchedule(workspaceId);
  const expectedPaymentDate =
    expense.expectedPaymentDate ?? calculateExpectedPaymentDate(schedule);
  const run = await ensureOpenExpenseRun(workspaceId, workspaceSlug);
  await assignExpenseToRun(workspaceId, expenseId, run.id, expectedPaymentDate);

  await createExpenseNotification({
    workspaceId,
    recipientUserId: expense.submitterUserId,
    expenseId,
    kind: "scheduled",
    message: `Your expense ${expense.expenseNumber ?? ""} is scheduled for payment on ${expectedPaymentDate}.`,
  });
}
