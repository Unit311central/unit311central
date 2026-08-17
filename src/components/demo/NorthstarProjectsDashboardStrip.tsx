"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { InternalProject } from "@/lib/projects-data";

const chartTooltipStyle = {
  background: "#0b1524",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 12,
  fontSize: 12,
  color: "#fff",
} as const;

const PHASE_COLORS = {
  live: "#34d399",
  upcoming: "#38bdf8",
  completed: "#94a3b8",
  onHold: "#fbbf24",
} as const;

type NorthstarProjectsDashboardStripProps = {
  projects: InternalProject[];
  scope: "internal" | "external" | "all";
};

function isOnHold(project: InternalProject) {
  return project.notes?.toLowerCase().includes("on hold") ?? false;
}

export default function NorthstarProjectsDashboardStrip({
  projects,
  scope,
}: NorthstarProjectsDashboardStripProps) {
  const stats = useMemo(() => {
    const live = projects.filter((p) => p.phase === "live");
    const completed = projects.filter((p) => p.phase === "completed");
    const onHold = projects.filter(isOnHold);
    const upcoming = projects.filter((p) => p.phase === "upcoming" && !isOnHold(p));
    const avgProgress =
      live.length === 0
        ? 0
        : Math.round(live.reduce((sum, p) => sum + p.progressPct, 0) / live.length);

    const byYear = new Map<string, number>();
    for (const project of projects) {
      const year = (project.startDate ?? project.createdAt).slice(0, 4);
      byYear.set(year, (byYear.get(year) ?? 0) + 1);
    }
    const yearChart = [...byYear.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([year, count]) => ({ year, count }));

    const phaseChart = [
      { name: "Active", value: live.length, color: PHASE_COLORS.live },
      { name: "On hold", value: onHold.length, color: PHASE_COLORS.onHold },
      { name: "Finished", value: completed.length, color: PHASE_COLORS.completed },
      { name: "Upcoming", value: upcoming.length, color: PHASE_COLORS.upcoming },
    ].filter((row) => row.value > 0);

    return { live, completed, onHold, upcoming, avgProgress, yearChart, phaseChart };
  }, [projects]);

  const scopeLabel =
    scope === "internal" ? "Internal programmes" : scope === "external" ? "Client delivery" : "Portfolio";

  return (
    <div className="space-y-4">
      <header className="rounded-2xl border border-white/12 bg-white/[0.03] p-5 sm:p-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
          Northstar · Projects
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">{scopeLabel}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/55">
          Three-year delivery history — active, finished, and on-hold work across Manchester, Bristol, and Austin.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Active", value: stats.live.length, hint: "In delivery", accent: "from-emerald-500/20 to-emerald-500/5 border-emerald-400/25" },
          { label: "Finished", value: stats.completed.length, hint: "Completed", accent: "from-slate-400/20 to-slate-400/5 border-white/15" },
          { label: "On hold", value: stats.onHold.length, hint: "Paused / awaiting approval", accent: "from-amber-500/20 to-amber-500/5 border-amber-400/25" },
          { label: "Avg progress", value: `${stats.avgProgress}%`, hint: "Active portfolio", accent: "from-sky-500/20 to-sky-500/5 border-sky-400/25" },
        ].map((tile) => (
          <div
            key={tile.label}
            className={`rounded-2xl border bg-gradient-to-br px-4 py-4 ${tile.accent}`}
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">
              {tile.label}
            </p>
            <p className="mt-3 text-2xl font-semibold tabular-nums text-white">{tile.value}</p>
            <p className="mt-1 text-xs text-white/40">{tile.hint}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-white/12 bg-white/[0.03] p-4 sm:p-5">
          <h2 className="text-sm font-semibold text-white">Portfolio mix</h2>
          <p className="mt-1 text-xs text-white/45">By delivery status</p>
          <div className="mt-4 h-52">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <PieChart>
                <Pie
                  data={stats.phaseChart}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={52}
                  outerRadius={78}
                  paddingAngle={2}
                >
                  {stats.phaseChart.map((row) => (
                    <Cell key={row.name} fill={row.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={chartTooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-white/50">
            {stats.phaseChart.map((row) => (
              <span key={row.name} className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: row.color }} />
                {row.name} ({row.value})
              </span>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-white/12 bg-white/[0.03] p-4 sm:p-5">
          <h2 className="text-sm font-semibold text-white">Projects started by year</h2>
          <p className="mt-1 text-xs text-white/45">2023–2026 history</p>
          <div className="mt-4 h-52">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={stats.yearChart} margin={{ top: 8, right: 4, left: -12, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis
                  dataKey="year"
                  tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Bar dataKey="count" name="Projects" fill="#38bdf8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </div>
  );
}
