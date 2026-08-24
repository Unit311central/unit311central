import type { ExpenseNotification } from "@/lib/expense-management/types";
import { createTenancyServerClient } from "@/lib/supabase/tenancy-server";
import { isSupabaseConfigured } from "@/lib/supabase/server";

function requireSupabase() {
  if (!isSupabaseConfigured()) throw new Error("Supabase is not configured.");
  return createTenancyServerClient();
}

function mapNotification(row: Record<string, unknown>): ExpenseNotification {
  return {
    id: String(row.id),
    workspaceId: String(row.workspace_id),
    recipientUserId: String(row.recipient_user_id),
    expenseId: row.expense_id ? String(row.expense_id) : null,
    kind: String(row.kind),
    message: String(row.message),
    readAt: row.read_at ? String(row.read_at) : null,
    createdAt: String(row.created_at),
  };
}

export async function createExpenseNotification(input: {
  workspaceId: string;
  recipientUserId: string;
  expenseId?: string | null;
  kind: string;
  message: string;
}) {
  const supabase = requireSupabase();
  const { error } = await supabase.from("expense_notifications").insert({
    workspace_id: input.workspaceId,
    recipient_user_id: input.recipientUserId,
    expense_id: input.expenseId ?? null,
    kind: input.kind,
    message: input.message,
  });
  if (error) throw new Error(error.message);
}

export async function listExpenseNotifications(
  workspaceId: string,
  recipientUserId: string,
): Promise<ExpenseNotification[]> {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("expense_notifications")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("recipient_user_id", recipientUserId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapNotification);
}

export async function notifyExpensePaid(input: {
  workspaceId: string;
  recipientUserId: string;
  expenseId: string;
  expenseNumber: string;
  amount: number;
  currency: string;
  paidDate: string;
}) {
  await createExpenseNotification({
    workspaceId: input.workspaceId,
    recipientUserId: input.recipientUserId,
    expenseId: input.expenseId,
    kind: "paid",
    message: `Your expense ${input.expenseNumber} for ${input.currency} ${input.amount.toFixed(2)} was paid on ${input.paidDate}.`,
  });
}
