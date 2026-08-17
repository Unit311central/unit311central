"use client";

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Cpu, HardDrive, KeyRound, Radio, TrendingDown, TrendingUp } from "lucide-react";

import {
  NORTHSTAR_TECH_HARDWARE,
  NORTHSTAR_TECH_TELECOM,
  buildNorthstarTechSpendTrend,
  formatNorthstarTechGbp,
} from "@/lib/demo/northstar-tech-data";
import { cn } from "@/lib/utils";

type NorthstarTechnologyDashboardProps = {
  softwareProducts: number;
  softwareLastMonthGbp: number;
  softwareUpcomingGbp: number;
};

function SpendTile({
  label,
  icon: Icon,
  lastMonth,
  upcoming,
  accent,
  border,
  glow,
}: {
  label: string;
  icon: typeof Cpu;
  lastMonth: number;
  upcoming: number;
  accent: string;
  border: string;
  glow: string;
}) {
  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-gradient-to-br from-[#0b1524] to-[#060d18] p-5 shadow-[0_20px_48px_rgba(0,0,0,0.35)]",
        border,
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full opacity-40 blur-2xl",
          glow,
        )}
      />
      <div className="relative flex items-start gap-3">
        <div className={cn("rounded-xl border border-white/10 bg-white/[0.06] p-2.5", accent)}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">
            {label}
          </p>
          <p className="mt-3 text-xs text-white/50">Last month</p>
          <p className="text-2xl font-semibold tabular-nums text-white">
            {formatNorthstarTechGbp(lastMonth)}
          </p>
          <p className="mt-3 text-xs text-white/50">Upcoming</p>
          <p className="text-lg font-medium tabular-nums text-white/85">
            {formatNorthstarTechGbp(upcoming)}
          </p>
        </div>
      </div>
    </article>
  );
}

export default function NorthstarTechnologyDashboard({
  softwareProducts,
  softwareLastMonthGbp,
  softwareUpcomingGbp,
}: NorthstarTechnologyDashboardProps) {
  const trend = buildNorthstarTechSpendTrend({
    softwareMonthlyGbp: softwareLastMonthGbp,
  });
  const trendUp = trend.changePct >= 0;
  const chartData = trend.labels.map((label, index) => ({
    label,
    spend: trend.values[index] ?? 0,
  }));

  return (
    <div className="mx-auto max-w-6xl space-y-5 pb-4">
      <section className="relative overflow-hidden rounded-2xl border border-white/10 p-5 sm:p-6">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 8% 0%, rgba(99,102,241,0.22), transparent 55%), radial-gradient(ellipse 70% 50% at 92% 20%, rgba(56,189,248,0.16), transparent 50%), linear-gradient(160deg, #0b1628 0%, #121C2D 55%, #0e1a2e 100%)",
          }}
        />
        <div className="relative">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
            Northstar · Technology Management
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">Technology estate</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/65">
            Hardware, software licences, and telecommunications spend — with physical asset counts
            and six-month spend movement.
          </p>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <SpendTile
          label="Tech hardware"
          icon={HardDrive}
          lastMonth={NORTHSTAR_TECH_HARDWARE.lastMonthGbp}
          upcoming={NORTHSTAR_TECH_HARDWARE.upcomingGbp}
          accent="text-indigo-200"
          border="border-indigo-400/30"
          glow="bg-indigo-500/35"
        />
        <SpendTile
          label="Software & licences"
          icon={KeyRound}
          lastMonth={softwareLastMonthGbp}
          upcoming={softwareUpcomingGbp}
          accent="text-sky-200"
          border="border-sky-400/30"
          glow="bg-sky-500/35"
        />
        <SpendTile
          label="Telecoms"
          icon={Radio}
          lastMonth={NORTHSTAR_TECH_TELECOM.lastMonthGbp}
          upcoming={NORTHSTAR_TECH_TELECOM.upcomingGbp}
          accent="text-violet-200"
          border="border-violet-400/30"
          glow="bg-violet-500/35"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <article className="rounded-2xl border border-white/10 bg-[#0b1524]/70 p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">
            Physical tech assets
          </p>
          <p className="mt-3 text-4xl font-semibold tabular-nums text-white">
            {NORTHSTAR_TECH_HARDWARE.physicalAssets}
          </p>
          <p className="mt-2 text-sm text-white/50">
            Laptops, mobiles, monitors, networking, and lab hardware
          </p>
        </article>

        <article className="rounded-2xl border border-white/10 bg-[#0b1524]/70 p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">
            Software products
          </p>
          <p className="mt-3 text-4xl font-semibold tabular-nums text-white">{softwareProducts}</p>
          <p className="mt-2 text-sm text-white/50">Active vendors in the Software & SaaS register</p>
        </article>

        <article className="rounded-2xl border border-white/10 bg-[#0b1524]/70 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">
                Spend trend · 6 months
              </p>
              <p
                className={cn(
                  "mt-2 flex items-center gap-1.5 text-lg font-semibold",
                  trendUp ? "text-amber-200" : "text-emerald-200",
                )}
              >
                {trendUp ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                {trendUp ? "+" : "−"}
                {Math.abs(trend.changePct).toFixed(1)}%
              </p>
              <p className="mt-1 text-xs text-white/45">Combined hardware, software & telecom</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-2 text-indigo-200">
              <Cpu className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 h-28">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="nstTechSpend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#818cf8" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#818cf8" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis hide domain={["dataMin - 2000", "dataMax + 2000"]} />
                <Tooltip
                  contentStyle={{
                    background: "#0b1524",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                  formatter={(value) => [
                    formatNorthstarTechGbp(Number(value ?? 0)),
                    "Spend",
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="spend"
                  stroke="#a5b4fc"
                  strokeWidth={2}
                  fill="url(#nstTechSpend)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>
      </div>
    </div>
  );
}
