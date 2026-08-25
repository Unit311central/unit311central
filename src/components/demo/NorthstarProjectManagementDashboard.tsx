"use client";

import Link from "next/link";
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

import { useInternalOperationsBasePath } from "@/components/testflighthub/InternalOperationsBasePathContext";
import type { InternalProject } from "@/lib/projects-data";
import { getInternalNavHref } from "@/lib/internal-operations-data";

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

function isOnHold(project: InternalProject) {
  return project.notes?.toLowerCase().includes("on hold") ?? false;
}

function summarize(projects: InternalProject[]) {
  const live = projects.filter((p) => p.phase === "live");
  const completed = projects.filter((p) => p.phase === "completed");
  const onHold = projects.filter(isOnHold);
  const atRisk = projects.filter(
    (p) => p.phase === "live" && (p.progressPct < 35 || isOnHold(p)),
  );
  const avgProgress =
    live.length === 0
      ? 0
      : Math.round(live.reduce((sum, p) => sum + p.progressPct, 0) / live.length);

  return { live, completed, onHold, atRisk, avgProgress, total: projects.length };
}

type NorthstarProjectManagementDashboardProps = {
  projects: InternalProject[];
};

export default function NorthstarProjectManagementDashboard({
  projects,
}: NorthstarProjectManagementDashboardProps) {
  const basePath = useInternalOperationsBasePath();
  const internalHref = getInternalNavHref("projects-internal", basePath);
  const externalHref = getInternalNavHref("projects-external", basePath);

  const internalProjects = useMemo(
    () => projects.filter((project) => !project.clientId),
    [projects],
  );
  const externalProjects = useMemo(
    () => projects.filter((project) => Boolean(project.clientId)),
    [projects],
  );

  const internal = useMemo(() => summarize(internalProjects), [internalProjects]);
  const external = useMemo(() => summarize(externalProjects), [externalProjects]);

  const portfolioMix = useMemo(() => {
    const rows = [
      { name: "Internal active", value: internal.live.length, color: PHASE_COLORS.live },
      { name: "External active", value: external.live.length, color: "#38bdf8" },
      { name: "On hold", value: internal.onHold.length + external.onHold.length, color: PHASE_COLORS.onHold },
      { name: "Completed", value: internal.completed.length + external.completed.length, color: PHASE_COLORS.completed },
    ];
    return rows.filter((row) => row.value > 0);
  }, [external, internal]);

  const progressChart = useMemo(
    () =>
      [...internalProjects, ...externalProjects]
        .filter((p) => p.phase === "live")
        .slice(0, 8)
        .map((p) => ({
          name: p.name.length > 22 ? `${p.name.slice(0, 20)}…` : p.name,
          progress: p.progressPct,
        })),
    [externalProjects, internalProjects],
  );

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
      <div className="space-y-3">
        <Link
          href={internalHref}
          className="block rounded-2xl border border-emerald-400/25 bg-gradient-to-br from-emerald-500/15 to-white/[0.03] p-4 transition hover:border-emerald-400/40"
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-200/80">
            Internal
          </p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-white">{internal.total}</p>
          <ul className="mt-3 space-y-1.5 text-xs text-white/55">
            <li>{internal.live.length} active · avg {internal.avgProgress}% progress</li>
            <li>{internal.atRisk.length} at risk · {internal.onHold.length} on hold</li>
            <li>{internal.completed.length} completed</li>
          </ul>
        </Link>

        <Link
          href={externalHref}
          className="block rounded-2xl border border-sky-400/25 bg-gradient-to-br from-sky-500/15 to-white/[0.03] p-4 transition hover:border-sky-400/40"
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-sky-200/80">
            External
          </p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-white">{external.total}</p>
          <ul className="mt-3 space-y-1.5 text-xs text-white/55">
            <li>{external.live.length} active · avg {external.avgProgress}% progress</li>
            <li>{external.atRisk.length} at risk · {external.onHold.length} on hold</li>
            <li>{external.completed.length} completed</li>
          </ul>
        </Link>
      </div>

      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Active projects", value: internal.live.length + external.live.length },
            { label: "At risk", value: internal.atRisk.length + external.atRisk.length },
            { label: "On hold", value: internal.onHold.length + external.onHold.length },
            { label: "Completed", value: internal.completed.length + external.completed.length },
          ].map((tile) => (
            <div
              key={tile.label}
              className="rounded-2xl border border-white/12 bg-white/[0.03] px-4 py-3"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/40">
                {tile.label}
              </p>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-white">{tile.value}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-2xl border border-white/12 bg-white/[0.03] p-4">
            <h2 className="text-sm font-semibold text-white">Portfolio mix</h2>
            <div className="mt-3 h-48">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <PieChart>
                  <Pie data={portfolioMix} dataKey="value" nameKey="name" innerRadius={42} outerRadius={68}>
                    {portfolioMix.map((row) => (
                      <Cell key={row.name} fill={row.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={chartTooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="rounded-2xl border border-white/12 bg-white/[0.03] p-4">
            <h2 className="text-sm font-semibold text-white">Live project progress</h2>
            <div className="mt-3 h-48">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart data={progressChart} layout="vertical" margin={{ left: 8, right: 8 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={92}
                    tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 10 }}
                  />
                  <Tooltip contentStyle={chartTooltipStyle} formatter={(v) => [`${v}%`, "Progress"]} />
                  <Bar dataKey="progress" fill="#38bdf8" radius={[0, 4, 4, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
