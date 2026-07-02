import {
  createBlankExpenseInput,
  getInternalUserById,
  mapFinancialExpense,
  type ExpenseCurrency,
  type FinancialExpense,
} from "@/lib/expenses-data";
import {
  ensureFinancialExpensesTable,
  withFinancialExpensesTable,
} from "@/lib/internal-db-migrations";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

type DbExpense = Parameters<typeof mapFinancialExpense>[0];

function requireExpensesSupabase() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY.");
  }
  return createSupabaseServerClient();
}

export async function listExpenses(): Promise<FinancialExpense[]> {
  await ensureFinancialExpensesTable();
  return withFinancialExpensesTable(async () => {
    const supabase = requireExpensesSupabase();
    const { data, error } = await supabase
      .from("financial_expenses")
      .select("*")
      .order("date_submitted", { ascending: false });

    if (error) throw new Error(error.message);
    return (data as DbExpense[]).map(mapFinancialExpense);
  });
}

export async function createExpense(
  input: Partial<ReturnType<typeof createBlankExpenseInput>> & {
    submitterUserId: string;
    purposeDescription: string;
    amount: number;
  },
): Promise<FinancialExpense> {
  await ensureFinancialExpensesTable();
  return withFinancialExpensesTable(async () => {
    const supabase = requireExpensesSupabase();
    const user = getInternalUserById(input.submitterUserId);
    const submitterName = user?.fullName ?? input.submitterName?.trim() ?? "Unknown";

    const { data, error } = await supabase
      .from("financial_expenses")
      .insert({
        submitter_user_id: input.submitterUserId,
        submitter_name: submitterName,
        purpose_description: input.purposeDescription.trim(),
        amount: input.amount,
        currency: input.currency ?? "EUR",
        date_submitted: input.dateSubmitted ?? new Date().toISOString().slice(0, 10),
        paid: input.paid ?? false,
      })
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    return mapFinancialExpense(data as DbExpense);
  });
}

export async function updateExpense(
  id: string,
  patch: Partial<{
    submitterUserId: string;
    purposeDescription: string;
    amount: number;
    currency: ExpenseCurrency;
    dateSubmitted: string;
    paid: boolean;
  }>,
): Promise<FinancialExpense> {
  return withFinancialExpensesTable(async () => {
    const supabase = requireExpensesSupabase();
    const payload: Record<string, string | number | boolean | null> = {
      updated_at: new Date().toISOString(),
    };

    if (patch.submitterUserId !== undefined) {
      const user = getInternalUserById(patch.submitterUserId);
      payload.submitter_user_id = patch.submitterUserId;
      payload.submitter_name = user?.fullName ?? "Unknown";
    }
    if (patch.purposeDescription !== undefined) {
      payload.purpose_description = patch.purposeDescription.trim();
    }
    if (patch.amount !== undefined) payload.amount = patch.amount;
    if (patch.currency !== undefined) payload.currency = patch.currency;
    if (patch.dateSubmitted !== undefined) payload.date_submitted = patch.dateSubmitted;
    if (patch.paid !== undefined) payload.paid = patch.paid;

    const { data, error } = await supabase
      .from("financial_expenses")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    return mapFinancialExpense(data as DbExpense);
  });
}

export async function deleteExpense(id: string) {
  return withFinancialExpensesTable(async () => {
    const supabase = requireExpensesSupabase();
    const { error } = await supabase.from("financial_expenses").delete().eq("id", id);
    if (error) throw new Error(error.message);
  });
}
