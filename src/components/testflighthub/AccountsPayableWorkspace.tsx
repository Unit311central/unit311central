"use client";

import { useCallback, useEffect, useMemo, useState, startTransition } from "react";
import Link from "next/link";
import { Loader2, RefreshCw, Receipt } from "lucide-react";

import { formatMoney } from "@/lib/accounting/chart-of-accounts";
import { isBrowserCorpCentreSurface } from "@/lib/corpcentre-surface";
import { isBrowserDemoSurface } from "@/lib/demo-enterprise";
import { isBrowserOnwardAirSurface } from "@/lib/onwardair-surface";
import { resolveBrowserReportingCurrency } from "@/lib/financial-reporting-currency";
import type { NorthstarPayableCategory } from "@/lib/demo/northstar-ap-ar-fixtures";
import { cn } from "@/lib/utils";

type PayableRow = {
  id: string;
  supplier: string;
  description: string;
  amount: number;
  currency: string;
  dueDate: string;
  paid: boolean;
  category: NorthstarPayableCategory;
  journalEntryId: string | null;
  paymentJournalEntryId: string | null;
  reference: string | null;
};

const CATEGORY_LABELS: Record<NorthstarPayableCategory, string> = {
  payroll: "Payroll",
  opex: "Opex",
  expense: "Operating expenses",
};

export default function AccountsPayableWorkspace() {
  const [rows, setRows] = useState<PayableRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<NorthstarPayableCategory | "all">("all");
  const isDemo = isBrowserDemoSurface();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const endpoint = isDemo ? "/api/financials/payables" : "/api/financials/expenses";
      const response = await fetch(endpoint, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Failed to load payables");

      if (isDemo) {
        const payables = (data.payables ?? []) as Array<Record<string, unknown>>;
        setRows(
          payables.map((row) => ({
            id: String(row.id),
            supplier: String(row.supplier ?? "Supplier"),
            description: String(row.description ?? ""),
            amount: Number(row.amount) || 0,
            currency: String(row.currency ?? "GBP"),
            dueDate: String(row.dueDate ?? ""),
            paid: Boolean(row.paid),
            category: (row.category as NorthstarPayableCategory) ?? "expense",
            journalEntryId: row.journalEntryId ? String(row.journalEntryId) : null,
            paymentJournalEntryId: row.paymentJournalEntryId
              ? String(row.paymentJournalEntryId)
              : null,
            reference: row.reference ? String(row.reference) : null,
          })),
        );
        return;
      }

      const expenses = (data.expenses ?? []) as Array<Record<string, unknown>>;
      setRows(
        expenses.map((expense) => ({
          id: String(expense.id),
          supplier: String(expense.supplier ?? expense.submitterName ?? "Supplier"),
          description: String(expense.purposeDescription ?? ""),
          amount: Number(expense.amount) || 0,
          currency: String(expense.currency ?? "GBP"),
          dueDate: String(expense.expenseDate ?? expense.dateSubmitted ?? ""),
          paid: Boolean(expense.paid),
          category: "expense" as const,
          journalEntryId: expense.journalEntryId ? String(expense.journalEntryId) : null,
          paymentJournalEntryId: expense.paymentJournalEntryId
            ? String(expense.paymentJournalEntryId)
            : null,
          reference: expense.reference ? String(expense.reference) : null,
        })),
      );
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load payables");
    } finally {
      setLoading(false);
    }
  }, [isDemo]);

  useEffect(() => {
    startTransition(() => {
      void load();
    });
  }, [load]);

  const todayIso = "2026-08-16";
  const monthEnd = "2026-08-31";

  const kpis = useMemo(() => {
    const unpaid = rows.filter((row) => !row.paid);
    const outstanding = unpaid.reduce((sum, row) => sum + row.amount, 0);
    const dueNow = unpaid
      .filter((row) => row.dueDate && row.dueDate <= monthEnd)
      .reduce((sum, row) => sum + row.amount, 0);
    const withinMonth = unpaid
      .filter((row) => row.dueDate && row.dueDate > monthEnd)
      .reduce((sum, row) => sum + row.amount, 0);
    const payroll = unpaid
      .filter((row) => row.category === "payroll")
      .reduce((sum, row) => sum + row.amount, 0);
    const opex = unpaid
      .filter((row) => row.category === "opex")
      .reduce((sum, row) => sum + row.amount, 0);
    const expenses = unpaid
      .filter((row) => row.category === "expense")
      .reduce((sum, row) => sum + row.amount, 0);

    return {
      outstanding: isDemo ? 186_000 : outstanding,
      dueNow: isDemo ? 64_000 : dueNow,
      withinMonth: isDemo ? 122_000 : withinMonth,
      overdue: unpaid
        .filter((row) => row.dueDate && row.dueDate < todayIso)
        .reduce((sum, row) => sum + row.amount, 0),
      payroll,
      opex,
      expenses,
      openCount: unpaid.length,
    };
  }, [isDemo, monthEnd, rows, todayIso]);

  const filteredRows = useMemo(() => {
    if (categoryFilter === "all") return rows;
    return rows.filter((row) => row.category === categoryFilter);
  }, [categoryFilter, rows]);

  const currency = (() => {
    const workspaceCurrency = resolveBrowserReportingCurrency();
    if (workspaceCurrency === "USD") return "USD";
    if (isBrowserOnwardAirSurface()) return "USD";
    if (isBrowserCorpCentreSurface()) return "AUD";
    return "GBP";
  })();
  const money = (amount: number) => formatMoney(amount, currency);

  const cards = isDemo
    ? [
        { label: "Outstanding", value: money(kpis.outstanding) },
        { label: "Due now", value: money(kpis.dueNow) },
        { label: "Within 30 days", value: money(kpis.withinMonth) },
        { label: "Payroll", value: money(kpis.payroll) },
        { label: "Opex", value: money(kpis.opex) },
        { label: "Operating expenses", value: money(kpis.expenses) },
      ]
    : [
        { label: "Outstanding", value: money(kpis.outstanding) },
        { label: "Due This Month", value: money(kpis.dueNow) },
        { label: "Overdue", value: money(kpis.overdue) },
        { label: "Within 30 days", value: money(kpis.withinMonth) },
        { label: "Open items", value: String(kpis.openCount) },
      ];

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <p className="text-sm text-white/55">
            {isDemo
              ? "Supplier liabilities — payroll accruals, opex invoices and operating expenses (not employee expense claims)."
              : "Supplier expenses awaiting settlement, driven by the ledger."}
          </p>
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-white/15 px-3 text-xs font-semibold text-white/80"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            Refresh
          </button>
        </div>
        <div
          className={cn(
            "mt-4 grid gap-3 sm:grid-cols-2",
            isDemo ? "xl:grid-cols-6" : "xl:grid-cols-5",
          )}
        >
          {cards.map((card) => (
            <div
              key={card.label}
              className="rounded-xl border border-white/10 bg-[#0b1524]/70 px-4 py-3"
            >
              <p className="text-[10px] uppercase tracking-[0.12em] text-white/45">{card.label}</p>
              <p className="mt-1 text-xl font-semibold tabular-nums text-white">{card.value}</p>
            </div>
          ))}
        </div>
      </section>

      {error ? (
        <p className="rounded-xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </p>
      ) : null}

      <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
          <p className="text-sm font-medium text-white/70">{filteredRows.length} open payables</p>
          {isDemo ? (
            <div className="flex flex-wrap gap-1.5">
              {(["all", "payroll", "opex", "expense"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setCategoryFilter(option)}
                  className={cn(
                    "rounded-lg border px-2.5 py-1 text-[11px] font-medium",
                    categoryFilter === option
                      ? "border-sky-400/40 bg-sky-500/15 text-sky-100"
                      : "border-white/10 text-white/50 hover:text-white/75",
                  )}
                >
                  {option === "all" ? "All" : CATEGORY_LABELS[option]}
                </button>
              ))}
            </div>
          ) : null}
        </div>
        {loading ? (
          <div className="flex items-center gap-2 px-5 py-10 text-sm text-white/55">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading payables…
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <Receipt className="mx-auto h-8 w-8 text-white/25" />
            <p className="mt-3 text-sm text-white/50">No supplier payables in this view.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[52rem] text-left text-sm">
              <thead className="border-b border-white/10 text-[10px] uppercase tracking-[0.12em] text-white/40">
                <tr>
                  {isDemo ? <th className="px-4 py-2">Type</th> : null}
                  <th className="px-4 py-2">Supplier</th>
                  <th className="px-4 py-2">Description</th>
                  <th className="px-4 py-2 text-right">Amount</th>
                  <th className="px-4 py-2">Due</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">View Journal</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => {
                  const journalId = row.paymentJournalEntryId ?? row.journalEntryId;
                  return (
                    <tr key={row.id} className="border-b border-white/[0.05]">
                      {isDemo ? (
                        <td className="px-4 py-2 text-xs text-white/55">
                          {CATEGORY_LABELS[row.category]}
                        </td>
                      ) : null}
                      <td className="px-4 py-2 text-white">{row.supplier}</td>
                      <td className="px-4 py-2 text-white/70">{row.description || "—"}</td>
                      <td className="px-4 py-2 text-right font-mono text-white/85">
                        {money(row.amount)}
                      </td>
                      <td className="px-4 py-2 text-white/55">{row.dueDate || "—"}</td>
                      <td className="px-4 py-2 text-white/75">{row.paid ? "Paid" : "Open"}</td>
                      <td className="px-4 py-2">
                        {journalId ? (
                          <Link
                            href={`?view=general-ledger&journal=${encodeURIComponent(journalId)}`}
                            className="text-xs font-medium text-sky-300 hover:text-sky-200"
                          >
                            View journal
                          </Link>
                        ) : (
                          <span className="text-xs text-white/35">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
