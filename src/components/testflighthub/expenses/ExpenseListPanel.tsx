"use client";

import { FileText, Loader2, Pencil } from "lucide-react";

import {
  expenseWorkflowLabel,
  formatExpenseAmount,
  type FinancialExpense,
} from "@/lib/expenses-data";
import { formatShortDate } from "@/lib/expense-workflow-summary";
import { cn } from "@/lib/utils";

type ExpenseListPanelProps = {
  expenses: FinancialExpense[];
  loading?: boolean;
  emptyMessage?: string;
  onSelect?: (expense: FinancialExpense) => void;
  onEdit?: (expense: FinancialExpense) => void;
  showEmployee?: boolean;
};

function statusTone(status: string) {
  switch (status) {
    case "approved":
    case "paid":
      return "text-emerald-300 bg-emerald-500/15 border-emerald-400/25";
    case "submitted":
      return "text-sky-200 bg-sky-500/15 border-sky-400/25";
    case "changes_requested":
      return "text-amber-200 bg-amber-500/15 border-amber-400/25";
    case "rejected":
      return "text-red-200 bg-red-500/15 border-red-400/25";
    case "scheduled":
      return "text-violet-200 bg-violet-500/15 border-violet-400/25";
    default:
      return "text-white/60 bg-white/[0.06] border-white/10";
  }
}

export default function ExpenseListPanel({
  expenses,
  loading,
  emptyMessage = "No expenses yet.",
  onSelect,
  onEdit,
  showEmployee,
}: ExpenseListPanelProps) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-white/50">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading expenses…
      </div>
    );
  }

  if (!expenses.length) {
    return <p className="text-sm text-white/45">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-3">
      {expenses.map((expense) => (
        <article
          key={expense.id}
          className={cn(
            "rounded-2xl border border-white/10 bg-[#0b1524]/60 p-4 transition-colors",
            onSelect && "cursor-pointer hover:border-sky-400/25 hover:bg-[#0b1524]",
          )}
          onClick={() => onSelect?.(expense)}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-white/45">
                Expense #{expense.expenseNumber ?? expense.id.slice(0, 8)}
              </p>
              <p className="mt-1 text-sm font-semibold text-white">{expense.description}</p>
              {showEmployee && (
                <p className="mt-1 text-xs text-white/45">{expense.submitterName}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-white">
                {formatExpenseAmount(expense.amount, expense.currency)}
              </p>
              <span
                className={cn(
                  "mt-1 inline-flex rounded-lg border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                  statusTone(expense.workflowStatus),
                )}
              >
                {expenseWorkflowLabel(expense.workflowStatus)}
              </span>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-white/40">
            <span>Submitted: {formatShortDate(expense.submittedAt ?? expense.dateSubmitted)}</span>
            {expense.expectedPaymentDate && (
              <span>Expected payment: {formatShortDate(expense.expectedPaymentDate)}</span>
            )}
            {expense.paidAt && <span>Paid: {formatShortDate(expense.paidAt)}</span>}
            {expense.attachmentPath && (
              <span className="inline-flex items-center gap-1 text-sky-300/80">
                <FileText className="h-3 w-3" />
                Receipt
              </span>
            )}
          </div>
          {onEdit &&
            (expense.workflowStatus === "draft" || expense.workflowStatus === "changes_requested") && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onEdit(expense);
                }}
                className="mt-3 inline-flex items-center gap-1 text-xs text-sky-300 hover:text-sky-200"
              >
                <Pencil className="h-3 w-3" />
                Edit
              </button>
            )}
        </article>
      ))}
    </div>
  );
}
