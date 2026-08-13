import {
  inferExpenseCategory,
  isCountableExpense,
  semanticCategoryForBillingCode,
  type ExpenseCurrency,
  type FinancialExpense,
} from "@/lib/expenses-data";

export type ExpenseLogFilter = {
  query: string;
  status: "all" | "draft" | "finalized" | "reimbursable";
  category: string;
  vendor: string;
  dateFrom: string;
  dateTo: string;
};

export const EMPTY_EXPENSE_LOG_FILTER: ExpenseLogFilter = {
  query: "",
  status: "all",
  category: "",
  vendor: "",
  dateFrom: "",
  dateTo: "",
};

export function isReimbursableOwedExpense(expense: FinancialExpense) {
  return (
    isCountableExpense(expense) &&
    expense.reimbursable &&
    expense.paymentMethod === "personally_paid"
  );
}

export function isSoftwareExpense(expense: FinancialExpense) {
  const code = String(expense.categoryAccountCode ?? "").trim();
  if (code === "5010") return true;
  const category = semanticCategoryForBillingCode(code);
  if (category === "Software") return true;
  const purpose = expense.purposeDescription.toLowerCase();
  const vendor = String(expense.supplier ?? "").toLowerCase();
  return /software|subscription|saas|hosting/.test(purpose) || /vercel|cursor|openai|zoho|google|starlink|snov|kling|cartesia/.test(vendor);
}

export function filterExpenses(expenses: FinancialExpense[], filter: ExpenseLogFilter) {
  const query = filter.query.trim().toLowerCase();
  return expenses.filter((expense) => {
    if (filter.status === "draft" && expense.recordStatus !== "draft") return false;
    if (filter.status === "finalized" && expense.recordStatus !== "finalized") return false;
    if (filter.status === "reimbursable" && !isReimbursableOwedExpense(expense)) return false;

    if (filter.category && semanticCategoryForBillingCode(expense.categoryAccountCode) !== filter.category) {
      return false;
    }

    if (filter.vendor) {
      const vendor = String(expense.supplier ?? "").toLowerCase();
      if (!vendor.includes(filter.vendor.trim().toLowerCase())) return false;
    }

    const expenseDate = expense.expenseDate || expense.dateSubmitted;
    if (filter.dateFrom && expenseDate < filter.dateFrom) return false;
    if (filter.dateTo && expenseDate > filter.dateTo) return false;

    if (!query) return true;
    const haystack = [
      expense.supplier,
      expense.purposeDescription,
      expense.reference,
      expense.categoryAccountCode,
      inferExpenseCategory(expense.purposeDescription),
      expense.currency,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(query);
  });
}

export function sumExpensesByCurrency(
  expenses: FinancialExpense[],
  predicate: (expense: FinancialExpense) => boolean,
) {
  const totals = new Map<ExpenseCurrency, number>();
  for (const expense of expenses) {
    if (!predicate(expense)) continue;
    const currency = expense.currency;
    totals.set(currency, (totals.get(currency) ?? 0) + expense.amount);
  }
  return totals;
}

export type VendorSpendRow = {
  vendor: string;
  count: number;
  totalByCurrency: Map<ExpenseCurrency, number>;
};

export function buildSpendByVendor(expenses: FinancialExpense[]): VendorSpendRow[] {
  const buckets = new Map<string, VendorSpendRow>();
  for (const expense of expenses) {
    if (!isCountableExpense(expense)) continue;
    const vendor = expense.supplier?.trim() || "Unknown";
    const current = buckets.get(vendor) ?? {
      vendor,
      count: 0,
      totalByCurrency: new Map<ExpenseCurrency, number>(),
    };
    current.count += 1;
    current.totalByCurrency.set(
      expense.currency,
      (current.totalByCurrency.get(expense.currency) ?? 0) + expense.amount,
    );
    buckets.set(vendor, current);
  }
  return [...buckets.values()].sort((a, b) => b.count - a.count);
}

export function formatMultiCurrencyTotals(totals: Map<ExpenseCurrency, number>) {
  if (totals.size === 0) return "—";
  return [...totals.entries()]
    .map(([currency, amount]) => `${currency} ${amount.toFixed(2)}`)
    .join(" · ");
}
