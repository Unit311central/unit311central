import { createInitialUsers } from "@/lib/user-management-data";
import {
  CHART_OF_ACCOUNTS_SEED,
  withPreferredCurrencySymbol,
} from "@/lib/accounting/chart-of-accounts";

export type ExpenseCurrency = "EUR" | "GBP" | "USD" | "AUD" | "CHF" | "HKD";

export type ExpenseRecordStatus = "draft" | "finalized";

export type FinancialExpense = {
  id: string;
  submitterUserId: string;
  submitterName: string;
  purposeDescription: string;
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
  created_at: string;
  updated_at: string;
};

export function mapFinancialExpense(row: DbExpense): FinancialExpense {
  return {
    id: row.id,
    submitterUserId: row.submitter_user_id,
    submitterName: row.submitter_name,
    purposeDescription: row.purpose_description,
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
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
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
  const fractionDigits = code === "AUD" ? 0 : 2;
  return withPreferredCurrencySymbol(
    new Intl.NumberFormat(
      code === "AUD" ? "en-AU" : code === "USD" ? "en-US" : code === "HKD" ? "en-HK" : "en-GB",
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
