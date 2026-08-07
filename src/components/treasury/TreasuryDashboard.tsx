"use client";

import { ChartTooltip } from "@/components/dashboard/ChartTooltip";
import TreasuryActivityFeed from "@/components/treasury/TreasuryActivityFeed";
import TreasuryAnimatedCounter from "@/components/treasury/TreasuryAnimatedCounter";
import TreasuryNotificationCenter from "@/components/treasury/TreasuryNotificationCenter";
import {
  formatTreasuryMoney,
  treasuryPanelClassName,
} from "@/components/treasury/treasury-ui";
import type { ReportingCurrency } from "@/lib/financial-reporting-currency";
import {
  convertToTreasuryReporting,
  sumBalancesInReportingCurrency,
} from "@/lib/treasury/treasury-utils";
import type {
  TreasuryActivityItem,
  TreasuryAnalytics,
  TreasurySummary,
  TreasuryView,
} from "@/lib/treasury/treasury-types";
import type { WiseBalance } from "@/lib/wise-service";
import { cn } from "@/lib/utils";
import {
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  Send,
  TrendingUp,
  Wallet,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type TreasuryDashboardProps = {
  summary: TreasurySummary;
  analytics: TreasuryAnalytics;
  activity: TreasuryActivityItem[];
  balances: WiseBalance[];
  onNavigate?: (view: TreasuryView, params?: { balanceId?: number; currency?: string }) => void;
  onSendMoney?: () => void;
  loading?: boolean;
  reportingCurrency?: ReportingCurrency;
  demoMode?: boolean;
};

function SummaryCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon: typeof Wallet;
  tone?: "default" | "incoming" | "outgoing" | "accent";
}) {
  const toneClass =
    tone === "incoming"
      ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-300"
      : tone === "outgoing"
        ? "border-rose-400/25 bg-rose-500/10 text-rose-300"
        : tone === "accent"
          ? "border-sky-400/25 bg-sky-500/10 text-sky-300"
          : "border-white/15 bg-white/[0.04] text-white/70";

  return (
    <article className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/45">
          {label}
        </p>
        <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg border", toneClass)}>
          <Icon className="h-3.5 w-3.5" />
        </div>
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-white">{value}</p>
      {hint ? <p className="mt-2 text-[11px] text-white/35">{hint}</p> : null}
    </article>
  );
}

export default function TreasuryDashboard({
  summary,
  analytics,
  activity,
  balances,
  onNavigate,
  onSendMoney,
  loading = false,
  reportingCurrency = "GBP",
  demoMode = false,
}: TreasuryDashboardProps) {
  const cashFlowMini = analytics.monthlyCashFlow.slice(-6).map((entry) => ({
    label: entry.month.slice(5),
    net: Math.round(
      convertToTreasuryReporting(entry.net, "GBP", reportingCurrency),
    ),
  }));

  const balanceMini = analytics.balanceHistory.slice(-14).map((entry) => ({
    label: entry.date.slice(8),
    total: Math.round(
      convertToTreasuryReporting(entry.GBP, "GBP", reportingCurrency) +
        convertToTreasuryReporting(entry.USD, "USD", reportingCurrency) +
        convertToTreasuryReporting(entry.EUR, "EUR", reportingCurrency),
    ),
  }));

  const totalTreasury = sumBalancesInReportingCurrency(
    balances.map((balance) => ({ currency: balance.currency, amount: balance.amount })),
    reportingCurrency,
  );
  const todayIncoming = convertToTreasuryReporting(
    summary.todayIncoming,
    "GBP",
    reportingCurrency,
  );
  const todayOutgoing = convertToTreasuryReporting(
    summary.todayOutgoing,
    "GBP",
    reportingCurrency,
  );
  const monthVolume = convertToTreasuryReporting(
    summary.monthVolume,
    "GBP",
    reportingCurrency,
  );
  const monthFees = convertToTreasuryReporting(summary.monthFees, "GBP", reportingCurrency);

  return (
    <div className="space-y-4">
      <section className={treasuryPanelClassName()}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-400/30 bg-emerald-500/10">
              <Wallet className="h-5 w-5 text-emerald-300" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-300/90">
                {demoMode ? "Bank · DEMO" : "Wise Treasury"}
              </p>
              <h2 className="mt-0.5 text-lg font-semibold text-white">Dashboard</h2>
              <p className="mt-1 text-sm text-white/55">
                {demoMode
                  ? `Simulated ${reportingCurrency} balances and cash flow.`
                  : "Live balances, cash flow, and recent treasury activity."}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {demoMode ? (
              <span className="rounded-lg border border-amber-400/30 bg-amber-500/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-amber-100">
                DEMO
              </span>
            ) : null}
            <TreasuryNotificationCenter />
            <button
              type="button"
              onClick={onSendMoney}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-emerald-400/30 bg-emerald-500/15 px-4 text-xs font-semibold text-emerald-100 transition-colors hover:bg-emerald-500/25"
            >
              <Send className="h-3.5 w-3.5" />
              Send money
            </button>
          </div>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label={`Total treasury (${reportingCurrency})`}
          icon={TrendingUp}
          tone="accent"
          value={
            <TreasuryAnimatedCounter
              value={totalTreasury}
              formatter={(value) => formatTreasuryMoney(value, reportingCurrency)}
            />
          }
          hint={demoMode ? "Demo balances (not live)" : "Combined Wise balance value"}
        />
        <SummaryCard
          label="Today incoming"
          icon={ArrowDownLeft}
          tone="incoming"
          value={formatTreasuryMoney(todayIncoming, reportingCurrency)}
        />
        <SummaryCard
          label="Today outgoing"
          icon={ArrowUpRight}
          tone="outgoing"
          value={formatTreasuryMoney(todayOutgoing, reportingCurrency)}
        />
        <SummaryCard
          label="Month volume"
          icon={BarChart3}
          value={formatTreasuryMoney(monthVolume, reportingCurrency)}
          hint={`Fees ${formatTreasuryMoney(monthFees, reportingCurrency)}`}
        />
      </div>

      <section className={treasuryPanelClassName()}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-semibold text-white">Balances</h3>
          <button
            type="button"
            onClick={() => onNavigate?.("analytics")}
            className="text-xs font-medium text-sky-300 hover:text-sky-200"
          >
            View analytics
          </button>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {balances.map((balance) => (
            <button
              key={balance.id}
              type="button"
              onClick={() =>
                onNavigate?.("transactions", {
                  balanceId: balance.id,
                  currency: balance.currency,
                })
              }
              className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-left transition-colors hover:border-sky-400/30 hover:bg-sky-500/[0.06]"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-white">
                    {balance.name?.trim() || `${demoMode ? "Demo" : "Wise"} ${balance.currency}`}
                  </p>
                  <p className="mt-0.5 text-[11px] text-white/45">{balance.regionLabel}</p>
                </div>
                <span className="rounded-full border border-white/15 px-2 py-0.5 text-[10px] font-medium text-white/55">
                  {balance.currency}
                </span>
              </div>
              <p className="mt-3 text-2xl font-semibold tabular-nums text-white">
                {formatTreasuryMoney(balance.amount, balance.currency)}
              </p>
              <p className="mt-2 text-[11px] text-white/40">Balance {balance.accountRef}</p>
            </button>
          ))}
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className={treasuryPanelClassName()}>
          <h3 className="text-base font-semibold text-white">Net cash flow</h3>
          <p className="mt-1 text-xs text-white/45">
            Last 6 months ({reportingCurrency} equivalent)
          </p>
          <div className="mt-4 h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashFlowMini}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} />
                <Tooltip content={<ChartTooltip suffix="" />} />
                <Bar dataKey="net" fill="#38bdf8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className={treasuryPanelClassName()}>
          <h3 className="text-base font-semibold text-white">Balance trend</h3>
          <p className="mt-1 text-xs text-white/45">
            Combined {reportingCurrency} value (14 days)
          </p>
          <div className="mt-4 h-44">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={balanceMini}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} />
                <Tooltip content={<ChartTooltip suffix="" />} />
                <Line type="monotone" dataKey="total" stroke="#34d399" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <TreasuryActivityFeed items={activity} limit={5} compact loading={loading} />
    </div>
  );
}
