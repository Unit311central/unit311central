"use client";

import { useCallback, useEffect, useMemo, useState, startTransition } from "react";
import Link from "next/link";
import { Loader2, RefreshCw } from "lucide-react";

import {
  CustomerFinancePlanningPanel,
  useCustomerBudgetForecastBaseline,
} from "@/components/testflighthub/CustomerFinancePlanningPanel";
import { formatReportingMoney } from "@/lib/financial-reporting-currency";
import { isBrowserCustomerWorkspaceSurface } from "@/lib/customer-workspace-surface";
import type { FinancialOverviewSnapshot } from "@/lib/accounting/types";
import { useWorkspaceReportingCurrency } from "@/lib/workspace-reporting-currency";
import { cn } from "@/lib/utils";

export type FinancesPlanningView =
  | "finances-planning-budget"
  | "finances-planning-actual-vs-budget"
  | "finances-planning-cash-flow"
  | "finances-planning-forecast"
  | "finances-planning-kpis"
  | "finances-planning-management-accounts";

const SECTION_META: Record<
  FinancesPlanningView,
  { title: string; area: string; description: string }
> = {
  "finances-planning-budget": {
    area: "Planning & Management",
    title: "Budget",
    description: "Departmental envelopes and approved budget baselines for the workspace.",
  },
  "finances-planning-actual-vs-budget": {
    area: "Planning & Management",
    title: "Actual vs Budget",
    description: "Variance between actual operating spend and budget / forecast baselines.",
  },
  "finances-planning-cash-flow": {
    area: "Planning & Management",
    title: "Cash Flow",
    description: "Rolling cash movement from revenue, payables, and treasury activity.",
  },
  "finances-planning-forecast": {
    area: "Planning & Management",
    title: "Forecast",
    description: "Forward-looking burn and runway based on recent operating trends.",
  },
  "finances-planning-kpis": {
    area: "Planning & Management",
    title: "KPIs",
    description: "Executive finance indicators for revenue, cash, receivables, and payables.",
  },
  "finances-planning-management-accounts": {
    area: "Planning & Management",
    title: "Management Accounts",
    description: "Management P&L snapshot and monthly movement for leadership review.",
  },
};

type Props = {
  view: FinancesPlanningView;
};

export default function FinancesPlanningWorkspace({ view }: Props) {
  const meta = SECTION_META[view as keyof typeof SECTION_META];
  const currency = useWorkspaceReportingCurrency();
  const [overview, setOverview] = useState<FinancialOverviewSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/financials/ledger/overview", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Failed to load financial overview");
      setOverview(data.overview ?? null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load overview");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    startTransition(() => {
      void load();
    });
  }, [load]);

  const money = (amount: number) => formatReportingMoney(amount, currency);

  const budgetSeries = useMemo(
    () => overview?.burnRate.series ?? [],
    [overview?.burnRate.series],
  );

  const latestBudgetMonth = budgetSeries[budgetSeries.length - 1];
  const { budgetTarget, forecastTarget } = useCustomerBudgetForecastBaseline();
  const isCustomer = isBrowserCustomerWorkspaceSurface();
  const forecastBaseline =
    forecastTarget ?? overview?.burnRate.forecastMonthly ?? 0;
  const budgetBaseline = budgetTarget ?? forecastBaseline;

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-300/90">
          Finances · {meta?.area ?? "Planning"}
        </p>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">{meta?.title ?? "Planning"}</h2>
            <p className="mt-1 text-sm text-white/55">{meta?.description}</p>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-white/15 px-3 text-xs font-semibold text-white/80"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            Refresh
          </button>
        </div>
      </section>

      {error ? (
        <p className="rounded-xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </p>
      ) : null}

      {loading && !overview ? (
        <div className="flex items-center gap-2 text-sm text-white/55">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading planning data…
        </div>
      ) : null}

      {overview && view === "finances-planning-budget" ? (
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {budgetSeries.slice(-3).map((row) => (
            <div
              key={row.month}
              className="rounded-xl border border-white/10 bg-[#0b1524]/70 px-4 py-3"
            >
              <p className="text-[10px] uppercase tracking-[0.12em] text-white/45">{row.month}</p>
              <p className="mt-1 text-lg font-semibold text-white">{money(row.total)}</p>
              <p className="mt-1 text-xs text-white/45">
                Payroll {money(row.payroll)} · Software {money(row.software)}
              </p>
            </div>
          ))}
        </section>
      ) : null}

      {overview && view === "finances-planning-actual-vs-budget" ? (
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <Metric label="Actual (monthly)" value={money(overview.burnRate.monthly)} />
            <Metric label="Forecast" value={money(budgetBaseline)} />
            <Metric
              label="Variance"
              value={money(overview.burnRate.monthly - budgetBaseline)}
            />
          </div>
          <CustomerFinancePlanningPanel mode="budget" />
        </section>
      ) : null}

      {overview && view === "finances-planning-cash-flow" ? (
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            {(overview.charts.cashPosition ?? []).slice(-6).map((row) => (
              <div
                key={row.month}
                className="rounded-xl border border-white/10 bg-[#0b1524]/70 px-4 py-3"
              >
                <p className="text-[10px] uppercase tracking-[0.12em] text-white/45">{row.month}</p>
                <p className="mt-1 text-lg font-semibold text-white">{money(row.amount)}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {overview && view === "finances-planning-forecast" ? (
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Forecast burn" value={money(forecastBaseline)} />
          <Metric label="Cash balance" value={money(overview.burnRate.cashBalance)} />
          <Metric
            label="Runway (months)"
            value={
              overview.burnRate.runwayMonths != null
                ? String(Math.ceil(overview.burnRate.runwayMonths))
                : "—"
            }
          />
          <Metric label="Trend" value={overview.burnRate.trendLabel} />
        </section>
      ) : null}

      {overview && view === "finances-planning-forecast" ? (
        <CustomerFinancePlanningPanel mode="forecast" />
      ) : null}

      {overview && view === "finances-planning-kpis" ? (
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Revenue YTD" value={money(overview.revenueYtd)} />
          <Metric label="Cash position" value={money(overview.cashPosition)} />
          <Metric label="Accounts receivable" value={money(overview.accountsReceivable)} />
          <Metric label="Accounts payable" value={money(overview.accountsPayable)} />
        </section>
      ) : null}

      {overview && view === "finances-planning-kpis" ? (
        <CustomerFinancePlanningPanel mode="kpis" />
      ) : null}

      {overview && view === "finances-planning-management-accounts" ? (
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Metric label="Monthly revenue" value={money(overview.monthlyRevenue)} />
            <Metric label="Monthly expenses" value={money(overview.monthlyExpenses)} />
            <Metric label="Net profit" value={money(overview.netProfit)} />
            <Metric label="Outstanding invoices" value={money(overview.outstandingInvoices)} />
          </div>
          <p className="text-sm text-white/50">
            {isCustomer
              ? "Management accounts reflect live expenses and revenue for this workspace."
              : (
                  <>
                    Published statutory packs remain under{" "}
                    <Link href="?view=financial-reports" className="text-sky-300 hover:text-sky-200">
                      Financial Reports
                    </Link>
                    .
                  </>
                )}
          </p>
        </section>
      ) : null}

      {overview && view === "finances-planning-budget" ? (
        <CustomerFinancePlanningPanel mode="budget" />
      ) : null}

      {overview && latestBudgetMonth && view === "finances-planning-budget" ? (
        <p className="text-xs text-white/40">
          Latest month envelope: {latestBudgetMonth.month} — total operating budget{" "}
          {money(latestBudgetMonth.total)}.
        </p>
      ) : null}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#0b1524]/70 px-4 py-3">
      <p className="text-[10px] uppercase tracking-[0.12em] text-white/45">{label}</p>
      <p className="mt-1 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}
