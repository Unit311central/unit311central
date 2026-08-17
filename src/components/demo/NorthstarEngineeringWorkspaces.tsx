"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Milestone,
  Target,
  Users,
} from "lucide-react";
import {
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

import { useInternalOperationsBasePath } from "@/components/testflighthub/InternalOperationsBasePathContext";
import {
  TqmsKpiTile,
  TqmsSection,
  TqmsStatusPill,
} from "@/components/testflighthub/tqms-ui";
import {
  formatNorthstarEngGbp,
  getNorthstarEngineeringSummary,
  NORTHSTAR_ENGINEERING_MILESTONES,
  NORTHSTAR_ENGINEERING_PROGRAMS,
  NORTHSTAR_ENGINEERING_RISKS,
  NORTHSTAR_ENGINEERING_TEAM,
} from "@/lib/demo/engineering-data";
import { getInternalNavHref, type InternalOperationsView } from "@/lib/internal-operations-data";
import { cn } from "@/lib/utils";

const chartTooltipStyle = {
  background: "#0b1524",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 12,
  fontSize: 12,
  color: "#fff",
} as const;

const PIE_COLORS = ["#2dd4bf", "#38bdf8", "#34d399", "#fbbf24", "#f472b6", "#94a3b8"];

const VELOCITY_TREND = [
  { month: "Mar", points: 42 },
  { month: "Apr", points: 48 },
  { month: "May", points: 45 },
  { month: "Jun", points: 52 },
  { month: "Jul", points: 58 },
  { month: "Aug", points: 54 },
];

const BUDGET_BURN = [
  { month: "Mar", spent: 180 },
  { month: "Apr", spent: 210 },
  { month: "May", spent: 245 },
  { month: "Jun", spent: 278 },
  { month: "Jul", spent: 312 },
  { month: "Aug", spent: 338 },
];

const LIKELIHOOD_LEVELS = ["low", "medium", "high"] as const;
const SEVERITY_LEVELS = ["low", "medium", "high", "critical"] as const;

function riskMatrixCellClass(count: number): string {
  if (count >= 2) return "bg-rose-500/75 text-rose-50";
  if (count === 1) return "bg-amber-500/65 text-amber-50";
  return "bg-white/8 text-white/35";
}

function ragClass(status: string) {
  const s = status.toLowerCase();
  if (s.includes("on_track") || s.includes("done") || s.includes("complete") || s === "green") {
    return "border-emerald-400/30 bg-emerald-500/15 text-emerald-100";
  }
  if (
    s.includes("at_risk") ||
    s.includes("delayed") ||
    s.includes("blocked") ||
    s.includes("amber") ||
    s.includes("high")
  ) {
    return "border-amber-400/30 bg-amber-500/15 text-amber-100";
  }
  if (s.includes("critical") || s.includes("red")) {
    return "border-rose-400/30 bg-rose-500/15 text-rose-100";
  }
  if (s.includes("mitigating") || s.includes("in_progress")) {
    return "border-sky-400/30 bg-sky-500/15 text-sky-100";
  }
  return "border-white/15 bg-white/5 text-white/70";
}

function labelStatus(value: string) {
  return value.replace(/_/g, " ");
}

function Shell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-6xl space-y-5 px-1 py-4 sm:py-6">
      <header className="rounded-2xl border border-white/12 bg-white/[0.03] p-5 sm:p-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
          Northstar · Engineering
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/55">{subtitle}</p>
      </header>
      {children}
    </div>
  );
}


export function NorthstarEngineeringDashboardWorkspace() {
  const basePath = useInternalOperationsBasePath();
  const summary = getNorthstarEngineeringSummary();
  const href = (view: InternalOperationsView) => getInternalNavHref(view, basePath);

  const tiles = [
    {
      label: "Active programmes",
      value: String(summary.programsActive),
      hint: `${summary.programsAtRisk} at risk / delayed`,
      view: "engineering-programs" as const,
      icon: Target,
    },
    {
      label: "Milestones (90d)",
      value: String(summary.milestonesDue30d),
      hint: `${summary.milestonesAtRisk} blocked / at risk`,
      view: "engineering-programs" as const,
      icon: Milestone,
    },
    {
      label: "Team utilisation",
      value: `${summary.avgUtilizationPct}%`,
      hint: `${summary.teamHeadcount} engineers · UK & US`,
      view: "engineering-capacity" as const,
      icon: Users,
    },
    {
      label: "Open risks",
      value: String(summary.risksOpen),
      hint: `${summary.risksCriticalOrHigh} critical / high`,
      view: "engineering-risks" as const,
      icon: AlertTriangle,
    },
  ];

  const ragBars = [
    {
      rag: "On track",
      count: NORTHSTAR_ENGINEERING_PROGRAMS.filter((p) => p.status === "on_track").length,
    },
    {
      rag: "At risk",
      count: NORTHSTAR_ENGINEERING_PROGRAMS.filter((p) => p.status === "at_risk").length,
    },
    {
      rag: "Delayed",
      count: NORTHSTAR_ENGINEERING_PROGRAMS.filter((p) => p.status === "delayed").length,
    },
  ];

  const disciplineLoad = Object.entries(
    NORTHSTAR_ENGINEERING_TEAM.reduce<Record<string, number>>((acc, member) => {
      acc[member.discipline] = (acc[member.discipline] ?? 0) + member.bookedHrsWeek;
      return acc;
    }, {}),
  ).map(([name, value]) => ({ name, value }));

  const upcoming = NORTHSTAR_ENGINEERING_MILESTONES.filter((m) => m.status !== "done")
    .slice()
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 5);

  const topRisks = NORTHSTAR_ENGINEERING_RISKS.filter(
    (r) => r.status === "open" || r.status === "mitigating",
  )
    .slice()
    .sort((a, b) => {
      const rank = { critical: 0, high: 1, medium: 2, low: 3 };
      return rank[a.severity] - rank[b.severity];
    })
    .slice(0, 4);

  return (
    <Shell
      title="Dashboard"
      subtitle="Programme health, delivery milestones, team load, and engineering risks across Northstar Industrial Technologies."
    >
      <div className="rounded-2xl border border-teal-400/25 bg-teal-500/10 px-4 py-3 sm:px-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-200/80">
          Next delivery gate
        </p>
        <p className="mt-1 text-sm font-semibold text-white">
          {summary.nextGateLabel}
          <span className="ml-2 font-normal text-white/50">· {summary.nextGateDate}</span>
        </p>
      </div>

      <div data-ai-target="engineering-kpis" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map((tile) => {
          const Icon = tile.icon;
          return (
            <Link
              key={tile.label}
              href={href(tile.view)}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-teal-500/15 via-white/[0.04] to-sky-500/10 px-4 py-4 transition-colors hover:border-teal-400/35"
            >
              <div
                className="pointer-events-none absolute inset-0 opacity-30"
                aria-hidden
              >
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <LineChart data={VELOCITY_TREND}>
                    <Line
                      type="monotone"
                      dataKey="points"
                      stroke="#2dd4bf"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="relative">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">
                    {tile.label}
                  </p>
                  <Icon className="h-4 w-4 text-teal-300/80" aria-hidden />
                </div>
                <p className="mt-3 text-2xl font-semibold tabular-nums text-white">{tile.value}</p>
                <p className="mt-1 text-xs text-white/40">{tile.hint}</p>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-2xl border border-white/12 bg-white/[0.03] p-4 sm:p-5">
          <h2 className="text-sm font-semibold text-white">Delivery velocity</h2>
          <p className="mt-1 text-xs text-white/45">Story points completed per sprint</p>
          <div className="mt-4 h-52">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <LineChart data={VELOCITY_TREND} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Line
                  type="monotone"
                  dataKey="points"
                  name="Points"
                  stroke="#38bdf8"
                  strokeWidth={2}
                  dot={{ fill: "#38bdf8", r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-2xl border border-white/12 bg-white/[0.03] p-4 sm:p-5">
          <h2 className="text-sm font-semibold text-white">Engineering spend</h2>
          <p className="mt-1 text-xs text-white/45">Cumulative portfolio burn (£k)</p>
          <div className="mt-4 h-52">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={BUDGET_BURN} margin={{ top: 8, right: 4, left: -12, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Bar dataKey="spent" name="£k spent" fill="#2dd4bf" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-2xl border border-white/12 bg-white/[0.03] p-4 sm:p-5">
          <h2 className="text-sm font-semibold text-white">Programme status</h2>
          <p className="mt-1 text-xs text-white/45">Active engineering programmes</p>
          <div className="mt-4 h-52">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={ragBars} margin={{ top: 8, right: 4, left: -12, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis
                  dataKey="rag"
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
                <Bar dataKey="count" name="Programmes" radius={[4, 4, 0, 0]}>
                  {ragBars.map((row) => (
                    <Cell
                      key={row.rag}
                      fill={
                        row.rag === "On track"
                          ? "#34d399"
                          : row.rag === "At risk"
                            ? "#fbbf24"
                            : "#f87171"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-2xl border border-white/12 bg-white/[0.03] p-4 sm:p-5">
          <h2 className="text-sm font-semibold text-white">Booked hours by discipline</h2>
          <p className="mt-1 text-xs text-white/45">This week · Manchester & Bristol teams</p>
          <div className="mt-4 h-52">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <PieChart>
                <Pie
                  data={disciplineLoad}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={48}
                  outerRadius={78}
                  paddingAngle={2}
                >
                  {disciplineLoad.map((_, index) => (
                    <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={chartTooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <TqmsSection title="Upcoming milestones" subtitle="Nearest open gates across programmes.">
          <ul className="space-y-2.5">
            {upcoming.map((m) => (
              <li
                key={m.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-white">{m.title}</p>
                  <p className="mt-0.5 text-[12px] text-white/45">
                    {m.programName} · {m.owner}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[12px] tabular-nums text-white/50">{m.dueDate}</span>
                  <TqmsStatusPill className={ragClass(m.status)}>{labelStatus(m.status)}</TqmsStatusPill>
                </div>
              </li>
            ))}
          </ul>
        </TqmsSection>

        <TqmsSection
          title="Top engineering risks"
          subtitle="Feeds corporate risk register."
          actions={
            <Link
              href={href("engineering-risks")}
              className="text-xs font-medium text-teal-300 hover:text-teal-200"
            >
              View all
            </Link>
          }
        >
          <ul className="space-y-2.5">
            {topRisks.map((r) => (
              <li
                key={r.id}
                className="rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-3"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <TqmsStatusPill className={ragClass(r.severity)}>{r.severity}</TqmsStatusPill>
                  <TqmsStatusPill className={ragClass(r.status)}>{r.status}</TqmsStatusPill>
                </div>
                <p className="mt-2 text-sm text-white">{r.title}</p>
                <p className="mt-1 text-[12px] text-white/45">
                  {r.program} · {r.owner}
                </p>
              </li>
            ))}
          </ul>
        </TqmsSection>
      </div>
    </Shell>
  );
}

export function NorthstarEngineeringProgramsWorkspace() {
  const totalBudget = NORTHSTAR_ENGINEERING_PROGRAMS.reduce((s, p) => s + p.budgetGbp, 0);
  const totalSpent = NORTHSTAR_ENGINEERING_PROGRAMS.reduce((s, p) => s + p.spentGbp, 0);

  const statusMix = [
    {
      name: "On track",
      value: NORTHSTAR_ENGINEERING_PROGRAMS.filter((p) => p.status === "on_track").length,
    },
    {
      name: "At risk",
      value: NORTHSTAR_ENGINEERING_PROGRAMS.filter((p) => p.status === "at_risk").length,
    },
    {
      name: "Delayed",
      value: NORTHSTAR_ENGINEERING_PROGRAMS.filter((p) => p.status === "delayed").length,
    },
    {
      name: "Complete",
      value: NORTHSTAR_ENGINEERING_PROGRAMS.filter((p) => p.status === "complete").length,
    },
  ].filter((row) => row.value > 0);

  const progressBars = NORTHSTAR_ENGINEERING_PROGRAMS.map((program) => ({
    name: program.name.length > 28 ? `${program.name.slice(0, 26)}…` : program.name,
    progress: program.progressPct,
    status: program.status,
  }));

  const openMilestones = NORTHSTAR_ENGINEERING_MILESTONES.filter((m) => m.status !== "done")
    .slice()
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 8);

  return (
    <Shell
      title="Programs & Milestones"
      subtitle="Industrial IoT and edge programmes — progress, spend, and milestone gates."
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <TqmsKpiTile label="Programmes" value={String(NORTHSTAR_ENGINEERING_PROGRAMS.length)} hint="Portfolio" />
        <TqmsKpiTile label="Budget" value={formatNorthstarEngGbp(totalBudget)} hint="Total approved" />
        <TqmsKpiTile label="Spent" value={formatNorthstarEngGbp(totalSpent)} hint="To date" />
        <TqmsKpiTile
          label="At-risk gates"
          value={String(
            NORTHSTAR_ENGINEERING_MILESTONES.filter(
              (m) => m.status === "blocked" || m.status === "at_risk",
            ).length,
          )}
          hint="Milestones"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-white/12 bg-white/[0.03] p-4 sm:p-5">
          <h2 className="text-sm font-semibold text-white">Programme status mix</h2>
          <p className="mt-1 text-xs text-white/45">RAG distribution</p>
          <div className="mt-4 h-52">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <PieChart>
                <Pie
                  data={statusMix}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={52}
                  outerRadius={78}
                  paddingAngle={2}
                >
                  {statusMix.map((_, index) => (
                    <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={chartTooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-2xl border border-white/12 bg-white/[0.03] p-4 sm:p-5">
          <h2 className="text-sm font-semibold text-white">Progress by programme</h2>
          <p className="mt-1 text-xs text-white/45">% complete</p>
          <div className="mt-4 h-52">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart
                data={progressBars}
                layout="vertical"
                margin={{ top: 4, right: 12, left: 4, bottom: 4 }}
              >
                <CartesianGrid stroke="rgba(255,255,255,0.06)" horizontal={false} />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={100}
                  tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 9 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Bar dataKey="progress" name="Progress %" fill="#38bdf8" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <TqmsSection title="Programme cards" subtitle="Owner, spend, and next gate.">
        <div className="grid gap-3 sm:grid-cols-2">
          {NORTHSTAR_ENGINEERING_PROGRAMS.map((program) => (
            <article
              key={program.id}
              className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold text-white">{program.name}</h3>
                <TqmsStatusPill className={ragClass(program.status)}>
                  {labelStatus(program.status)}
                </TqmsStatusPill>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-teal-500 to-sky-500"
                  style={{ width: `${program.progressPct}%` }}
                />
              </div>
              <p className="mt-2 text-[11px] text-white/45">
                {program.owner} · {program.progressPct}% · {formatNorthstarEngGbp(program.spentGbp)} spent
              </p>
            </article>
          ))}
        </div>
      </TqmsSection>

      <TqmsSection title="Milestone timeline" subtitle="Next open gates.">
        <div className="space-y-2">
          {openMilestones.map((m) => (
            <div
              key={m.id}
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5"
            >
              <div
                className={cn(
                  "h-2.5 w-2.5 shrink-0 rounded-full",
                  m.status === "blocked" || m.status === "at_risk"
                    ? "bg-amber-400"
                    : m.status === "in_progress"
                      ? "bg-sky-400"
                      : "bg-emerald-400",
                )}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">{m.title}</p>
                <p className="truncate text-[11px] text-white/45">{m.programName}</p>
              </div>
              <span className="shrink-0 text-[11px] tabular-nums text-white/50">{m.dueDate}</span>
            </div>
          ))}
        </div>
      </TqmsSection>
    </Shell>
  );
}

type PeriodMode = "weekly" | "monthly" | "quarterly";

function periodLabels(mode: PeriodMode): string[] {
  if (mode === "weekly") return ["W28", "W29", "W30", "W31", "W32"];
  if (mode === "monthly") return ["Jul", "Aug", "Sep", "Oct", "Nov"];
  return ["Q2 '26", "Q3 '26", "Q4 '26", "Q1 '27"];
}

function seededAllocation(memberId: string, periodIndex: number, base: number, mode: PeriodMode): number {
  const seed = memberId.charCodeAt(memberId.length - 1) + periodIndex * 11;
  const drift = mode === "weekly" ? 8 : mode === "monthly" ? 15 : 20;
  const variance = ((seed * 7) % (drift * 2 + 1)) - drift;
  return Math.min(110, Math.max(0, base + variance));
}

function allocationCellClass(pct: number): string {
  if (pct >= 100) return "bg-rose-500/75 text-rose-50";
  if (pct >= 85) return "bg-amber-500/65 text-amber-50";
  if (pct >= 60) return "bg-teal-500/55 text-teal-50";
  if (pct >= 30) return "bg-emerald-500/40 text-emerald-50";
  return "bg-white/10 text-white/50";
}

export function NorthstarEngineeringCapacityWorkspace() {
  const [mode, setMode] = useState<PeriodMode>("weekly");
  const periods = periodLabels(mode);
  const team = NORTHSTAR_ENGINEERING_TEAM;

  const summary = useMemo(() => {
    const overallocated = team.filter((m) => m.bookedHrsWeek > m.capacityHrsWeek);
    const avgUtil = Math.round(
      (team.reduce((s, m) => s + m.bookedHrsWeek, 0) /
        team.reduce((s, m) => s + m.capacityHrsWeek, 0)) *
        100,
    );
    return {
      avgUtil,
      overallocated: overallocated.length,
      available: team.filter((m) => m.allocationPct < 70).length,
      onLeave: 0,
      billableAvg: 82,
      overallocatedList: overallocated,
    };
  }, [team]);

  const modeButtons: { id: PeriodMode; label: string }[] = [
    { id: "weekly", label: "Weekly" },
    { id: "monthly", label: "Monthly" },
    { id: "quarterly", label: "Quarterly" },
  ];

  return (
    <Shell
      title="Team & Capacity"
      subtitle="Allocation and weekly load across Manchester, Bristol, and field engineers."
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <TqmsKpiTile label="Headcount" value={String(team.length)} hint="Engineering" />
        <TqmsKpiTile label="Avg utilisation" value={`${summary.avgUtil}%`} hint="Booked / capacity" />
        <TqmsKpiTile label="Overallocated" value={String(summary.overallocated)} hint="Above 100%" />
        <TqmsKpiTile label="Available" value={String(summary.available)} hint="Under 70% load" />
        <TqmsKpiTile label="Avg billable" value={`${summary.billableAvg}%`} hint="Delivery teams" />
      </div>

      <TqmsSection
        title="Utilisation heatmap"
        subtitle={`Engineers × ${mode} periods.`}
        actions={
          <div className="flex flex-wrap gap-2">
            {modeButtons.map((btn) => (
              <button
                key={btn.id}
                type="button"
                onClick={() => setMode(btn.id)}
                className={cn(
                  "inline-flex h-9 items-center rounded-xl border px-3 text-xs font-semibold transition-colors",
                  mode === btn.id
                    ? "border-teal-400/50 bg-teal-500/20 text-teal-100"
                    : "border-white/15 bg-white/[0.04] text-white/70 hover:bg-white/[0.08]",
                )}
              >
                {btn.label}
              </button>
            ))}
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-1 text-left text-xs">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 min-w-[140px] rounded-lg bg-[#0b1524] px-3 py-2 text-[10px] font-medium uppercase tracking-[0.12em] text-white/45">
                  Engineer
                </th>
                {periods.map((period) => (
                  <th
                    key={period}
                    className="min-w-[52px] px-1 py-2 text-center text-[10px] font-medium uppercase tracking-[0.12em] text-white/45"
                  >
                    {period}
                  </th>
                ))}
                <th className="min-w-[56px] px-2 py-2 text-center text-[10px] font-medium uppercase tracking-[0.12em] text-white/45">
                  Now
                </th>
              </tr>
            </thead>
            <tbody>
              {team.map((member) => {
                const nowPct = Math.round((member.bookedHrsWeek / member.capacityHrsWeek) * 100);
                return (
                  <tr key={member.id}>
                    <td className="sticky left-0 z-10 rounded-lg border border-white/10 bg-[#0b1524]/95 px-3 py-2">
                      <p className="truncate text-sm font-medium text-white">{member.name}</p>
                      <p className="truncate text-[11px] text-white/45">{member.discipline}</p>
                    </td>
                    {periods.map((period, index) => {
                      const pct = seededAllocation(member.id, index, nowPct, mode);
                      return (
                        <td key={`${member.id}-${period}`} className="p-0.5">
                          <div
                            title={`${member.name} · ${period}: ${pct}%`}
                            className={cn(
                              "flex h-10 items-center justify-center rounded-lg text-[11px] font-semibold tabular-nums",
                              allocationCellClass(pct),
                            )}
                          >
                            {pct}%
                          </div>
                        </td>
                      );
                    })}
                    <td className="p-0.5">
                      <div
                        className={cn(
                          "flex h-10 items-center justify-center rounded-lg text-[11px] font-semibold tabular-nums",
                          allocationCellClass(nowPct),
                        )}
                      >
                        {nowPct}%
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </TqmsSection>

      <TqmsSection title="Team roster" subtitle="Primary programme and weekly hours.">
        <div className="grid gap-3 sm:grid-cols-2">
          {team.map((member) => (
            <div
              key={member.id}
              className="rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-3"
            >
              <p className="text-sm font-semibold text-white">{member.name}</p>
              <p className="text-[12px] text-white/45">
                {member.role} · {member.location}
              </p>
              <p className="mt-2 text-xs text-white/60">{member.primaryProgram}</p>
              <p className="mt-1 text-xs tabular-nums text-white/50">
                {member.bookedHrsWeek}h / {member.capacityHrsWeek}h · {member.allocationPct}% allocated
              </p>
            </div>
          ))}
        </div>
      </TqmsSection>
    </Shell>
  );
}

export function NorthstarEngineeringRisksWorkspace() {
  const open = NORTHSTAR_ENGINEERING_RISKS.filter(
    (r) => r.status === "open" || r.status === "mitigating",
  );

  const matrix = useMemo(() => {
    const counts = new Map<string, number>();
    for (const risk of NORTHSTAR_ENGINEERING_RISKS) {
      const key = `${risk.severity}:${risk.likelihood}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return counts;
  }, []);

  return (
    <Shell
      title="Engineering Risks"
      subtitle="Programme-scoped risks with mitigation plans — aligned to capacity and delivery planning."
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <TqmsKpiTile label="Register" value={String(NORTHSTAR_ENGINEERING_RISKS.length)} hint="Total" />
        <TqmsKpiTile label="Open / mitigating" value={String(open.length)} hint="Active" />
        <TqmsKpiTile
          label="Critical / high"
          value={String(
            open.filter((r) => r.severity === "critical" || r.severity === "high").length,
          )}
          hint="Escalate"
        />
        <TqmsKpiTile
          label="Closed / accepted"
          value={String(
            NORTHSTAR_ENGINEERING_RISKS.filter(
              (r) => r.status === "accepted" || r.status === "closed",
            ).length,
          )}
          hint="Parked"
        />
      </div>

      <TqmsSection title="Risk heatmap" subtitle="Severity × likelihood — register density.">
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-1 text-left text-xs">
            <thead>
              <tr>
                <th className="min-w-[88px] px-2 py-2 text-[10px] font-medium uppercase tracking-[0.12em] text-white/45">
                  Severity ↓ / Likelihood →
                </th>
                {LIKELIHOOD_LEVELS.map((level) => (
                  <th
                    key={level}
                    className="min-w-[72px] px-1 py-2 text-center text-[10px] font-medium uppercase tracking-[0.12em] text-white/45"
                  >
                    {level}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...SEVERITY_LEVELS].reverse().map((severity) => (
                <tr key={severity}>
                  <td className="rounded-lg border border-white/10 bg-[#0b1524]/95 px-3 py-2 text-[11px] font-medium capitalize text-white/70">
                    {severity}
                  </td>
                  {LIKELIHOOD_LEVELS.map((likelihood) => {
                    const count = matrix.get(`${severity}:${likelihood}`) ?? 0;
                    return (
                      <td key={`${severity}-${likelihood}`} className="p-0.5">
                        <div
                          title={`${severity} / ${likelihood}: ${count} risk(s)`}
                          className={cn(
                            "flex h-12 items-center justify-center rounded-lg text-sm font-semibold tabular-nums",
                            riskMatrixCellClass(count),
                          )}
                        >
                          {count > 0 ? count : "—"}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TqmsSection>

      <TqmsSection title="Risk register" subtitle="Severity · likelihood · mitigation · impact.">
        <div className="space-y-3">
          {NORTHSTAR_ENGINEERING_RISKS.map((risk) => (
            <div
              key={risk.id}
              className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                <TqmsStatusPill className={ragClass(risk.severity)}>{risk.severity}</TqmsStatusPill>
                <TqmsStatusPill className={ragClass(risk.likelihood)}>{risk.likelihood}</TqmsStatusPill>
                <TqmsStatusPill className={ragClass(risk.status)}>{risk.status}</TqmsStatusPill>
              </div>
              <p className="mt-2 text-sm font-semibold text-white">{risk.title}</p>
              <p className="mt-1 text-[12px] text-white/45">
                {risk.program} · {risk.owner} · review by {risk.dueDate}
              </p>
              <p className="mt-2 text-[12px] text-white/60">
                <span className="font-medium text-white/75">Mitigation:</span> {risk.mitigation}
              </p>
              <p className="mt-1.5 text-[12px] text-white/50">
                <span className="font-medium text-white/65">Impact:</span> {risk.impact}
              </p>
            </div>
          ))}
        </div>
      </TqmsSection>
    </Shell>
  );
}
