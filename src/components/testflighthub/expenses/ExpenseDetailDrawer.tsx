"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";

import {
  expenseWorkflowLabel,
  formatExpenseAmount,
  type FinancialExpense,
} from "@/lib/expenses-data";
import type { ExpenseApprovalEvent } from "@/lib/expense-management/types";
import type { ExpenseBillingCode, ExpenseCategory } from "@/lib/expense-management/types";
import type { HrEmployee } from "@/lib/hr-data";
import { formatShortDate } from "@/lib/expense-workflow-summary";

import { readApiJson } from "./expense-hub-shared";

type ExpenseDetailDrawerProps = {
  expense: FinancialExpense | null;
  onClose: () => void;
  employees: HrEmployee[];
  categories: ExpenseCategory[];
  billingCodes: ExpenseBillingCode[];
};

function actionLabel(action: string) {
  switch (action) {
    case "submitted":
      return "Submitted";
    case "resubmitted":
      return "Resubmitted";
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
    case "changes_requested":
      return "Changes requested";
    case "scheduled":
      return "Scheduled for payment";
    case "paid":
      return "Paid";
    default:
      return action;
  }
}

function claimantName(expense: FinancialExpense, employees: HrEmployee[]) {
  if (!expense.claimantEmployeeId) return expense.submitterName ?? "—";
  const match = employees.find((row) => row.id === expense.claimantEmployeeId);
  return match?.fullName ?? expense.submitterName;
}

function categoryName(expense: FinancialExpense, categories: ExpenseCategory[]) {
  if (!expense.expenseCategoryId) return "—";
  return categories.find((row) => row.id === expense.expenseCategoryId)?.name ?? "—";
}

function billingName(expense: FinancialExpense, billingCodes: ExpenseBillingCode[]) {
  if (!expense.billingCodeId) return "—";
  const code = billingCodes.find((row) => row.id === expense.billingCodeId);
  return code ? `${code.code} — ${code.name}` : "—";
}

export default function ExpenseDetailDrawer({
  expense,
  onClose,
  employees,
  categories,
  billingCodes,
}: ExpenseDetailDrawerProps) {
  const [events, setEvents] = useState<ExpenseApprovalEvent[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const loadHistory = useCallback(async (expenseId: string) => {
    setLoadingHistory(true);
    try {
      const response = await fetch(`/api/expenses/${expenseId}/approval-history`, {
        cache: "no-store",
      });
      const data = await readApiJson<{ events?: ExpenseApprovalEvent[] }>(response);
      if (response.ok) setEvents(data.events ?? []);
    } catch {
      setEvents([]);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    if (!expense) {
      setEvents([]);
      return;
    }
    void loadHistory(expense.id);
  }, [expense, loadHistory]);

  if (!expense) return null;

  const receiptUrl = expense.attachmentPath
    ? `/api/files/objects/${encodeURIComponent(expense.attachmentPath)}`
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close expense detail"
      />
      <div
        className="relative z-10 flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-white/15 bg-[#0b1524] shadow-2xl sm:rounded-2xl"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between gap-3 border-b border-white/10 px-5 py-4">
          <div>
            <p className="text-xs text-white/45">
              Expense #{expense.expenseNumber ?? expense.id.slice(0, 8)}
            </p>
            <h3 className="mt-1 text-base font-semibold text-white">{expense.description}</h3>
            <p className="mt-1 text-sm text-white/55">
              {expenseWorkflowLabel(expense.workflowStatus)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/10 p-2 text-white/60 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 overflow-y-auto px-5 py-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <DetailField label="Assigned to" value={claimantName(expense, employees)} />
            <DetailField label="Submitted by" value={expense.submitterName} />
            <DetailField label="Category" value={categoryName(expense, categories)} />
            <DetailField label="Billing code" value={billingName(expense, billingCodes)} />
            <DetailField label="Vendor" value={expense.supplier ?? "—"} />
            <DetailField label="Date" value={formatShortDate(expense.expenseDate)} />
            <DetailField
              label="Amount"
              value={formatExpenseAmount(expense.amount, expense.currency)}
            />
            <DetailField label="Expected payment" value={formatShortDate(expense.expectedPaymentDate)} />
            <DetailField label="Paid date" value={formatShortDate(expense.paidAt)} />
          </div>

          {expense.expenseType === "mileage" && (
            <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-white/45">
                Mileage / travel
              </h4>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 text-sm text-white/75">
                <p>From: {expense.mileageFrom ?? "—"}</p>
                <p>To: {expense.mileageTo ?? "—"}</p>
                <p>
                  Distance: {expense.mileageDistance ?? "—"} {expense.mileageDistanceUnit ?? ""}
                </p>
                <p>Rate: {expense.mileageRate ?? "—"}</p>
                <p>
                  Calculated:{" "}
                  {expense.mileageCalculatedAmount != null
                    ? formatExpenseAmount(expense.mileageCalculatedAmount, expense.currency)
                    : "—"}
                </p>
              </div>
            </section>
          )}

          {receiptUrl && (
            <section className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-white/45">Receipt</h4>
              <a
                href={receiptUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-sky-300 hover:text-sky-200"
              >
                Open receipt
              </a>
              <div className="overflow-hidden rounded-xl border border-white/10 bg-black/30">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={receiptUrl}
                  alt="Expense receipt"
                  className="max-h-64 w-full object-contain"
                  onError={(event) => {
                    (event.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            </section>
          )}

          <section className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-white/45">
              Approval history
            </h4>
            {loadingHistory ? (
              <div className="flex items-center gap-2 text-sm text-white/50">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading history…
              </div>
            ) : events.length === 0 ? (
              <p className="text-sm text-white/45">No approval events recorded yet.</p>
            ) : (
              <ul className="space-y-2">
                {events.map((event) => (
                  <li
                    key={event.id}
                    className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium text-white/85">{actionLabel(event.action)}</span>
                      <span className="text-xs text-white/40">
                        {formatShortDate(event.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-white/45">{event.actorName}</p>
                    {event.comment && (
                      <p className="mt-1 text-xs text-white/60">{event.comment}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.12em] text-white/40">{label}</p>
      <p className="mt-1 text-sm text-white/80">{value}</p>
    </div>
  );
}
