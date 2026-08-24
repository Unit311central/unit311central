"use client";

import { useState } from "react";
import { Check, Loader2, MessageSquare, X } from "lucide-react";

import type { FinancialExpense } from "@/lib/expenses-data";
import { formatExpenseAmount } from "@/lib/expenses-data";

import { readApiJson } from "./expense-hub-shared";

type ExpenseApprovalsPanelProps = {
  expenses: FinancialExpense[];
  loading?: boolean;
  onActionComplete: () => void;
};

export default function ExpenseApprovalsPanel({
  expenses,
  loading,
  onActionComplete,
}: ExpenseApprovalsPanelProps) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);

  const queue = expenses.filter((expense) => expense.workflowStatus === "submitted");

  async function runAction(
    expenseId: string,
    action: "approve" | "reject" | "request-changes",
  ) {
    setBusyId(expenseId);
    setError(null);
    try {
      const response = await fetch(`/api/expenses/${expenseId}/${action === "approve" ? "approve" : action === "reject" ? "reject" : "request-changes"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          comment: comment.trim() || undefined,
          schedule: action === "approve",
        }),
      });
      const data = await readApiJson<{ error?: string }>(response);
      if (!response.ok) throw new Error(data.error ?? "Action failed");
      setComment("");
      onActionComplete();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Action failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <FieldLabel>Approver comment</FieldLabel>
        <textarea
          className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#0b1524] px-3 py-2 text-sm text-white outline-none focus:border-sky-400/50"
          rows={2}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder="Optional reason or note for the employee"
        />
      </div>

      {error && (
        <div className="rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </div>
      )}

      {queue.length === 0 && !loading ? (
        <p className="text-sm text-white/45">No expenses awaiting approval.</p>
      ) : (
        <div className="space-y-4">
          {queue.map((expense) => (
            <div
              key={expense.id}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">{expense.description}</p>
                  <p className="mt-1 text-xs text-white/45">
                    {expense.submitterName} · {formatExpenseAmount(expense.amount, expense.currency)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busyId === expense.id}
                    onClick={() => void runAction(expense.id, "approve")}
                    className="inline-flex items-center gap-1 rounded-lg border border-emerald-400/30 bg-emerald-500/15 px-3 py-1.5 text-xs text-emerald-100"
                  >
                    {busyId === expense.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Check className="h-3 w-3" />
                    )}
                    Approve
                  </button>
                  <button
                    type="button"
                    disabled={busyId === expense.id}
                    onClick={() => void runAction(expense.id, "request-changes")}
                    className="inline-flex items-center gap-1 rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-100"
                  >
                    <MessageSquare className="h-3 w-3" />
                    Request changes
                  </button>
                  <button
                    type="button"
                    disabled={busyId === expense.id}
                    onClick={() => void runAction(expense.id, "reject")}
                    className="inline-flex items-center gap-1 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-1.5 text-xs text-red-100"
                  >
                    <X className="h-3 w-3" />
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/45">
      {children}
    </label>
  );
}
