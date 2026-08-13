"use client";

import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { SoftwareSaasExecutiveDashboard } from "@/lib/software-billing/build-software-saas-executive-dashboard";
import { formatSaasMoney } from "@/components/testflighthub/software-saas/SoftwareSaasMetricBlocks";
import { cn } from "@/lib/utils";

function SummaryTile({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:p-5", className)}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45">
        {label}
      </p>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function MoneyFigure({ amount, currency }: { amount: number; currency: string }) {
  return (
    <p className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
      {formatSaasMoney(amount, currency)}
    </p>
  );
}

function SignedMoney({ amount, currency }: { amount: number; currency: string }) {
  const positive = amount > 0;
  const negative = amount < 0;
  const prefix = positive ? "+" : "";
  return (
    <p
      className={cn(
        "text-2xl font-semibold tracking-tight sm:text-3xl",
        positive && "text-amber-100",
        negative && "text-emerald-100",
        !positive && !negative && "text-white",
      )}
    >
      {prefix}
      {formatSaasMoney(amount, currency)}
    </p>
  );
}

/**
 * Executive Software & SaaS dashboard — exactly 6 tiles, totals only.
 */
export default function SoftwareSaasExecutiveDashboard({
  dashboard,
  loading,
  error,
}: {
  dashboard: SoftwareSaasExecutiveDashboard | null;
  loading?: boolean;
  error?: string | null;
}) {
  if (loading && !dashboard) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-10 text-sm text-white/50">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading Software &amp; SaaS dashboard…
      </div>
    );
  }

  if (error && !dashboard) {
    return (
      <p className="rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-100">
        {error}
      </p>
    );
  }

  if (!dashboard) return null;

  const { currency } = dashboard;

  return (
    <section className="space-y-4">
      {error ? (
        <p className="rounded-xl border border-amber-400/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          {error}
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryTile label="Last Month">
          <MoneyFigure amount={dashboard.lastMonth} currency={currency} />
        </SummaryTile>
        <SummaryTile label="Upcoming">
          <MoneyFigure amount={dashboard.upcoming} currency={currency} />
        </SummaryTile>
        <SummaryTile label="Spend to Date">
          <MoneyFigure amount={dashboard.spendToDate} currency={currency} />
        </SummaryTile>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <SummaryTile label="Monthly Spend Trend" className="lg:col-span-1 min-h-[14rem]">
          {dashboard.monthlyTrend.length === 0 ? (
            <p className="text-sm text-white/45">No recorded software expenditure yet.</p>
          ) : (
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={dashboard.monthlyTrend}
                  margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                >
                  <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    width={48}
                    tickFormatter={(value: number) =>
                      new Intl.NumberFormat("en-GB", {
                        notation: "compact",
                        maximumFractionDigits: 1,
                      }).format(value)
                    }
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#0b1524",
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                    labelStyle={{ color: "rgba(255,255,255,0.7)" }}
                    formatter={(value) => [
                      formatSaasMoney(Number(value ?? 0), currency),
                      "Spend",
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="#38bdf8"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "#38bdf8", strokeWidth: 0 }}
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </SummaryTile>

        <SummaryTile label="Biggest Increase Last Month">
          {dashboard.biggestIncreaseLastMonth ? (
            <div className="space-y-2">
              <p className="text-base font-medium text-white">
                {dashboard.biggestIncreaseLastMonth.softwareName}
              </p>
              <SignedMoney
                amount={dashboard.biggestIncreaseLastMonth.increase}
                currency={currency}
              />
            </div>
          ) : (
            <p className="text-sm text-white/45">No month-over-month increase last month.</p>
          )}
        </SummaryTile>

        <SummaryTile label="Highest Spend Software">
          {dashboard.highestSpendSoftware ? (
            <div className="space-y-2">
              <p className="text-base font-medium text-white">
                {dashboard.highestSpendSoftware.softwareName}
              </p>
              <MoneyFigure
                amount={dashboard.highestSpendSoftware.amount}
                currency={currency}
              />
            </div>
          ) : (
            <p className="text-sm text-white/45">No software spend recorded last month.</p>
          )}
        </SummaryTile>
      </div>
    </section>
  );
}
