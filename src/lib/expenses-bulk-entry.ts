import {
  billingCodeForSemanticCategory,
  createBlankExpenseInput,
  EXPENSE_BILLING_CATEGORY_OPTIONS,
  EXPENSE_CURRENCY_OPTIONS,
  EXPENSE_SEMANTIC_CATEGORIES,
  INTERNAL_EXPENSE_USERS,
  semanticCategoryForBillingCode,
  type ExpenseCurrency,
  type ExpenseSemanticCategory,
} from "@/lib/expenses-data";

export type BulkExpenseRowInput = {
  rowIndex: number;
  expenseId?: string | null;
  billingCategoryCode: string;
  category: string;
  purpose: string;
  vendor: string;
  invoiceNumber?: string | null;
  datePaid: string;
  amount: number | string;
  currency: ExpenseCurrency;
  attachmentPath?: string | null;
};

export type BulkExpenseRowValidation = {
  rowIndex: number;
  errors: string[];
};

export type BulkExpenseSaveMode = "draft" | "finalized";

const VALID_BILLING_CODES = new Set(EXPENSE_BILLING_CATEGORY_OPTIONS.map((entry) => entry.code));
const VALID_SEMANTIC_CATEGORIES = new Set(
  EXPENSE_SEMANTIC_CATEGORIES.map((entry) => entry.label),
);

export function defaultBulkExpenseCurrency(): ExpenseCurrency {
  return createBlankExpenseInput().currency;
}

export function createBlankBulkExpenseRow(): Omit<BulkExpenseRowInput, "rowIndex"> {
  const today = new Date().toISOString().slice(0, 10);
  return {
    billingCategoryCode: "5090",
    category: "General",
    purpose: "",
    vendor: "",
    invoiceNumber: "",
    datePaid: today,
    amount: "",
    currency: defaultBulkExpenseCurrency(),
    attachmentPath: null,
  };
}

export function duplicateBulkExpenseRow(
  row: BulkExpenseRowInput,
  rowIndex: number,
): BulkExpenseRowInput {
  return {
    ...row,
    rowIndex,
    expenseId: undefined,
  };
}

export function expenseToBulkRow(
  expense: {
    id: string;
    categoryAccountCode: string | null;
    purposeDescription: string;
    supplier: string | null;
    reference: string | null;
    expenseDate: string;
    amount: number;
    currency: ExpenseCurrency;
    attachmentPath: string | null;
  },
  rowIndex: number,
): BulkExpenseRowInput {
  return {
    rowIndex,
    expenseId: expense.id,
    billingCategoryCode: expense.categoryAccountCode ?? "5090",
    category: semanticCategoryForBillingCode(expense.categoryAccountCode),
    purpose: expense.purposeDescription,
    vendor: expense.supplier ?? "",
    invoiceNumber: expense.reference ?? "",
    datePaid: expense.expenseDate,
    amount: expense.amount,
    currency: expense.currency,
    attachmentPath: expense.attachmentPath,
  };
}

function parseRowAmount(value: number | string): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) && value >= 0 ? value : null;
  }
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function isRowEmpty(row: BulkExpenseRowInput): boolean {
  return (
    !row.purpose.trim() &&
    !row.vendor.trim() &&
    !String(row.invoiceNumber ?? "").trim() &&
    parseRowAmount(row.amount) === null
  );
}

export function validateBulkExpenseRows(
  rows: BulkExpenseRowInput[],
  mode: BulkExpenseSaveMode,
): BulkExpenseRowValidation[] {
  const validations: BulkExpenseRowValidation[] = [];
  const activeRows = rows.filter((row) => !isRowEmpty(row));

  if (activeRows.length === 0) {
    validations.push({ rowIndex: 0, errors: ["Add at least one expense row."] });
    return validations;
  }

  for (const row of activeRows) {
    const errors: string[] = [];

    if (row.billingCategoryCode && !VALID_BILLING_CODES.has(row.billingCategoryCode)) {
      errors.push("Select a valid billing category code.");
    }

    if (row.category && !VALID_SEMANTIC_CATEGORIES.has(row.category as ExpenseSemanticCategory)) {
      errors.push("Select a valid category.");
    }

    if (mode === "finalized") {
      if (!row.billingCategoryCode?.trim() || !VALID_BILLING_CODES.has(row.billingCategoryCode)) {
        errors.push("Billing category code is required.");
      }

      if (!row.category?.trim() || !VALID_SEMANTIC_CATEGORIES.has(row.category as ExpenseSemanticCategory)) {
        errors.push("Category is required.");
      }

      if (!row.purpose.trim()) {
        errors.push("Purpose is required.");
      }

      if (!row.vendor.trim()) {
        errors.push("Vendor is required.");
      }

      if (!row.datePaid.trim()) {
        errors.push("Date paid is required.");
      }

      const amount = parseRowAmount(row.amount);
      if (amount === null || amount <= 0) {
        errors.push("Amount must be greater than zero.");
      }
    } else {
      const amount = parseRowAmount(row.amount);
      if (amount !== null && amount < 0) {
        errors.push("Amount cannot be negative.");
      }
    }

    if (row.currency && !EXPENSE_CURRENCY_OPTIONS.includes(row.currency)) {
      errors.push("Select a valid currency.");
    }

    if (errors.length > 0) {
      validations.push({ rowIndex: row.rowIndex, errors });
    }
  }

  return validations;
}

export function normalizeBulkExpenseRow(
  row: BulkExpenseRowInput,
  mode: BulkExpenseSaveMode,
  submitterUserId?: string,
) {
  const amount = parseRowAmount(row.amount) ?? 0;
  const userId = submitterUserId ?? INTERNAL_EXPENSE_USERS[0]?.id ?? "";
  const user = INTERNAL_EXPENSE_USERS.find((entry) => entry.id === userId);

  return {
    expenseId: row.expenseId ?? null,
    submitterUserId: userId,
    submitterName: user?.fullName ?? "Unknown",
    purposeDescription: row.purpose.trim(),
    amount,
    currency: row.currency,
    dateSubmitted: row.datePaid,
    expenseDate: row.datePaid,
    paid: mode === "finalized",
    supplier: row.vendor.trim() || null,
    categoryAccountCode: row.billingCategoryCode || billingCodeForSemanticCategory(row.category),
    reference: row.invoiceNumber?.trim() ? row.invoiceNumber.trim() : null,
    attachmentPath: row.attachmentPath ?? null,
    paymentMethod: mode === "finalized" ? ("personally_paid" as const) : null,
    reimbursable: mode === "finalized",
    recordStatus: mode,
  };
}

export function syncBillingCodeFromCategory(row: BulkExpenseRowInput): BulkExpenseRowInput {
  return {
    ...row,
    billingCategoryCode: billingCodeForSemanticCategory(row.category),
  };
}

export function syncCategoryFromBillingCode(row: BulkExpenseRowInput): BulkExpenseRowInput {
  return {
    ...row,
    category: semanticCategoryForBillingCode(row.billingCategoryCode),
  };
}
