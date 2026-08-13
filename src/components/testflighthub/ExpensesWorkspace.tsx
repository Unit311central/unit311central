"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, startTransition } from "react";

import {
  formatExpenseAmount,
  isAccountsPayableSeedExpense,
  isCountableExpense,
  isExpenseDraft,
  semanticCategoryForBillingCode,
  EXPENSE_SEMANTIC_CATEGORIES,
  type FinancialExpense,
} from "@/lib/expenses-data";
import { expenseToBulkRow } from "@/lib/expenses-bulk-entry";
import {
  buildSpendByVendor,
  EMPTY_EXPENSE_LOG_FILTER,
  filterExpenses,
  formatMultiCurrencyTotals,
  isReimbursableOwedExpense,
  isSoftwareExpense,
  sumExpensesByCurrency,
  type ExpenseLogFilter,
} from "@/lib/expenses-summary";
import ExpenseBulkEntryGrid, {
  type ExpenseBulkEntryGridHandle,
} from "@/components/testflighthub/ExpenseBulkEntryGrid";
import {
  sumPaidInvoiceAmounts,
  sumUpcomingInvoiceAmounts,
  type ProviderBillingInvoice,
} from "@/lib/software-billing/billing-invoice-model";
import DashboardTopTilesBar from "@/components/testflighthub/DashboardTopTilesBar";
import {
  buildExpensesDashboardCatalog,
  DEFAULT_EXPENSES_TILE_LAYOUT,
} from "@/lib/view-dashboard-tile-catalogs";
import { cn } from "@/lib/utils";
import { isBrowserOnwardAirSurface } from "@/lib/onwardair-surface";
import { ArrowLeft, ExternalLink, Loader2, Pencil, Receipt, Trash2 } from "lucide-react";

async function readApiJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text) throw new Error(`Request failed (${response.status})`);
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(response.ok ? "Invalid server response." : text.slice(0, 180));
  }
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/45">
      {children}
    </label>
  );
}

function inputClassName() {
  return "mt-1.5 w-full rounded-xl border border-white/10 bg-[#0b1524] px-3 py-2 text-sm text-white outline-none transition-colors focus:border-sky-400/50";
}

type SoftwareBillingSnapshot = {
  currency: string;
  paidTotal: number;
  upcomingTotal: number;
};

type ExpensesWorkspaceProps = {
  onBackToFinancials?: () => void;
};

export default function ExpensesWorkspace({ onBackToFinancials }: ExpensesWorkspaceProps) {
  const gridRef = useRef<ExpenseBulkEntryGridHandle>(null);
  const [expenses, setExpenses] = useState<FinancialExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [filter, setFilter] = useState<ExpenseLogFilter>(EMPTY_EXPENSE_LOG_FILTER);
  const [softwareBilling, setSoftwareBilling] = useState<SoftwareBillingSnapshot | null>(null);

  const claimExpenses = useMemo(
    () => expenses.filter((expense) => !isAccountsPayableSeedExpense(expense)),
    [expenses],
  );

  const countableExpenses = useMemo(
    () => claimExpenses.filter((expense) => isCountableExpense(expense)),
    [claimExpenses],
  );

  const draftExpenses = useMemo(
    () => claimExpenses.filter((expense) => isExpenseDraft(expense)),
    [claimExpenses],
  );

  const filteredExpenses = useMemo(
    () => filterExpenses(claimExpenses, filter),
    [claimExpenses, filter],
  );

  const reimbursableTotals = useMemo(
    () => sumExpensesByCurrency(claimExpenses, isReimbursableOwedExpense),
    [claimExpenses],
  );

  const softwareExpenseTotals = useMemo(
    () => sumExpensesByCurrency(countableExpenses, isSoftwareExpense),
    [countableExpenses],
  );

  const spendByVendor = useMemo(() => buildSpendByVendor(countableExpenses), [countableExpenses]);

  const expensesDashboardCatalog = useMemo(
    () => buildExpensesDashboardCatalog(countableExpenses),
    [countableExpenses],
  );

  const loadExpenses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/financials/expenses", { cache: "no-store" });
      const data = await readApiJson<{ expenses?: FinancialExpense[]; error?: string }>(response);
      if (!response.ok) throw new Error(data.error ?? "Failed to load expenses");
      setExpenses((data.expenses ?? []).filter((expense) => !isAccountsPayableSeedExpense(expense)));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load expenses");
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSoftwareBilling = useCallback(async () => {
    try {
      const response = await fetch("/api/internal/software-billing/summary", { cache: "no-store" });
      if (!response.ok) return;
      const data = await readApiJson<{
        summary?: { currency?: string };
        providerInvoices?: ProviderBillingInvoice[];
      }>(response);
      const invoices = data.providerInvoices ?? [];
      setSoftwareBilling({
        currency: data.summary?.currency ?? "USD",
        paidTotal: sumPaidInvoiceAmounts(invoices),
        upcomingTotal: sumUpcomingInvoiceAmounts(invoices),
      });
    } catch {
      // Optional read-only enrichment — ignore if unavailable.
    }
  }, []);

  useEffect(() => {
    startTransition(() => {
      void loadExpenses();
      void loadSoftwareBilling();
    });
  }, [loadExpenses, loadSoftwareBilling]);

  function handleBulkSaved(saved: FinancialExpense[], message: string) {
    setExpenses((current) => {
      const byId = new Map(current.map((entry) => [entry.id, entry]));
      for (const expense of saved) {
        byId.set(expense.id, expense);
      }
      return [...byId.values()].sort((a, b) =>
        String(b.expenseDate || b.dateSubmitted).localeCompare(String(a.expenseDate || a.dateSubmitted)),
      );
    });
    setSaveMessage(message);
    setError(null);
    void loadSoftwareBilling();
  }

  function handleEditInGrid(expense: FinancialExpense) {
    gridRef.current?.loadRows([expenseToBulkRow(expense, 0)]);
    setSaveMessage(null);
    setError(null);
  }

  async function handleDeleteExpense(expense: FinancialExpense) {
    if (!window.confirm(`Delete expense for "${expense.supplier || expense.purposeDescription}"?`)) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/financials/expenses/${expense.id}`, { method: "DELETE" });
      const data = await readApiJson<{ error?: string }>(response);
      if (!response.ok) throw new Error(data.error ?? "Failed to delete expense");
      setExpenses((current) => current.filter((entry) => entry.id !== expense.id));
      setSaveMessage("Expense deleted");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Failed to delete expense");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <DashboardTopTilesBar
        storageKey={
          isBrowserOnwardAirSurface()
            ? "oa-expenses-dashboard-tiles-v2"
            : "unit311-expenses-dashboard-tiles"
        }
        catalog={expensesDashboardCatalog}
        defaultLayout={DEFAULT_EXPENSES_TILE_LAYOUT}
        title="Expenses key details"
        showCustomizeHint={false}
      />

      <section className="rounded-2xl border border-white/15 bg-white/[0.04] p-5 shadow-[0_24px_64px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl sm:p-6">
        <div className="flex flex-wrap items-start gap-3">
          {onBackToFinancials && (
            <button
              type="button"
              onClick={onBackToFinancials}
              className="mt-0.5 inline-flex h-9 items-center gap-1.5 rounded-xl border border-white/10 px-3 text-xs text-white/60 transition-colors hover:border-white/20 hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Financials
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-white">Reimbursable expenses</h3>
            </div>
            <p className="mt-1 text-xs text-white/45">
              Personally paid business expenses owed back to you · {claimExpenses.length} records ·{" "}
              {draftExpenses.length} draft{draftExpenses.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-sky-400/20 bg-sky-500/10 px-4 py-3">
            <p className="text-[10px] uppercase tracking-[0.12em] text-sky-200/70">Owed to you</p>
            <p className="mt-1 text-sm font-semibold text-white">
              {formatMultiCurrencyTotals(reimbursableTotals)}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#0b1524]/70 px-4 py-3">
            <p className="text-[10px] uppercase tracking-[0.12em] text-white/40">Software (expenses)</p>
            <p className="mt-1 text-sm font-semibold text-white">
              {formatMultiCurrencyTotals(softwareExpenseTotals)}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#0b1524]/70 px-4 py-3">
            <p className="text-[10px] uppercase tracking-[0.12em] text-white/40">Software billing (confirmed)</p>
            <p className="mt-1 text-sm font-semibold text-white">
              {softwareBilling
                ? `${softwareBilling.currency} ${softwareBilling.paidTotal.toFixed(2)}`
                : "—"}
            </p>
            <p className="mt-1 text-[10px] text-white/40">Paid provider invoices only</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#0b1524]/70 px-4 py-3">
            <p className="text-[10px] uppercase tracking-[0.12em] text-white/40">Upcoming software</p>
            <p className="mt-1 text-sm font-semibold text-white">
              {softwareBilling
                ? `${softwareBilling.currency} ${softwareBilling.upcomingTotal.toFixed(2)}`
                : "—"}
            </p>
            <Link
              href="?view=software-saas"
              className="mt-1 inline-flex text-[10px] text-sky-300/90 hover:text-sky-200"
            >
              Open Software &amp; SaaS →
            </Link>
          </div>
        </div>
      </section>

      <ExpenseBulkEntryGrid
        ref={gridRef}
        busy={busy}
        draftExpenses={draftExpenses}
        onSaved={handleBulkSaved}
        onError={setError}
      />

      {saveMessage && (
        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {saveMessage}
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <section className="rounded-2xl border border-white/15 bg-white/[0.04] p-4 shadow-[0_24px_64px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-white">Spend by vendor</h3>
            <p className="mt-1 text-xs text-white/45">Submitted expenses grouped by vendor</p>
          </div>
        </div>
        {spendByVendor.length === 0 ? (
          <p className="mt-4 text-sm text-white/45">No submitted expenses yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[28rem] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-white/[0.08] text-[10px] font-medium uppercase tracking-[0.12em] text-white/35">
                  <th className="px-3 py-2 font-medium">Vendor</th>
                  <th className="px-3 py-2 font-medium text-right">Items</th>
                  <th className="px-3 py-2 font-medium text-right">Totals</th>
                </tr>
              </thead>
              <tbody>
                {spendByVendor.slice(0, 12).map((row) => (
                  <tr key={row.vendor} className="border-b border-white/[0.05] last:border-0">
                    <td className="px-3 py-2.5 font-medium text-white/90">{row.vendor}</td>
                    <td className="px-3 py-2.5 text-right text-white/55">{row.count}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-white/80">
                      {formatMultiCurrencyTotals(row.totalByCurrency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-white/15 bg-white/[0.04] p-4 shadow-[0_24px_64px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-white">Expense log</h3>
            <p className="mt-1 text-xs text-white/45">
              {filteredExpenses.length} of {claimExpenses.length} records shown
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <FieldLabel>Search</FieldLabel>
            <input
              className={inputClassName()}
              value={filter.query}
              placeholder="Vendor, purpose, invoice #…"
              onChange={(event) => setFilter((current) => ({ ...current, query: event.target.value }))}
            />
          </div>
          <div>
            <FieldLabel>Status</FieldLabel>
            <select
              className={cn(inputClassName(), "mt-0")}
              value={filter.status}
              onChange={(event) =>
                setFilter((current) => ({
                  ...current,
                  status: event.target.value as ExpenseLogFilter["status"],
                }))
              }
            >
              <option value="all">All</option>
              <option value="draft">Draft</option>
              <option value="finalized">Submitted</option>
              <option value="reimbursable">Reimbursable</option>
            </select>
          </div>
          <div>
            <FieldLabel>Category</FieldLabel>
            <select
              className={cn(inputClassName(), "mt-0")}
              value={filter.category}
              onChange={(event) => setFilter((current) => ({ ...current, category: event.target.value }))}
            >
              <option value="">All</option>
              {EXPENSE_SEMANTIC_CATEGORIES.map((entry) => (
                <option key={entry.label} value={entry.label}>
                  {entry.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <FieldLabel>From</FieldLabel>
            <input
              type="date"
              className={cn(inputClassName(), "mt-0")}
              value={filter.dateFrom}
              onChange={(event) => setFilter((current) => ({ ...current, dateFrom: event.target.value }))}
            />
          </div>
          <div>
            <FieldLabel>To</FieldLabel>
            <input
              type="date"
              className={cn(inputClassName(), "mt-0")}
              value={filter.dateTo}
              onChange={(event) => setFilter((current) => ({ ...current, dateTo: event.target.value }))}
            />
          </div>
        </div>

        {loading ? (
          <div className="mt-6 flex items-center gap-3 text-sm text-white/55">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading expenses…
          </div>
        ) : filteredExpenses.length === 0 ? (
          <p className="mt-6 text-sm text-white/45">
            No matching expenses. Use the grid above to enter reimbursable expenses.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[980px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-white/[0.08] text-[9px] font-medium uppercase tracking-[0.12em] text-white/35">
                  <th className="px-3 py-2.5 font-medium">Vendor</th>
                  <th className="px-3 py-2.5 font-medium">Purpose</th>
                  <th className="px-3 py-2.5 font-medium">Category</th>
                  <th className="px-3 py-2.5 font-medium">Date paid</th>
                  <th className="px-3 py-2.5 font-medium">Invoice #</th>
                  <th className="px-3 py-2.5 font-medium">Amount</th>
                  <th className="px-3 py-2.5 font-medium">Status</th>
                  <th className="px-3 py-2.5 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="border-b border-white/[0.05] last:border-0">
                    <td className="px-3 py-2.5 font-medium text-white/90">{expense.supplier || "—"}</td>
                    <td className="px-3 py-2.5 text-white/70">{expense.purposeDescription || "—"}</td>
                    <td className="px-3 py-2.5 text-white/55">
                      {semanticCategoryForBillingCode(expense.categoryAccountCode)}
                    </td>
                    <td className="px-3 py-2.5 text-white/55">
                      {expense.expenseDate || expense.dateSubmitted}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-white/55">{expense.reference || "—"}</td>
                    <td className="px-3 py-2.5 font-mono text-white/80">
                      {formatExpenseAmount(expense.amount, expense.currency)}
                    </td>
                    <td className="px-3 py-2.5">
                      {isExpenseDraft(expense) ? (
                        <span className="rounded-full border border-amber-400/40 bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-amber-200">
                          Draft
                        </span>
                      ) : expense.reimbursable ? (
                        <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-sky-300">
                          Reimbursable
                        </span>
                      ) : (
                        <span className="text-[10px] text-white/45">Submitted</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex flex-wrap items-center justify-end gap-1.5">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => handleEditInGrid(expense)}
                          className="inline-flex h-8 items-center gap-1 rounded-lg border border-white/10 px-2.5 text-xs text-white/70 transition-colors hover:border-white/20 hover:text-white disabled:opacity-50"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </button>
                        {expense.journalEntryId ? (
                          <Link
                            href={`?view=general-ledger&journal=${encodeURIComponent(expense.journalEntryId)}`}
                            className="inline-flex h-8 items-center gap-1 rounded-lg border border-sky-500/30 px-2.5 text-xs text-sky-300 transition-colors hover:border-sky-400/50 hover:bg-sky-500/10"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            Journal
                          </Link>
                        ) : null}
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void handleDeleteExpense(expense)}
                          className="inline-flex h-8 items-center gap-1 rounded-lg border border-red-400/20 px-2.5 text-xs text-red-300 transition-colors hover:bg-red-500/10 disabled:opacity-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
