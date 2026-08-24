"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { formatMoney } from "@/lib/accounting/chart-of-accounts";
import type { ExpenseRun, ExpenseRunStatus } from "@/lib/expense-management/types";
import { formatShortDate } from "@/lib/expense-workflow-summary";

import { readApiJson } from "./expense-hub-shared";

const RUN_STATUS_LABELS: Record<ExpenseRunStatus, string> = {
  open: "Open",
  review: "Review",
  approved: "Approved",
  payment_scheduled: "Payment scheduled",
  paid: "Paid",
};

export default function ExpenseRunsPanel() {
  const [runs, setRuns] = useState<ExpenseRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/expenses/runs", { cache: "no-store" });
      const data = await readApiJson<{ runs?: ExpenseRun[]; error?: string }>(response);
      if (!response.ok) throw new Error(data.error ?? "Failed to load runs");
      setRuns(data.runs ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load runs");
      setRuns([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function updateRunStatus(runId: string, status: ExpenseRunStatus) {
    setBusyId(runId);
    setError(null);
    try {
      const response = await fetch(`/api/expenses/runs/${runId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await readApiJson<{ error?: string }>(response);
      if (!response.ok) throw new Error(data.error ?? "Update failed");
      await load();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Update failed");
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-white/50">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading expense runs…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </div>
      )}

      {runs.length === 0 ? (
        <p className="text-sm text-white/45">No expense runs yet. Runs are created when expenses are approved.</p>
      ) : (
        <div className="space-y-3">
          {runs.map((run) => (
            <article
              key={run.id}
              className="rounded-2xl border border-white/10 bg-[#0b1524]/60 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">{run.label}</p>
                  <p className="mt-1 text-xs text-white/45">
                    Cut-off {formatShortDate(run.cutoffDate)} · Payment {formatShortDate(run.paymentDate)}
                  </p>
                  <p className="mt-1 text-xs text-white/45">
                    {run.expenseCount} expenses · {formatMoney(run.totalAmount, run.currency)}
                  </p>
                </div>
                <span className="rounded-lg border border-white/10 bg-white/[0.05] px-2 py-1 text-[10px] uppercase tracking-wide text-white/55">
                  {RUN_STATUS_LABELS[run.status]}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {run.status === "open" && (
                  <button
                    type="button"
                    disabled={busyId === run.id}
                    onClick={() => void updateRunStatus(run.id, "review")}
                    className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/70 hover:text-white"
                  >
                    Mark review
                  </button>
                )}
                {run.status === "review" && (
                  <button
                    type="button"
                    disabled={busyId === run.id}
                    onClick={() => void updateRunStatus(run.id, "approved")}
                    className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-100"
                  >
                    Confirm run
                  </button>
                )}
                {(run.status === "approved" || run.status === "payment_scheduled") && (
                  <button
                    type="button"
                    disabled={busyId === run.id}
                    onClick={() => void updateRunStatus(run.id, "paid")}
                    className="rounded-lg border border-sky-400/30 bg-sky-500/10 px-3 py-1.5 text-xs text-sky-100"
                  >
                    Mark paid
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
