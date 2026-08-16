"use client";

import { useCallback, useEffect, useMemo, useState, startTransition } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowDownRight,
  ArrowUpRight,
  Loader2,
  Minus,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { formatReportingMoney, roundReportingPercent } from "@/lib/financial-reporting-currency";
import type { FinancialOverviewSnapshot } from "@/lib/accounting/types";
import { isBrowserOnwardAirSurface } from "@/lib/onwardair-surface";
import { useWorkspaceReportingCurrency } from "@/lib/workspace-reporting-currency";
import DashboardTopTilesBar from "@/components/testflighthub/DashboardTopTilesBar";
import BurnRateOverviewSection from "@/components/testflighthub/BurnRateOverviewSection";
import {
  DEFAULT_FINANCIALS_TILE_LAYOUT,
  buildFinancialsDashboardCatalog,
} from "@/lib/view-dashboard-tile-catalogs";
import { cn } from "@/lib/utils";

const TOOLTIP_STYLE = {
  background: "#0b1524",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 12,
  fontSize: 12,
  color: "#fff",
} as const;

const PIE_COLORS = ["#34d399", "#38bdf8", "#fbbf24", "#fb7185", "#a78bfa", "#2dd4bf"];

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-white/10 text-sm text-white/40">
      No {label} data yet
    </div>
  );
}

function seriesDelta(series: Array<{ amount: number }> | undefined) {
  if (!series || series.length < 2) return null;
  const curr = series[series.length - 1]!.amount;
  const prev = series[series.length - 2]!.amount;
  const abs = curr - prev;
  if (prev === 0) {
    return { abs, pct: curr === 0 ? 0 : 100, up: abs >= 0 };
  }
  const rawPct = (abs / Math.abs(prev)) * 100;
  return { abs, pct: roundReportingPercent(rawPct), up: abs >= 0 };
}

function formatCompact(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat(currency === "AUD" ? "en-AU" : currency === "USD" ? "en-US" : "en-GB", {
      style: "currency",
      currency,
      notation: "compact",
      maximumFractionDigits: 0,
    }).format(Math.ceil(amount));
  } catch {
    return formatReportingMoney(amount, currency);
  }
}

function DeltaBadge({
  delta,
  invert = false,
  suffix = "MoM",
}: {
  delta: { abs: number; pct: number; up: boolean } | null;
  /** When true, up is bad (e.g. burn / expenses). */
  invert?: boolean;
  suffix?: string;
}) {
  if (!delta) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[11px] font-medium text-white/45">
        <Minus className="h-3 w-3" />
        —
      </span>
    );
  }
  const good = invert ? !delta.up : delta.up;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold",
        good
          ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
          : "border-rose-400/30 bg-rose-500/10 text-rose-200",
      )}
    >
      {delta.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
      {delta.pct > 0 ? "+" : ""}
      {delta.pct}% {suffix}
    </span>
  );
}

function MiniSpark({
  data,
  color,
  invertFill = false,
}: {
  data: Array<{ amount: number }>;
  color: string;
  invertFill?: boolean;
}) {
  if (data.length < 2) return null;
  const chartData = data.map((row, index) => ({ i: index, amount: row.amount }));
  return (
    <div className="mt-3 h-12 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`spark-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={invertFill ? 0.08 : 0.45} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="amount"
            stroke={color}
            strokeWidth={2}
            fill={`url(#spark-${color.replace("#", "")})`}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function HeroKpi({
  label,
  value,
  hint,
  delta,
  invertDelta,
  deltaSuffix,
  spark,
  sparkColor,
  icon,
}: {
  label: string;
  value: string;
  hint?: string;
  delta: { abs: number; pct: number; up: boolean } | null;
  invertDelta?: boolean;
  deltaSuffix?: string;
  spark: Array<{ amount: number }>;
  sparkColor: string;
  icon: React.ReactNode;
}) {
  return (
    <article className="relative overflow-hidden rounded-2xl border border-white/12 bg-gradient-to-br from-white/[0.07] to-white/[0.02] p-4 shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-sky-400/10 blur-2xl" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-[1.7rem]">{value}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-2 text-sky-200">{icon}</div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <DeltaBadge delta={delta} invert={invertDelta} suffix={deltaSuffix} />
        {hint ? <span className="text-[11px] text-white/35">{hint}</span> : null}
      </div>
      <MiniSpark data={spark} color={sparkColor} />
    </article>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-white/12 bg-[#0a1422]/85 p-5 shadow-[0_16px_48px_rgba(0,0,0,0.35)]",
        className,
      )}
    >
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        {subtitle ? <p className="mt-1 text-xs text-white/45">{subtitle}</p> : null}
      </div>
      {children}
    </section>
  );
}

export default function FinancialsWorkspace() {
  const [overview, setOverview] = useState<FinancialOverviewSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [burnDrillOpen, setBurnDrillOpen] = useState(false);

  const reportingCurrency = useWorkspaceReportingCurrency(overview?.burnRate?.currency);
  const money = (amount: number, currency?: string) =>
    formatReportingMoney(amount, currency ?? reportingCurrency);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20_000);
    try {
      if (typeof window !== "undefined") {
        try {
          const { isNorthstarDemoBrowser, buildNorthstarFinancialOverview } =
            require("@/lib/demo/module-fixtures") as typeof import("@/lib/demo/module-fixtures");
          if (isNorthstarDemoBrowser()) {
            setOverview(buildNorthstarFinancialOverview());
            setLoading(false);
            return;
          }
        } catch {
          /* optional */
        }
      }

      const response = await fetch("/api/financials/ledger/overview", {
        cache: "no-store",
        signal: controller.signal,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Failed to load overview");
      setOverview(data.overview);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.name === "AbortError"
            ? "Financial overview timed out — refresh to retry."
            : loadError.message
          : "Failed to load overview",
      );
    } finally {
      clearTimeout(timer);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    startTransition(() => {
      void load();
    });
  }, [load]);

  const tiles = useMemo(() => buildFinancialsDashboardCatalog(overview), [overview]);

  const cashDelta = useMemo(
    () => seriesDelta(overview?.charts.cashPosition),
    [overview?.charts.cashPosition],
  );
  const revenueDelta = useMemo(
    () => seriesDelta(overview?.charts.monthlyRevenue),
    [overview?.charts.monthlyRevenue],
  );
  const expenseDelta = useMemo(
    () => seriesDelta(overview?.charts.monthlyOutgoings),
    [overview?.charts.monthlyOutgoings],
  );

  const balanceMix = useMemo(() => {
    if (!overview) return [];
    return [
      { name: "Cash", value: Math.max(0, overview.cashPosition) },
      { name: "Receivable", value: Math.max(0, overview.accountsReceivable) },
      { name: "Payable", value: Math.max(0, overview.accountsPayable) },
    ].filter((row) => row.value > 0);
  }, [overview]);

  const arAgeingPie = useMemo(() => {
    if (!overview) return [];
    return overview.ar.ageing
      .filter((bucket) => bucket.amount > 0)
      .map((bucket) => ({ name: bucket.bucket, value: bucket.amount }));
  }, [overview]);

  const revenueVsSpend = useMemo(() => {
    if (!overview) return [];
    const months = new Map<string, { month: string; revenue: number; spend: number }>();
    for (const row of overview.charts.monthlyRevenue) {
      months.set(row.month, { month: row.month.slice(5), revenue: row.amount, spend: 0 });
    }
    for (const row of overview.charts.monthlyOutgoings) {
      const existing = months.get(row.month) ?? {
        month: row.month.slice(5),
        revenue: 0,
        spend: 0,
      };
      existing.spend = row.amount;
      months.set(row.month, existing);
    }
    return Array.from(months.values());
  }, [overview]);

  const marginPct = useMemo(() => {
    if (!overview || overview.revenueYtd <= 0) return 0;
    const base =
      overview.annualExpenses > 0 ? overview.annualExpenses : overview.monthlyExpenses;
    return Math.round(((overview.revenueYtd - base) / overview.revenueYtd) * 100);
  }, [overview]);

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-2xl border border-white/12 bg-gradient-to-br from-[#0c1a2e] via-[#0a1422] to-[#08101c] p-5 shadow-[0_24px_64px_rgba(0,0,0,0.45)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-300/90">
              Financial pulse
            </p>
            <h2 className="mt-1 text-xl font-semibold text-white">Live performance snapshot</h2>
            <p className="mt-1 max-w-xl text-sm text-white/50">
              Cash, revenue, receivables and burn with month-on-month movement from the shared GL /
              AR / AP feed.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.04] px-3 text-xs font-semibold text-white/80 transition hover:border-white/25 hover:bg-white/[0.07]"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            Refresh
          </button>
        </div>

        {error ? (
          <p className="mt-4 rounded-xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </p>
        ) : null}
        {loading && !overview ? (
          <div className="mt-6 flex items-center gap-2 text-sm text-white/55">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading financial overview…
          </div>
        ) : null}

        {overview ? (
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <HeroKpi
              label="Cash position"
              value={money(overview.cashPosition)}
              hint={cashDelta ? `${formatCompact(Math.abs(cashDelta.abs), reportingCurrency)} vs prior` : undefined}
              delta={cashDelta}
              spark={overview.charts.cashPosition}
              sparkColor="#34d399"
              icon={<Wallet className="h-4 w-4" />}
            />
            <HeroKpi
              label="Revenue YTD"
              value={money(overview.revenueYtd)}
              hint={`This month ${money(overview.monthlyRevenue)}`}
              delta={revenueDelta}
              spark={overview.charts.monthlyRevenue}
              sparkColor="#38bdf8"
              icon={<TrendingUp className="h-4 w-4" />}
            />
            <HeroKpi
              label="Accounts receivable"
              value={money(overview.accountsReceivable)}
              hint={`${overview.ar.overdueCount} invoices overdue · ${Math.round(overview.ar.collectionRate)}% collected`}
              delta={
                overview.ar.outstanding > 0
                  ? {
                      abs: overview.ar.overdue,
                      pct: roundReportingPercent(
                        (overview.ar.overdue / overview.ar.outstanding) * 100,
                      ),
                      up: true,
                    }
                  : null
              }
              invertDelta
              deltaSuffix="overdue"
              spark={overview.ar.ageing.map((b) => ({ amount: b.amount }))}
              sparkColor="#fbbf24"
              icon={<ArrowDownRight className="h-4 w-4" />}
            />
            <HeroKpi
              label="Monthly burn"
              value={`${money(overview.burnRate.monthly)} / mo`}
              hint={overview.burnRate.trendLabel}
              delta={
                overview.burnRate
                  ? {
                      abs: overview.burnRate.changePct,
                      pct: roundReportingPercent(overview.burnRate.changePct),
                      up: overview.burnRate.trend === "increasing",
                    }
                  : expenseDelta
              }
              invertDelta
              spark={overview.charts.monthlyOutgoings}
              sparkColor="#fb7185"
              icon={<TrendingDown className="h-4 w-4" />}
            />
          </div>
        ) : null}
      </section>

      {overview ? (
        <div className="grid gap-4 xl:grid-cols-3">
          <ChartCard
            title="Liquidity mix"
            subtitle="Cash vs receivables vs payables"
            className="xl:col-span-1"
          >
            <div className="h-56">
              {balanceMix.length === 0 ? (
                <EmptyChart label="liquidity" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={balanceMix}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={52}
                      outerRadius={78}
                      paddingAngle={3}
                      stroke="rgba(8,16,28,0.9)"
                      strokeWidth={2}
                    >
                      {balanceMix.map((entry, index) => (
                        <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      formatter={(value) => [
                        money(typeof value === "number" ? value : Number(value) || 0),
                        "Amount",
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <ul className="mt-1 space-y-1.5">
              {balanceMix.map((row, index) => (
                <li key={row.name} className="flex items-center justify-between text-xs text-white/70">
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: PIE_COLORS[index % PIE_COLORS.length] }}
                    />
                    {row.name}
                  </span>
                  <span className="tabular-nums text-white">{formatCompact(row.value, reportingCurrency)}</span>
                </li>
              ))}
            </ul>
          </ChartCard>

          <ChartCard
            title="AR ageing"
            subtitle="Outstanding invoices by age bucket"
            className="xl:col-span-1"
          >
            <div className="h-56">
              {arAgeingPie.length === 0 ? (
                <EmptyChart label="ageing" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={arAgeingPie}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={48}
                      outerRadius={76}
                      paddingAngle={2}
                      stroke="rgba(8,16,28,0.9)"
                      strokeWidth={2}
                    >
                      {arAgeingPie.map((entry, index) => (
                        <Cell key={entry.name} fill={PIE_COLORS[(index + 1) % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      formatter={(value) => [
                        money(typeof value === "number" ? value : Number(value) || 0),
                        "Outstanding",
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                <p className="text-white/40">Outstanding</p>
                <p className="mt-0.5 font-semibold tabular-nums text-white">
                  {formatCompact(overview.ar.outstanding, reportingCurrency)}
                </p>
              </div>
              <div className="rounded-xl border border-rose-400/20 bg-rose-500/10 px-3 py-2">
                <p className="text-rose-100/60">Overdue</p>
                <p className="mt-0.5 font-semibold tabular-nums text-rose-100">
                  {formatCompact(overview.ar.overdue, reportingCurrency)}
                </p>
              </div>
            </div>
          </ChartCard>

          <ChartCard
            title="Margin & profit"
            subtitle="YTD income against cost pace"
            className="xl:col-span-1"
          >
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.12em] text-white/40">Gross margin</p>
                <p className="mt-1 text-4xl font-semibold text-emerald-300">{marginPct}%</p>
                <p className="mt-2 text-xs text-white/45">
                  Net profit {money(overview.netProfit)}
                </p>
              </div>
              <DeltaBadge delta={revenueDelta} suffix="rev MoM" />
            </div>
            <div className="mt-5 h-36">
              {overview.charts.monthlyProfitLoss.length === 0 ? (
                <EmptyChart label="profit" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={overview.charts.monthlyProfitLoss}>
                    <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis
                      dataKey="month"
                      tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }}
                      tickFormatter={(v) => String(v).slice(5)}
                    />
                    <YAxis hide />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Bar dataKey="profit" fill="#34d399" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="loss" fill="#fb7185" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </ChartCard>
        </div>
      ) : null}

      {overview ? (
        <ChartCard
          title="Revenue vs outgoings"
          subtitle="Monthly income against operating spend"
        >
          <div className="h-72">
            {revenueVsSpend.length === 0 ? (
              <EmptyChart label="revenue vs spend" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueVsSpend}>
                  <defs>
                    <linearGradient id="fin-rev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="#38bdf8" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="fin-spend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#fb7185" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#fb7185" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }} />
                  <YAxis
                    tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }}
                    tickFormatter={(v) => formatCompact(Number(v), reportingCurrency)}
                    width={56}
                  />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    formatter={(value) =>
                      money(typeof value === "number" ? value : Number(value) || 0)
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name="Revenue"
                    stroke="#38bdf8"
                    strokeWidth={2.5}
                    fill="url(#fin-rev)"
                  />
                  <Area
                    type="monotone"
                    dataKey="spend"
                    name="Outgoings"
                    stroke="#fb7185"
                    strokeWidth={2}
                    fill="url(#fin-spend)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </ChartCard>
      ) : null}

      <DashboardTopTilesBar
        storageKey={
          isBrowserOnwardAirSurface()
            ? "oa-financials-dashboard-tiles-v4"
            : "unit311-financials-dashboard-tiles-v3"
        }
        catalog={tiles}
        defaultLayout={DEFAULT_FINANCIALS_TILE_LAYOUT}
        title="Key metrics"
        showCustomizeHint
        onTileClick={(tileId) => {
          if (tileId === "burn-rate") setBurnDrillOpen(true);
        }}
      />

      {overview?.burnRate ? (
        <BurnRateOverviewSection
          burnRate={overview.burnRate}
          drillOpen={burnDrillOpen}
          onDrillOpenChange={setBurnDrillOpen}
        />
      ) : null}

      {overview ? (
        <>
          <div className="grid gap-4 xl:grid-cols-3">
            <ChartCard title="Accounts Receivable" subtitle="Collections and open invoices">
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-white/50">Outstanding</dt>
                  <dd className="tabular-nums text-white">{money(overview.ar.outstanding)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-white/50">Overdue</dt>
                  <dd className="tabular-nums text-rose-200">{money(overview.ar.overdue)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-white/50">Due soon</dt>
                  <dd className="tabular-nums text-white">{money(overview.ar.dueSoon)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-white/50">Collection rate</dt>
                  <dd className="tabular-nums text-emerald-200">
                    {Math.round(overview.ar.collectionRate)}%
                  </dd>
                </div>
              </dl>
              <div className="mt-4 h-40">
                {overview.ar.ageing.every((bucket) => bucket.amount === 0) ? (
                  <EmptyChart label="ageing" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={overview.ar.ageing}>
                      <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                      <XAxis dataKey="bucket" tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 10 }} />
                      <YAxis tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }} width={40} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Bar dataKey="amount" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </ChartCard>

            <ChartCard title="Accounts Payable" subtitle="Supplier obligations">
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-white/50">Outstanding</dt>
                  <dd className="tabular-nums text-white">{money(overview.ap.outstanding)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-white/50">Due this month</dt>
                  <dd className="tabular-nums text-amber-200">{money(overview.ap.dueThisMonth)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-white/50">Overdue</dt>
                  <dd className="tabular-nums text-rose-200">{money(overview.ap.overdue)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-white/50">Upcoming</dt>
                  <dd className="tabular-nums text-white">{money(overview.ap.upcoming)}</dd>
                </div>
              </dl>
              <div className="mt-4 space-y-2">
                {overview.ap.recent.slice(0, 5).map((row) => (
                  <div
                    key={row.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-white/8 bg-white/[0.02] px-2.5 py-2 text-xs text-white/70"
                  >
                    <span className="truncate">{row.supplier}</span>
                    <span className="shrink-0 tabular-nums text-white">
                      {money(row.amount, row.currency)}
                    </span>
                  </div>
                ))}
              </div>
            </ChartCard>

            <ChartCard title="Payroll" subtitle="Headcount cost run-rate">
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-white/50">Monthly payroll</dt>
                  <dd className="tabular-nums text-white">{money(overview.payroll.monthly)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-white/50">Employees</dt>
                  <dd className="tabular-nums text-white">{overview.payroll.employees}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-white/50">Annual payroll</dt>
                  <dd className="tabular-nums text-white">{money(overview.payroll.annual)}</dd>
                </div>
              </dl>
              <div className="mt-4 h-40">
                {(overview.payroll.trend?.length ?? 0) === 0 &&
                overview.charts.monthlyOutgoings.length === 0 ? (
                  <EmptyChart label="payroll trend" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={
                        overview.payroll.trend?.length
                          ? overview.payroll.trend
                          : overview.charts.monthlyOutgoings
                      }
                    >
                      <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                      <XAxis
                        dataKey="month"
                        tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 10 }}
                        tickFormatter={(v) => String(v).slice(5)}
                      />
                      <YAxis hide />
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Line
                        type="monotone"
                        dataKey="amount"
                        stroke="#a78bfa"
                        strokeWidth={2.5}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </ChartCard>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {(
              [
                ["cash", "Cash trajectory", overview.charts.cashPosition, "#34d399"],
                ["revenue", "Monthly revenue", overview.charts.monthlyRevenue, "#38bdf8"],
              ] as const
            ).map(([id, title, data, color]) => (
              <ChartCard key={id} title={title}>
                <div className="h-52">
                  {data.length === 0 ? (
                    <EmptyChart label={title.toLowerCase()} />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data}>
                        <defs>
                          <linearGradient id={`area-${id}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={color} stopOpacity={0.4} />
                            <stop offset="100%" stopColor={color} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                        <XAxis
                          dataKey="month"
                          tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 10 }}
                          tickFormatter={(v) => String(v).slice(5)}
                        />
                        <YAxis
                          tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }}
                          tickFormatter={(v) => formatCompact(Number(v), reportingCurrency)}
                          width={52}
                        />
                        <Tooltip
                          contentStyle={TOOLTIP_STYLE}
                          formatter={(value) =>
                            money(typeof value === "number" ? value : Number(value) || 0)
                          }
                        />
                        <Area
                          type="monotone"
                          dataKey="amount"
                          stroke={color}
                          strokeWidth={2.5}
                          fill={`url(#area-${id})`}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </ChartCard>
            ))}
          </div>

          <ChartCard title="Recent financial activity">
            {overview.activity.length === 0 ? (
              <p className="text-sm text-white/45">No activity yet.</p>
            ) : (
              <ul className="divide-y divide-white/[0.06]">
                {overview.activity.slice(0, 8).map((item) => (
                  <li key={item.id} className="flex items-start justify-between gap-3 py-3 text-sm">
                    <div>
                      <p className="font-medium text-white">{item.label}</p>
                      <p className="text-white/55">{item.description}</p>
                    </div>
                    <p className="shrink-0 text-xs text-white/40">
                      {new Date(item.at).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </ChartCard>
        </>
      ) : null}
    </div>
  );
}
