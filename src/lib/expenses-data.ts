import { createInitialUsers } from "@/lib/user-management-data";
import {
  CHART_OF_ACCOUNTS_SEED,
  withPreferredCurrencySymbol,
} from "@/lib/accounting/chart-of-accounts";

export type ExpenseCurrency = "EUR" | "GBP" | "USD" | "AUD" | "CHF" | "HKD" | "ZAR";

export type ExpenseRecordStatus = "draft" | "finalized";

export type ExpenseWorkflowStatus =
  | "draft"
  | "submitted"
  | "changes_requested"
  | "approved"
  | "rejected"
  | "scheduled"
  | "paid"
  | "cancelled";

export type ExpenseType = "standard" | "mileage";

export type FinancialExpense = {
  id: string;
  submitterUserId: string;
  submitterName: string;
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
  wiseBalanceId: number | null;
  attachmentPath: string | null;
  reference: string | null;
  recordStatus: ExpenseRecordStatus;
  reimbursable: boolean;
  journalEntryId: string | null;
  paymentJournalEntryId: string | null;
  workflowStatus: ExpenseWorkflowStatus;
  claimantEmployeeId: string | null;
  expenseCategoryId: string | null;
  billingCodeId: string | null;
  expenseRunId: string | null;
  expenseNumber: string | null;
  submittedAt: string | null;
  approvedAt: string | null;
  paidAt: string | null;
  expectedPaymentDate: string | null;
  expenseType: ExpenseType;
  mileageFrom: string | null;
  mileageTo: string | null;
  mileageDistance: number | null;
  mileageDistanceUnit: "miles" | "kilometres" | null;
  mileageRate: number | null;
  mileageCalculatedAmount: number | null;
  createdAt: string;
  updatedAt: string;
};

/** GL expense account codes used as billing category codes in bulk entry. */
export const EXPENSE_BILLING_CATEGORY_OPTIONS = CHART_OF_ACCOUNTS_SEED.filter(
  (account) => account.type === "expense",
).map((account) => ({ code: account.code, name: account.name }));

export type ExpenseSemanticCategory =
  | "Software"
  | "Travel"
  | "Equipment"
  | "Meals & entertainment"
  | "Office"
  | "Marketing"
  | "Contractors"
  | "Legal"
  | "Accounting"
  | "General";

export const EXPENSE_SEMANTIC_CATEGORIES: {
  label: ExpenseSemanticCategory;
  defaultBillingCode: string;
}[] = [
  { label: "Software", defaultBillingCode: "5010" },
  { label: "Travel", defaultBillingCode: "5050" },
  { label: "Equipment", defaultBillingCode: "5090" },
  { label: "Meals & entertainment", defaultBillingCode: "5090" },
  { label: "Office", defaultBillingCode: "5060" },
  { label: "Marketing", defaultBillingCode: "5040" },
  { label: "Contractors", defaultBillingCode: "5030" },
  { label: "Legal", defaultBillingCode: "5080" },
  { label: "Accounting", defaultBillingCode: "5070" },
  { label: "General", defaultBillingCode: "5090" },
];

export function semanticCategoryForBillingCode(code: string | null | undefined): ExpenseSemanticCategory {
  const normalized = String(code ?? "").trim();
  const match = EXPENSE_SEMANTIC_CATEGORIES.find((entry) => entry.defaultBillingCode === normalized);
  if (match) return match.label;
  return inferExpenseCategory("") as ExpenseSemanticCategory;
}

export function billingCodeForSemanticCategory(label: string): string {
  const match = EXPENSE_SEMANTIC_CATEGORIES.find((entry) => entry.label === label);
  return match?.defaultBillingCode ?? "5090";
}

export function isExpenseDraft(expense: Pick<FinancialExpense, "recordStatus">) {
  return expense.recordStatus === "draft";
}

/** Finalized expenses only — drafts are excluded from spend and reimbursement KPIs. */
export function isCountableExpense(expense: FinancialExpense) {
  return !isAccountsPayableSeedExpense(expense) && !isExpenseDraft(expense);
}

export const EXPENSE_CURRENCY_OPTIONS: ExpenseCurrency[] = [
  "USD",
  "EUR",
  "GBP",
  "HKD",
  "AUD",
  "CHF",
  "ZAR",
];

export const INTERNAL_EXPENSE_USERS = createInitialUsers().map((user) => ({
  id: user.id,
  fullName: user.fullName,
  username: user.username,
}));

type DbExpense = {
  id: string;
  submitter_user_id: string;
  submitter_name: string;
  purpose_description: string;
  description?: string | null;
  amount: number;
  currency: string;
  date_submitted: string;
  paid: boolean;
  supplier?: string | null;
  category_account_code?: string | null;
  expense_date?: string | null;
  payment_method?: string | null;
  wise_balance_id?: number | null;
  attachment_path?: string | null;
  reference?: string | null;
  record_status?: string | null;
  reimbursable?: boolean | null;
  journal_entry_id?: string | null;
  payment_journal_entry_id?: string | null;
  workflow_status?: string | null;
  claimant_employee_id?: string | null;
  expense_category_id?: string | null;
  billing_code_id?: string | null;
  expense_run_id?: string | null;
  expense_number?: string | null;
  submitted_at?: string | null;
  approved_at?: string | null;
  paid_at?: string | null;
  expected_payment_date?: string | null;
  expense_type?: string | null;
  mileage_from?: string | null;
  mileage_to?: string | null;
  mileage_distance?: number | null;
  mileage_distance_unit?: string | null;
  mileage_rate?: number | null;
  mileage_calculated_amount?: number | null;
  created_at: string;
  updated_at: string;
};

function normalizeWorkflowStatus(
  row: DbExpense,
): ExpenseWorkflowStatus {
  const raw = String(row.workflow_status ?? "").trim().toLowerCase();
  if (
    raw === "draft" ||
    raw === "submitted" ||
    raw === "changes_requested" ||
    raw === "approved" ||
    raw === "rejected" ||
    raw === "scheduled" ||
    raw === "paid" ||
    raw === "cancelled"
  ) {
    return raw;
  }
  if (row.record_status === "draft") return "draft";
  if (row.paid) return "paid";
  return "approved";
}

export function mapFinancialExpense(row: DbExpense): FinancialExpense {
  const description = String(row.description ?? row.purpose_description ?? "").trim();
  return {
    id: row.id,
    submitterUserId: row.submitter_user_id,
    submitterName: row.submitter_name,
    purposeDescription: row.purpose_description,
    description,
    amount: Number(row.amount),
    currency: row.currency as ExpenseCurrency,
    dateSubmitted: row.date_submitted,
    paid: row.paid,
    supplier: row.supplier ?? null,
    categoryAccountCode: row.category_account_code ?? null,
    expenseDate: row.expense_date ?? row.date_submitted,
    paymentMethod: row.payment_method ?? null,
    wiseBalanceId: row.wise_balance_id ?? null,
    attachmentPath: row.attachment_path ?? null,
    reference: row.reference ?? null,
    recordStatus: row.record_status === "draft" ? "draft" : "finalized",
    reimbursable: Boolean(row.reimbursable),
    journalEntryId: row.journal_entry_id ?? null,
    paymentJournalEntryId: row.payment_journal_entry_id ?? null,
    workflowStatus: normalizeWorkflowStatus(row),
    claimantEmployeeId: row.claimant_employee_id ?? null,
    expenseCategoryId: row.expense_category_id ?? null,
    billingCodeId: row.billing_code_id ?? null,
    expenseRunId: row.expense_run_id ?? null,
    expenseNumber: row.expense_number ?? null,
    submittedAt: row.submitted_at ?? null,
    approvedAt: row.approved_at ?? null,
    paidAt: row.paid_at ?? null,
    expectedPaymentDate: row.expected_payment_date ?? null,
    expenseType: row.expense_type === "mileage" ? "mileage" : "standard",
    mileageFrom: row.mileage_from ?? null,
    mileageTo: row.mileage_to ?? null,
    mileageDistance: row.mileage_distance != null ? Number(row.mileage_distance) : null,
    mileageDistanceUnit:
      row.mileage_distance_unit === "kilometres" ? "kilometres" : row.mileage_distance_unit === "miles" ? "miles" : null,
    mileageRate: row.mileage_rate != null ? Number(row.mileage_rate) : null,
    mileageCalculatedAmount:
      row.mileage_calculated_amount != null ? Number(row.mileage_calculated_amount) : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function expenseWorkflowLabel(status: ExpenseWorkflowStatus): string {
  switch (status) {
    case "draft":
      return "Draft";
    case "submitted":
      return "Submitted";
    case "changes_requested":
      return "Changes requested";
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
    case "scheduled":
      return "Scheduled for payment";
    case "paid":
      return "Paid";
    case "cancelled":
      return "Cancelled";
    default:
      return status;
  }
}

export function inferExpenseCategory(purpose: string) {
  const text = purpose.toLowerCase();
  if (/travel|flight|hotel|taxi|mileage|fuel/.test(text)) return "Travel";
  if (/software|subscription|license|saas/.test(text)) return "Software";
  if (/equipment|hardware|drone|camera|sensor/.test(text)) return "Equipment";
  if (/meal|food|restaurant|entertainment/.test(text)) return "Meals & entertainment";
  if (/office|supplies|stationery/.test(text)) return "Office";
  return "General";
}

export function createBlankExpenseInput(): Omit<
  FinancialExpense,
  "id" | "createdAt" | "updatedAt"
> {
  const defaultUser = INTERNAL_EXPENSE_USERS[0];
  let currency: ExpenseCurrency = "EUR";
  try {
    const { isBrowserCorpCentreSurface } =
      require("@/lib/corpcentre-surface") as typeof import("@/lib/corpcentre-surface");
    if (isBrowserCorpCentreSurface()) currency = "AUD";
  } catch {
    // non-browser
  }
  try {
    const { isBrowserOnwardAirSurface } =
      require("@/lib/onwardair-surface") as typeof import("@/lib/onwardair-surface");
    if (isBrowserOnwardAirSurface()) currency = "USD";
  } catch {
    // non-browser
  }
  try {
    const { isBrowserTalantonImpactSurface } =
      require("@/lib/talanton-surface") as typeof import("@/lib/talanton-surface");
    if (isBrowserTalantonImpactSurface()) currency = "USD";
  } catch {
    // non-browser
  }
  try {
    if (typeof window !== "undefined") {
      const host = window.location.hostname.toLowerCase();
      if (host.includes("onwardair") || host === "onward.unit311central.com") {
        currency = "USD";
      }
      if (host.includes("talantonimpact") || host.includes("talanton.")) {
        currency = "USD";
      }
    }
  } catch {
    // non-browser
  }
  return {
    submitterUserId: defaultUser?.id ?? "",
    submitterName: defaultUser?.fullName ?? "",
    purposeDescription: "",
    description: "",
    amount: 0,
    currency,
    dateSubmitted: new Date().toISOString().slice(0, 10),
    paid: false,
    supplier: null,
    categoryAccountCode: "5090",
    expenseDate: new Date().toISOString().slice(0, 10),
    paymentMethod: null,
    wiseBalanceId: null,
    attachmentPath: null,
    reference: null,
    recordStatus: "finalized",
    reimbursable: false,
    journalEntryId: null,
    paymentJournalEntryId: null,
    workflowStatus: "draft",
    claimantEmployeeId: null,
    expenseCategoryId: null,
    billingCodeId: null,
    expenseRunId: null,
    expenseNumber: null,
    submittedAt: null,
    approvedAt: null,
    paidAt: null,
    expectedPaymentDate: null,
    expenseType: "standard",
    mileageFrom: null,
    mileageTo: null,
    mileageDistance: null,
    mileageDistanceUnit: null,
    mileageRate: null,
    mileageCalculatedAmount: null,
  };
}

export function expenseFieldsEqual(a: FinancialExpense, b: FinancialExpense) {
  return (
    a.submitterUserId === b.submitterUserId &&
    a.submitterName === b.submitterName &&
    a.purposeDescription === b.purposeDescription &&
    a.amount === b.amount &&
    a.currency === b.currency &&
    a.dateSubmitted === b.dateSubmitted &&
    a.paid === b.paid &&
    a.supplier === b.supplier &&
    a.categoryAccountCode === b.categoryAccountCode &&
    a.expenseDate === b.expenseDate
  );
}

export function formatExpenseAmount(amount: number, currency: ExpenseCurrency) {
  const code = String(currency || "GBP").toUpperCase();
  const fractionDigits = code === "AUD" || code === "ZAR" ? 0 : 2;
  return withPreferredCurrencySymbol(
    new Intl.NumberFormat(
      code === "AUD"
        ? "en-AU"
        : code === "USD"
          ? "en-US"
          : code === "HKD"
            ? "en-HK"
            : code === "ZAR"
              ? "en-ZA"
              : "en-GB",
      {
        style: "currency",
        currency: code,
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
      },
    ).format(amount),
    code,
  );
}

/** Supplier AP seed rows share financial_expenses — hide from Expenses (T&E) views. */
export function isAccountsPayableSeedExpense(expense: {
  reference?: string | null;
  purposeDescription?: string | null;
}): boolean {
  const ref = String(expense.reference ?? "").toUpperCase();
  if (ref.startsWith("OA-AP-") || ref.startsWith("CC-AP-") || ref.startsWith("AP-DME")) {
    return true;
  }
  const purpose = String(expense.purposeDescription ?? "").toLowerCase();
  return purpose.includes("· oa ap seed") || purpose.includes("· corpcentre ap seed");
}

const EMPLOYEE_EXPENSE_REFERENCE_PREFIXES = ["UNIT311-TOM-2026-", "IW-TOM-2026-"] as const;

/** Seeded employee reimbursement rows (Tom Armenstein expense import). */
export function isTomEmployeeExpenseReference(reference: string | null | undefined): boolean {
  const ref = String(reference ?? "");
  return EMPLOYEE_EXPENSE_REFERENCE_PREFIXES.some((prefix) => ref.startsWith(prefix));
}

/** Employee expense claim awaiting reimbursement — not a supplier invoice. */
export function isEmployeeExpenseClaim(expense: {
  reimbursable?: boolean | null;
  claimantEmployeeId?: string | null;
  expenseCategoryId?: string | null;
  paymentMethod?: string | null;
  reference?: string | null;
  purposeDescription?: string | null;
}): boolean {
  if (isAccountsPayableSeedExpense(expense)) return false;
  if (isTomEmployeeExpenseReference(expense.reference)) return true;
  if (expense.reimbursable && expense.claimantEmployeeId) return true;
  if (
    expense.reimbursable &&
    expense.paymentMethod === "personally_paid" &&
    expense.expenseCategoryId
  ) {
    return true;
  }
  return false;
}

/** Supplier bill in Accounts Payable — excludes employee reimbursement claims. */
export function isSupplierAccountsPayableExpense(expense: {
  reimbursable?: boolean | null;
  claimantEmployeeId?: string | null;
  expenseCategoryId?: string | null;
  paymentMethod?: string | null;
  reference?: string | null;
  purposeDescription?: string | null;
}): boolean {
  if (isEmployeeExpenseClaim(expense)) return false;
  if (isAccountsPayableSeedExpense(expense)) return true;
  return !expense.reimbursable && !expense.claimantEmployeeId;
}

export function getInternalUserById(userId: string) {
  return INTERNAL_EXPENSE_USERS.find((user) => user.id === userId) ?? null;
}

const EXPENSE_PAYABLE_DAYS = 30;

/** Standard payable date: submission date + 30 days (NET 30). */
export function getExpensePayableDate(expense: Pick<FinancialExpense, "dateSubmitted">) {
  const submitted = new Date(`${expense.dateSubmitted}T12:00:00`);
  submitted.setDate(submitted.getDate() + EXPENSE_PAYABLE_DAYS);
  return submitted.toISOString().slice(0, 10);
}

export function formatExpensePayableDate(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${iso}T12:00:00`));
}

export type OutstandingByPayableDate = {
  payableDate: string;
  label: string;
  amount: number;
  count: number;
};

export function buildOutstandingByPayableDate(
  expenses: FinancialExpense[],
): OutstandingByPayableDate[] {
  const buckets = new Map<string, { amount: number; count: number }>();

  for (const expense of expenses) {
    if (!isCountableExpense(expense) || expense.paid) continue;
    const payableDate = getExpensePayableDate(expense);
    const current = buckets.get(payableDate) ?? { amount: 0, count: 0 };
    buckets.set(payableDate, {
      amount: current.amount + expense.amount,
      count: current.count + 1,
    });
  }

  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([payableDate, data]) => ({
      payableDate,
      label: formatExpensePayableDate(payableDate),
      amount: Math.round(data.amount * 100) / 100,
      count: data.count,
    }));
}

export function sumOutstandingExpenses(expenses: FinancialExpense[]) {
  return expenses
    .filter((expense) => isCountableExpense(expense) && !expense.paid)
    .reduce((sum, expense) => sum + expense.amount, 0);
}

export function sumReimbursableExpenses(expenses: FinancialExpense[]) {
  return expenses
    .filter(
      (expense) =>
        isCountableExpense(expense) &&
        expense.reimbursable &&
        expense.paymentMethod === "personally_paid",
    )
    .reduce((sum, expense) => sum + expense.amount, 0);
}

/** Normalize legacy fixture rows to the expanded FinancialExpense shape. */
export function expenseFixture(
  row: Partial<FinancialExpense> &
    Pick<
      FinancialExpense,
      | "id"
      | "submitterUserId"
      | "submitterName"
      | "purposeDescription"
      | "amount"
      | "currency"
      | "dateSubmitted"
      | "paid"
      | "recordStatus"
      | "reimbursable"
      | "createdAt"
      | "updatedAt"
    >,
): FinancialExpense {
  const description = String(row.description ?? row.purposeDescription ?? "").trim();
  const workflowStatus =
    row.workflowStatus ??
    (row.paid
      ? "paid"
      : row.recordStatus === "draft"
        ? "draft"
        : row.reimbursable
          ? "approved"
          : "approved");

  return {
    id: row.id,
    submitterUserId: row.submitterUserId,
    submitterName: row.submitterName,
    purposeDescription: row.purposeDescription,
    description,
    amount: row.amount,
    currency: row.currency,
    dateSubmitted: row.dateSubmitted,
    paid: row.paid,
    supplier: row.supplier ?? null,
    categoryAccountCode: row.categoryAccountCode ?? "5090",
    expenseDate: row.expenseDate ?? row.dateSubmitted,
    paymentMethod: row.paymentMethod ?? null,
    wiseBalanceId: row.wiseBalanceId ?? null,
    attachmentPath: row.attachmentPath ?? null,
    reference: row.reference ?? null,
    recordStatus: row.recordStatus,
    reimbursable: row.reimbursable,
    journalEntryId: row.journalEntryId ?? null,
    paymentJournalEntryId: row.paymentJournalEntryId ?? null,
    workflowStatus,
    claimantEmployeeId: row.claimantEmployeeId ?? null,
    expenseCategoryId: row.expenseCategoryId ?? null,
    billingCodeId: row.billingCodeId ?? null,
    expenseRunId: row.expenseRunId ?? null,
    expenseNumber: row.expenseNumber ?? null,
    submittedAt: row.submittedAt ?? (workflowStatus !== "draft" ? row.dateSubmitted : null),
    approvedAt: row.approvedAt ?? null,
    paidAt: row.paidAt ?? (row.paid ? row.updatedAt : null),
    expectedPaymentDate: row.expectedPaymentDate ?? null,
    expenseType: row.expenseType ?? "standard",
    mileageFrom: row.mileageFrom ?? null,
    mileageTo: row.mileageTo ?? null,
    mileageDistance: row.mileageDistance ?? null,
    mileageDistanceUnit: row.mileageDistanceUnit ?? null,
    mileageRate: row.mileageRate ?? null,
    mileageCalculatedAmount: row.mileageCalculatedAmount ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
