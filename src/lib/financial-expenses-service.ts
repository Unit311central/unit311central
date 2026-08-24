import {
  postExpenseJournal,
  postExpensePaymentJournal,
} from "@/lib/accounting/posting-rules";
import {
  createBlankExpenseInput,
  getInternalUserById,
  mapFinancialExpense,
  type ExpenseCurrency,
  type ExpenseRecordStatus,
  type ExpenseType,
  type ExpenseWorkflowStatus,
  type FinancialExpense,
} from "@/lib/expenses-data";
import type { BulkExpenseSaveMode } from "@/lib/expenses-bulk-entry";
import {
  resolveFinancialsWorkspaceId,
  type FinancialsWorkspaceScope,
} from "@/lib/financials-workspace";
import { resolveWorkspaceReportingCurrency } from "@/lib/workspace-reporting-currency-server";
import { TALANTON_EXPENSE_FIXTURES } from "@/lib/talanton/expenses-fixtures";
import { ABHI_EXPENSE_FIXTURES } from "@/lib/abhi/expenses-fixtures";
import { isAbhiWorkspaceSlug } from "@/lib/abhi-financials";
import { isTalantonWorkspaceSlug } from "@/lib/talanton-financials";
import {
  ensureFinancialExpensesTable,
  withFinancialExpensesTable,
} from "@/lib/internal-db-migrations";
import { createTenancyServerClient } from "@/lib/supabase/tenancy-server";
import { isSupabaseConfigured } from "@/lib/supabase/server";

type DbExpense = Parameters<typeof mapFinancialExpense>[0];

async function allocateExpenseNumber(workspaceId: string): Promise<string> {
  const supabase = requireExpensesSupabase();
  const { data: existing } = await supabase
    .from("expense_number_seq")
    .select("next_value")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  let next = existing?.next_value ?? 1;
  if (!existing) {
    await supabase.from("expense_number_seq").insert({
      workspace_id: workspaceId,
      next_value: 2,
    });
  } else {
    await supabase
      .from("expense_number_seq")
      .update({ next_value: next + 1 })
      .eq("workspace_id", workspaceId);
  }
  return `EXP-${String(next).padStart(5, "0")}`;
}

export async function findHrEmployeeIdForPlatformUser(
  workspaceId: string,
  platformUserId: string,
): Promise<string | null> {
  const supabase = requireExpensesSupabase();
  const { data, error } = await supabase
    .from("hr_employees")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("platform_user_id", platformUserId)
    .maybeSingle();
  if (error) return null;
  return data?.id ? String(data.id) : null;
}

export async function listMyExpenses(
  platformUserId: string,
  scope?: ExpensesWorkspaceScope,
): Promise<FinancialExpense[]> {
  const all = await listExpenses(scope);
  return all.filter((expense) => expense.submitterUserId === platformUserId);
}

export type ExpensesWorkspaceScope = FinancialsWorkspaceScope;

function requireExpensesSupabase() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY.");
  }
  return createTenancyServerClient();
}

export async function listExpenses(
  scope?: ExpensesWorkspaceScope,
): Promise<FinancialExpense[]> {
  const workspaceId = await resolveFinancialsWorkspaceId(scope);
  let workspaceSlug = String(scope?.workspaceSlug ?? "").trim().toLowerCase();
  if (!workspaceSlug) {
    try {
      const supabase = requireExpensesSupabase();
      const { data } = await supabase
        .from("workspaces")
        .select("slug")
        .eq("id", workspaceId)
        .maybeSingle();
      workspaceSlug = String(data?.slug ?? "").trim().toLowerCase();
    } catch {
      workspaceSlug = "";
    }
  }
  // Table ensure is memoized; withFinancialExpensesTable retries if missing.
  return withFinancialExpensesTable(async () => {
    const supabase = requireExpensesSupabase();
    const { data, error } = await supabase
      .from("financial_expenses")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("date_submitted", { ascending: false });

    if (error) throw new Error(error.message);
    const rows = (data as DbExpense[]).map(mapFinancialExpense);
    if (isTalantonWorkspaceSlug(workspaceSlug)) {
      const talantonOnly = rows.filter(
        (expense) => String(expense.currency || "").toUpperCase() === "USD",
      );
      if (talantonOnly.length > 0) return talantonOnly;
      return TALANTON_EXPENSE_FIXTURES;
    }
    if (isAbhiWorkspaceSlug(workspaceSlug)) {
      return ABHI_EXPENSE_FIXTURES;
    }
    return rows;
  });
}

export async function getExpense(
  id: string,
  scope?: ExpensesWorkspaceScope,
): Promise<FinancialExpense | null> {
  const workspaceId = await resolveFinancialsWorkspaceId(scope);
  await ensureFinancialExpensesTable();
  return withFinancialExpensesTable(async () => {
    const supabase = requireExpensesSupabase();
    const { data, error } = await supabase
      .from("financial_expenses")
      .select("*")
      .eq("id", id)
      .eq("workspace_id", workspaceId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? mapFinancialExpense(data as DbExpense) : null;
  });
}

async function requireExpenseInWorkspace(id: string, scope?: ExpensesWorkspaceScope) {
  const expense = await getExpense(id, scope);
  if (!expense) throw new Error("Expense not found.");
  return expense;
}

async function findDuplicateExpense(
  workspaceId: string,
  input: {
    reference: string | null;
    supplier: string | null;
    expenseId?: string | null;
  },
) {
  const reference = String(input.reference ?? "").trim();
  if (!reference) return null;

  const supabase = requireExpensesSupabase();
  let query = supabase
    .from("financial_expenses")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("reference", reference);

  const supplier = String(input.supplier ?? "").trim();
  if (supplier) {
    query = query.eq("supplier", supplier);
  }

  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(error.message);
  if (!data?.id) return null;
  if (input.expenseId && String(data.id) === input.expenseId) return null;
  return String(data.id);
}

export async function createExpense(
  input: Partial<ReturnType<typeof createBlankExpenseInput>> & {
    submitterUserId: string;
    purposeDescription?: string;
    description?: string;
    amount: number;
    workspaceId?: string;
    recordStatus?: ExpenseRecordStatus;
    workflowStatus?: ExpenseWorkflowStatus;
    reimbursable?: boolean;
    paymentMethod?: string | null;
    reference?: string | null;
    attachmentPath?: string | null;
    claimantEmployeeId?: string | null;
    expenseCategoryId?: string | null;
    billingCodeId?: string | null;
    expectedPaymentDate?: string | null;
    expenseType?: ExpenseType;
    mileageFrom?: string | null;
    mileageTo?: string | null;
    mileageDistance?: number | null;
    mileageDistanceUnit?: "miles" | "kilometres" | null;
    mileageRate?: number | null;
    mileageCalculatedAmount?: number | null;
    skipDuplicateReferenceCheck?: boolean;
  },
  scope?: ExpensesWorkspaceScope,
): Promise<FinancialExpense> {
  const workspaceId = await resolveFinancialsWorkspaceId({
    workspaceId: input.workspaceId ?? scope?.workspaceId,
  });
  await ensureFinancialExpensesTable();
  return withFinancialExpensesTable(async () => {
    const supabase = requireExpensesSupabase();
    const user = getInternalUserById(input.submitterUserId);
    const submitterName = user?.fullName ?? input.submitterName?.trim() ?? "Unknown";
    const expenseDate =
      input.expenseDate ?? input.dateSubmitted ?? new Date().toISOString().slice(0, 10);
    const categoryAccountCode = input.categoryAccountCode ?? "5090";
    const recordStatus = input.recordStatus ?? "draft";
    const workflowStatus = input.workflowStatus ?? (recordStatus === "draft" ? "draft" : "submitted");
    const paid = input.paid ?? false;
    const paymentMethod =
      input.paymentMethod ?? (paid && recordStatus === "finalized" ? "wise" : null);
    const reimbursable = input.reimbursable ?? false;
    const description =
      String(input.description ?? input.purposeDescription ?? "").trim();
    if (!description) {
      throw new Error("Description is required.");
    }

    if (!input.skipDuplicateReferenceCheck) {
      const duplicateId = await findDuplicateExpense(workspaceId, {
        reference: input.reference ?? null,
        supplier: input.supplier ?? null,
      });
      if (duplicateId) {
        throw new Error(
          `Duplicate expense: reference "${input.reference}" already recorded.`,
        );
      }
    }

    const expenseNumber = await allocateExpenseNumber(workspaceId);
    const currency =
      input.currency ??
      (await resolveWorkspaceReportingCurrency(workspaceId, scope?.workspaceSlug));

    const { data, error } = await supabase
      .from("financial_expenses")
      .insert({
        workspace_id: workspaceId,
        submitter_user_id: input.submitterUserId,
        submitter_name: submitterName,
        purpose_description: description,
        description,
        amount: input.amount,
        currency,
        date_submitted: input.dateSubmitted ?? expenseDate,
        paid,
        supplier: input.supplier ?? null,
        category_account_code: categoryAccountCode,
        expense_date: expenseDate,
        payment_method: paymentMethod,
        wise_balance_id: input.wiseBalanceId ?? null,
        attachment_path: input.attachmentPath ?? null,
        reference: input.reference ?? null,
        record_status: recordStatus,
        reimbursable,
        workflow_status: workflowStatus,
        claimant_employee_id: input.claimantEmployeeId ?? null,
        expense_category_id: input.expenseCategoryId ?? null,
        billing_code_id: input.billingCodeId ?? null,
        expense_number: expenseNumber,
        expected_payment_date: input.expectedPaymentDate ?? null,
        expense_type: input.expenseType ?? "standard",
        mileage_from: input.mileageFrom ?? null,
        mileage_to: input.mileageTo ?? null,
        mileage_distance: input.mileageDistance ?? null,
        mileage_distance_unit: input.mileageDistanceUnit ?? null,
        mileage_rate: input.mileageRate ?? null,
        mileage_calculated_amount: input.mileageCalculatedAmount ?? null,
        submitted_at: workflowStatus === "submitted" ? new Date().toISOString() : null,
      })
      .select("*")
      .single();

    if (error) throw new Error(error.message);

    if (recordStatus === "draft" || workflowStatus === "draft") {
      return mapFinancialExpense(data as DbExpense);
    }

    try {
      const journal = await postExpenseJournal({
        expenseId: data.id,
        amount: Number(data.amount),
        currency: String(data.currency),
        categoryAccountCode,
        description: String(data.purpose_description),
        journalDate: expenseDate,
        paid,
        workspaceId,
      });
      const { data: updated, error: updateError } = await supabase
        .from("financial_expenses")
        .update({
          journal_entry_id: journal.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", data.id)
        .eq("workspace_id", workspaceId)
        .select("*")
        .single();
      if (updateError) throw new Error(updateError.message);
      return mapFinancialExpense(updated as DbExpense);
    } catch {
      return mapFinancialExpense(data as DbExpense);
    }
  });
}

export async function updateExpense(
  id: string,
  patch: Partial<{
    submitterUserId: string;
    purposeDescription: string;
    description: string;
    amount: number;
    currency: ExpenseCurrency;
    dateSubmitted: string;
    paid: boolean;
    supplier: string | null;
    categoryAccountCode: string | null;
    expenseDate: string;
    paymentMethod: string | null;
    reference: string | null;
    attachmentPath: string | null;
    recordStatus: ExpenseRecordStatus;
    workflowStatus: ExpenseWorkflowStatus;
    reimbursable: boolean;
    claimantEmployeeId: string | null;
    expenseCategoryId: string | null;
    billingCodeId: string | null;
    expectedPaymentDate: string | null;
    expenseType: ExpenseType;
    mileageFrom: string | null;
    mileageTo: string | null;
    mileageDistance: number | null;
    mileageDistanceUnit: "miles" | "kilometres" | null;
    mileageRate: number | null;
    mileageCalculatedAmount: number | null;
  }>,
  scope?: ExpensesWorkspaceScope,
): Promise<FinancialExpense> {
  const workspaceId = await resolveFinancialsWorkspaceId(scope);
  return withFinancialExpensesTable(async () => {
    const supabase = requireExpensesSupabase();
    const existingMapped = await requireExpenseInWorkspace(id, { workspaceId });
    const { data: existing, error: existingError } = await supabase
      .from("financial_expenses")
      .select("*")
      .eq("id", id)
      .eq("workspace_id", workspaceId)
      .single();
    if (existingError) throw new Error(existingError.message);

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
      payload.description = patch.purposeDescription.trim();
    }
    if (patch.description !== undefined) {
      payload.description = patch.description.trim();
      payload.purpose_description = patch.description.trim();
    }
    if (patch.amount !== undefined) payload.amount = patch.amount;
    if (patch.currency !== undefined) payload.currency = patch.currency;
    if (patch.dateSubmitted !== undefined) payload.date_submitted = patch.dateSubmitted;
    if (patch.paid !== undefined) payload.paid = patch.paid;
    if (patch.supplier !== undefined) payload.supplier = patch.supplier;
    if (patch.categoryAccountCode !== undefined) {
      payload.category_account_code = patch.categoryAccountCode;
    }
    if (patch.expenseDate !== undefined) payload.expense_date = patch.expenseDate;
    if (patch.paymentMethod !== undefined) payload.payment_method = patch.paymentMethod;
    if (patch.reference !== undefined) payload.reference = patch.reference;
    if (patch.attachmentPath !== undefined) payload.attachment_path = patch.attachmentPath;
    if (patch.recordStatus !== undefined) payload.record_status = patch.recordStatus;
    if (patch.reimbursable !== undefined) payload.reimbursable = patch.reimbursable;
    if (patch.workflowStatus !== undefined) payload.workflow_status = patch.workflowStatus;
    if (patch.claimantEmployeeId !== undefined) payload.claimant_employee_id = patch.claimantEmployeeId;
    if (patch.expenseCategoryId !== undefined) payload.expense_category_id = patch.expenseCategoryId;
    if (patch.billingCodeId !== undefined) payload.billing_code_id = patch.billingCodeId;
    if (patch.expectedPaymentDate !== undefined) {
      payload.expected_payment_date = patch.expectedPaymentDate;
    }
    if (patch.expenseType !== undefined) payload.expense_type = patch.expenseType;
    if (patch.mileageFrom !== undefined) payload.mileage_from = patch.mileageFrom;
    if (patch.mileageTo !== undefined) payload.mileage_to = patch.mileageTo;
    if (patch.mileageDistance !== undefined) payload.mileage_distance = patch.mileageDistance;
    if (patch.mileageDistanceUnit !== undefined) {
      payload.mileage_distance_unit = patch.mileageDistanceUnit;
    }
    if (patch.mileageRate !== undefined) payload.mileage_rate = patch.mileageRate;
    if (patch.mileageCalculatedAmount !== undefined) {
      payload.mileage_calculated_amount = patch.mileageCalculatedAmount;
    }

    if (patch.reference !== undefined || patch.supplier !== undefined) {
      const duplicateId = await findDuplicateExpense(workspaceId, {
        reference: patch.reference ?? existing.reference ?? null,
        supplier: patch.supplier ?? existing.supplier ?? null,
        expenseId: id,
      });
      if (duplicateId) {
        throw new Error(
          `Duplicate expense: invoice/reference "${patch.reference ?? existing.reference}" already recorded.`,
        );
      }
    }

    const becomingFinalized =
      patch.recordStatus === "finalized" && String(existing.record_status ?? "finalized") === "draft";
    const becomingPaid = patch.paid === true && !existing.paid;

    if (becomingPaid && !existing.payment_journal_entry_id && existing.journal_entry_id) {
      try {
        const paymentJournal = await postExpensePaymentJournal({
          expenseId: id,
          amount: Number(patch.amount ?? existing.amount),
          currency: String(patch.currency ?? existing.currency),
          description: String(existing.purpose_description),
          journalDate: new Date().toISOString().slice(0, 10),
          workspaceId,
        });
        payload.payment_journal_entry_id = paymentJournal.id;
        payload.payment_method = patch.paymentMethod ?? "wise";
      } catch {
        // Keep paid flag even if journal posting fails before migration applied.
      }
    }

    void existingMapped;

    const { data, error } = await supabase
      .from("financial_expenses")
      .update(payload)
      .eq("id", id)
      .eq("workspace_id", workspaceId)
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    const mapped = mapFinancialExpense(data as DbExpense);

    if (becomingFinalized && !mapped.journalEntryId) {
      try {
        const journal = await postExpenseJournal({
          expenseId: mapped.id,
          amount: Number(mapped.amount),
          currency: String(mapped.currency),
          categoryAccountCode: mapped.categoryAccountCode ?? "5090",
          description: mapped.purposeDescription,
          journalDate: mapped.expenseDate,
          paid: mapped.paid,
          workspaceId,
        });
        const { data: updated, error: updateError } = await supabase
          .from("financial_expenses")
          .update({
            journal_entry_id: journal.id,
            updated_at: new Date().toISOString(),
          })
          .eq("id", id)
          .eq("workspace_id", workspaceId)
          .select("*")
          .single();
        if (updateError) throw new Error(updateError.message);
        return mapFinancialExpense(updated as DbExpense);
      } catch {
        return mapped;
      }
    }

    return mapped;
  });
}

export type BulkExpenseUpsertInput = {
  rowIndex: number;
  expenseId?: string | null;
  submitterUserId: string;
  purposeDescription: string;
  amount: number;
  currency: ExpenseCurrency;
  dateSubmitted: string;
  expenseDate: string;
  paid: boolean;
  supplier: string | null;
  categoryAccountCode: string;
  reference: string | null;
  attachmentPath: string | null;
  paymentMethod: string | null;
  reimbursable: boolean;
  recordStatus: ExpenseRecordStatus;
};

export type BulkExpenseSaveResult = {
  saved: FinancialExpense[];
  errors: { rowIndex: number; message: string }[];
};

export async function saveBulkExpenses(
  rows: BulkExpenseUpsertInput[],
  mode: BulkExpenseSaveMode,
  scope?: ExpensesWorkspaceScope,
): Promise<BulkExpenseSaveResult> {
  const saved: FinancialExpense[] = [];
  const errors: { rowIndex: number; message: string }[] = [];

  for (const row of rows) {
    try {
      if (row.expenseId) {
        const expense = await updateExpense(
          row.expenseId,
          {
            submitterUserId: row.submitterUserId,
            purposeDescription: row.purposeDescription,
            amount: row.amount,
            currency: row.currency,
            dateSubmitted: row.dateSubmitted,
            expenseDate: row.expenseDate,
            paid: row.paid,
            supplier: row.supplier,
            categoryAccountCode: row.categoryAccountCode,
            reference: row.reference,
            attachmentPath: row.attachmentPath,
            paymentMethod: row.paymentMethod,
            reimbursable: row.reimbursable,
            recordStatus: row.recordStatus,
          },
          scope,
        );
        saved.push(expense);
        continue;
      }

      const expense = await createExpense(
        {
          submitterUserId: row.submitterUserId,
          purposeDescription: row.purposeDescription,
          amount: row.amount,
          currency: row.currency,
          dateSubmitted: row.dateSubmitted,
          expenseDate: row.expenseDate,
          paid: row.paid,
          supplier: row.supplier,
          categoryAccountCode: row.categoryAccountCode,
          reference: row.reference,
          attachmentPath: row.attachmentPath,
          paymentMethod: row.paymentMethod,
          reimbursable: row.reimbursable,
          recordStatus: row.recordStatus,
        },
        scope,
      );
      saved.push(expense);
    } catch (error) {
      errors.push({
        rowIndex: row.rowIndex,
        message: error instanceof Error ? error.message : "Failed to save expense row.",
      });
    }
  }

  void mode;
  return { saved, errors };
}

export async function deleteExpense(id: string, scope?: ExpensesWorkspaceScope) {
  const workspaceId = await resolveFinancialsWorkspaceId(scope);
  return withFinancialExpensesTable(async () => {
    await requireExpenseInWorkspace(id, { workspaceId });
    const supabase = requireExpensesSupabase();
    const { error } = await supabase
      .from("financial_expenses")
      .delete()
      .eq("id", id)
      .eq("workspace_id", workspaceId);
    if (error) throw new Error(error.message);
  });
}
