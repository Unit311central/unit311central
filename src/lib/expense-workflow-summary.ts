import { formatMoney } from "@/lib/accounting/chart-of-accounts";
import {
  expenseWorkflowLabel,
  formatExpenseAmount,
  isAccountsPayableSeedExpense,
  type ExpenseCurrency,
  type ExpenseWorkflowStatus,
  type FinancialExpense,
} from "@/lib/expenses-data";
import type { DashboardTileDefinition } from "@/lib/dashboard-view-tiles";

export const EXPENSE_WORKFLOW_TILE_IDS = [
  "owed-to-you",
  "draft",
  "submitted",
  "awaiting-approval",
  "approved",
  "scheduled",
  "paid",
] as const;

export type ExpenseWorkflowTileId = (typeof EXPENSE_WORKFLOW_TILE_IDS)[number];

export const DEFAULT_EXPENSE_WORKFLOW_TILE_LAYOUT: ExpenseWorkflowTileId[] = [
  "owed-to-you",
  "draft",
  "submitted",
  "approved",
  "scheduled",
  "paid",
];

function isEmployeeClaim(expense: FinancialExpense) {
  return !isAccountsPayableSeedExpense(expense);
}

export function countExpensesByWorkflow(
  expenses: FinancialExpense[],
  status: ExpenseWorkflowStatus,
): number {
  return expenses.filter(
    (expense) => isEmployeeClaim(expense) && expense.workflowStatus === status,
  ).length;
}

export function sumOwedToEmployee(
  expenses: FinancialExpense[],
  currency: string,
): number {
  return expenses
    .filter(
      (expense) =>
        isEmployeeClaim(expense) &&
        expense.reimbursable &&
        !expense.paid &&
        (expense.workflowStatus === "approved" ||
          expense.workflowStatus === "scheduled" ||
          expense.workflowStatus === "submitted"),
    )
    .filter((expense) => String(expense.currency).toUpperCase() === currency.toUpperCase())
    .reduce((sum, expense) => sum + Number(expense.amount) || 0, 0);
}

export function buildExpenseWorkflowDashboardCatalog(
  expenses: FinancialExpense[],
  currency: string,
): DashboardTileDefinition[] {
  const claims = expenses.filter(isEmployeeClaim);
  const owed = sumOwedToEmployee(claims, currency);
  const money = (value: number) => formatMoney(value, currency);

  const tiles: Record<ExpenseWorkflowTileId, DashboardTileDefinition> = {
    "owed-to-you": {
      id: "owed-to-you",
      label: "Owed to you",
      value: money(owed),
      hint: "Approved & scheduled reimbursements",
    },
    draft: {
      id: "draft",
      label: "Draft",
      value: String(countExpensesByWorkflow(claims, "draft")),
      hint: "Not yet submitted",
    },
    submitted: {
      id: "submitted",
      label: "Submitted",
      value: String(countExpensesByWorkflow(claims, "submitted")),
      hint: "Awaiting review",
    },
    "awaiting-approval": {
      id: "awaiting-approval",
      label: "Awaiting approval",
      value: String(countExpensesByWorkflow(claims, "submitted")),
      hint: "In approval queue",
    },
    approved: {
      id: "approved",
      label: "Approved",
      value: String(countExpensesByWorkflow(claims, "approved")),
      hint: "Eligible for payment",
    },
    scheduled: {
      id: "scheduled",
      label: "Scheduled",
      value: String(countExpensesByWorkflow(claims, "scheduled")),
      hint: "On an expense run",
    },
    paid: {
      id: "paid",
      label: "Paid",
      value: String(countExpensesByWorkflow(claims, "paid")),
      hint: "Reimbursed",
    },
  };

  return DEFAULT_EXPENSE_WORKFLOW_TILE_LAYOUT.map((id) => tiles[id]);
}

export function formatExpenseDisplayAmount(expense: FinancialExpense) {
  return formatExpenseAmount(expense.amount, expense.currency as ExpenseCurrency);
}

export function formatExpenseStatusLabel(expense: FinancialExpense) {
  return expenseWorkflowLabel(expense.workflowStatus);
}

export function formatShortDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
