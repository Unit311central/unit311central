import { parseSupplierInvoiceText } from "@/lib/accounting/supplier-invoice-parse";
import type { SupplierInvoiceDraft } from "@/lib/accounting/types";
import {
  deleteNorthstarSupplierInvoiceDraft,
  getNorthstarSupplierInvoiceDraftById,
  getNorthstarSupplierInvoiceDrafts,
  upsertNorthstarSupplierInvoiceDraft,
} from "@/lib/demo/northstar-supplier-invoices-fixtures";
import {
  deleteSaecSupplierInvoiceDraft,
  getSaecSupplierInvoiceDraftById,
  getSaecSupplierInvoiceDrafts,
  upsertSaecSupplierInvoiceDraft,
} from "@/lib/saec/demo/saec-supplier-invoices-fixtures";
import {
  createExpense,
  deleteExpense,
  listExpenses,
  updateExpense,
} from "@/lib/financial-expenses-service";
import {
  getInternalUserById,
  isSupplierAccountsPayableExpense,
  type ExpenseCurrency,
} from "@/lib/expenses-data";
import { resolveAccountingFixtureSource } from "@/lib/workspace-accounting-fixtures";
import { resolveFinancialsWorkspaceId, type FinancialsWorkspaceScope } from "@/lib/financials-workspace";
import { requirePlatformSession } from "@/lib/platform-session";

function addDays(isoDate: string, days: number) {
  const date = new Date(`${isoDate}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function mapExpenseToDraft(expense: {
  id: string;
  workspaceId?: string;
  supplier: string | null;
  reference: string | null;
  amount: number;
  currency: string;
  expenseDate: string;
  purposeDescription: string;
  recordStatus: string;
  journalEntryId: string | null;
  createdAt: string;
  updatedAt: string;
}): SupplierInvoiceDraft {
  return {
    id: expense.id,
    workspaceId: expense.workspaceId ?? "",
    supplier: expense.supplier ?? "Supplier",
    reference: expense.reference,
    amount: expense.amount,
    currency: expense.currency,
    invoiceDate: expense.expenseDate,
    dueDate: addDays(expense.expenseDate, 30),
    description: expense.purposeDescription,
    status: expense.recordStatus === "draft" ? "draft" : "approved",
    journalEntryId: expense.journalEntryId,
    sourceText: null,
    createdAt: expense.createdAt,
    updatedAt: expense.updatedAt,
  };
}

export async function listSupplierInvoiceDrafts(
  scope: FinancialsWorkspaceScope,
): Promise<SupplierInvoiceDraft[]> {
  const fixture = resolveAccountingFixtureSource(scope.workspaceSlug);
  if (fixture === "northstar") return getNorthstarSupplierInvoiceDrafts();
  if (fixture === "saec") return getSaecSupplierInvoiceDrafts();

  const expenses = await listExpenses(scope);
  return expenses
    .filter(
      (expense) =>
        expense.recordStatus === "draft" && isSupplierAccountsPayableExpense(expense),
    )
    .map((expense) => mapExpenseToDraft(expense));
}

export async function ingestSupplierInvoice(
  scope: FinancialsWorkspaceScope,
  input: {
    text?: string;
    supplier?: string;
    reference?: string | null;
    amount?: number;
    currency?: string;
    invoiceDate?: string | null;
    dueDate?: string | null;
    description?: string;
  },
): Promise<SupplierInvoiceDraft> {
  const parsed = input.text?.trim() ? parseSupplierInvoiceText(input.text) : null;
  const supplier = input.supplier?.trim() || parsed?.supplier;
  const amount = input.amount ?? parsed?.amount;
  const currency = input.currency ?? parsed?.currency ?? "GBP";
  const reference = input.reference ?? parsed?.reference ?? null;
  const invoiceDate = input.invoiceDate ?? parsed?.invoiceDate ?? new Date().toISOString().slice(0, 10);
  const dueDate = input.dueDate ?? parsed?.dueDate ?? addDays(invoiceDate, 30);
  const description = input.description?.trim() || parsed?.description || "Supplier invoice";

  if (!supplier?.trim()) throw new Error("Supplier name is required.");
  if (!amount || amount <= 0) throw new Error("A valid invoice amount is required.");

  const now = new Date().toISOString();
  const fixture = resolveAccountingFixtureSource(scope.workspaceSlug);

  if (fixture === "northstar" || fixture === "saec") {
    const workspaceId = fixture === "saec" ? "saec-workspace" : "demo-workspace";
    const idPrefix = fixture === "saec" ? "saec-ap-draft" : "nst-ap-draft";
    const draft: SupplierInvoiceDraft = {
      id: `${idPrefix}-${Date.now()}`,
      workspaceId,
      supplier: supplier.trim(),
      reference,
      amount,
      currency,
      invoiceDate,
      dueDate,
      description,
      status: "draft",
      journalEntryId: null,
      sourceText: input.text?.trim() ?? null,
      createdAt: now,
      updatedAt: now,
    };
    return fixture === "saec"
      ? upsertSaecSupplierInvoiceDraft(draft)
      : upsertNorthstarSupplierInvoiceDraft(draft);
  }

  const session = await requirePlatformSession();
  const user = getInternalUserById(session.sub);
  if (!user) throw new Error("User not found.");

  const expense = await createExpense(
    {
      submitterUserId: session.sub,
      purposeDescription: description,
      amount,
      currency: currency as ExpenseCurrency,
      supplier: supplier.trim(),
      reference: reference ?? undefined,
      expenseDate: invoiceDate,
      recordStatus: "draft",
      paid: false,
      workspaceId: scope.workspaceId ?? undefined,
    },
    scope,
  );

  return mapExpenseToDraft(expense);
}

async function requireDraftSupplierInvoice(
  id: string,
  scope: FinancialsWorkspaceScope,
): Promise<SupplierInvoiceDraft> {
  const fixture = resolveAccountingFixtureSource(scope.workspaceSlug);
  if (fixture === "northstar" || fixture === "saec") {
    const draft =
      fixture === "saec"
        ? getSaecSupplierInvoiceDraftById(id)
        : getNorthstarSupplierInvoiceDraftById(id);
    if (!draft) throw new Error("Supplier invoice not found.");
    return draft;
  }

  const expenses = await listExpenses(scope);
  const expense = expenses.find((row) => row.id === id);
  if (!expense || !isSupplierAccountsPayableExpense(expense)) {
    throw new Error("Supplier invoice not found.");
  }
  return mapExpenseToDraft(expense);
}

export async function updateSupplierInvoiceDraft(
  id: string,
  scope: FinancialsWorkspaceScope,
  input: {
    supplier?: string;
    reference?: string | null;
    amount?: number;
    currency?: string;
    invoiceDate?: string | null;
    dueDate?: string | null;
    description?: string;
  },
): Promise<SupplierInvoiceDraft> {
  const existing = await requireDraftSupplierInvoice(id, scope);
  if (existing.status !== "draft") {
    throw new Error("Only draft supplier invoices can be edited.");
  }

  const supplier = input.supplier?.trim() || existing.supplier;
  const amount = input.amount ?? existing.amount;
  const currency = input.currency ?? existing.currency;
  const reference = input.reference !== undefined ? input.reference : existing.reference;
  const invoiceDate = input.invoiceDate ?? existing.invoiceDate;
  const dueDate = input.dueDate !== undefined ? input.dueDate : existing.dueDate;
  const description = input.description?.trim() || existing.description;

  if (!supplier.trim()) throw new Error("Supplier name is required.");
  if (!amount || amount <= 0) throw new Error("A valid invoice amount is required.");

  const now = new Date().toISOString();
  const fixture = resolveAccountingFixtureSource(scope.workspaceSlug);

  if (fixture === "northstar" || fixture === "saec") {
    const updated: SupplierInvoiceDraft = {
      ...existing,
      supplier: supplier.trim(),
      reference,
      amount,
      currency,
      invoiceDate,
      dueDate,
      description,
      updatedAt: now,
    };
    return fixture === "saec"
      ? upsertSaecSupplierInvoiceDraft(updated)
      : upsertNorthstarSupplierInvoiceDraft(updated);
  }

  const updated = await updateExpense(
    id,
    {
      supplier: supplier.trim(),
      reference,
      amount,
      currency: currency as ExpenseCurrency,
      expenseDate: invoiceDate,
      purposeDescription: description,
    },
    scope,
  );
  return mapExpenseToDraft(updated);
}

export async function deleteSupplierInvoiceDraft(
  id: string,
  scope: FinancialsWorkspaceScope,
): Promise<void> {
  const existing = await requireDraftSupplierInvoice(id, scope);
  if (existing.status !== "draft") {
    throw new Error("Only draft supplier invoices can be deleted.");
  }

  const fixture = resolveAccountingFixtureSource(scope.workspaceSlug);
  if (fixture === "northstar") {
    if (!deleteNorthstarSupplierInvoiceDraft(id)) {
      throw new Error("Supplier invoice not found.");
    }
    return;
  }
  if (fixture === "saec") {
    if (!deleteSaecSupplierInvoiceDraft(id)) {
      throw new Error("Supplier invoice not found.");
    }
    return;
  }

  await deleteExpense(id, scope);
}

export async function approveSupplierInvoiceDraft(
  id: string,
  scope: FinancialsWorkspaceScope,
): Promise<SupplierInvoiceDraft> {
  const fixture = resolveAccountingFixtureSource(scope.workspaceSlug);
  if (fixture === "northstar" || fixture === "saec") {
    const draft =
      fixture === "saec"
        ? getSaecSupplierInvoiceDraftById(id)
        : getNorthstarSupplierInvoiceDraftById(id);
    if (!draft) throw new Error("Supplier invoice not found.");
    if (draft.status === "approved") return draft;
    const approved = {
      ...draft,
      status: "approved" as const,
      journalEntryId: `${fixture === "saec" ? "saec" : "nst"}-je-ap-${id}`,
      updatedAt: new Date().toISOString(),
    };
    return fixture === "saec"
      ? upsertSaecSupplierInvoiceDraft(approved)
      : upsertNorthstarSupplierInvoiceDraft(approved);
  }

  const updated = await updateExpense(
    id,
    { recordStatus: "finalized" },
    scope,
  );
  return mapExpenseToDraft(updated);
}

export { parseSupplierInvoiceText };
