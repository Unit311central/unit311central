"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Cpu,
  Plug,
  ShieldCheck,
  Target,
  Truck,
  Users,
} from "lucide-react";
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
import {
  TqmsKpiTile,
  TqmsSection,
  TqmsStatusPill,
} from "@/components/testflighthub/tqms-ui";
import {
  formatOaEngUsd,
  getOaEngineeringOverviewSummary,
  OA_ENG_ASSURANCE,
  OA_ENG_INTEGRATIONS,
  OA_ENG_MILESTONES,
  OA_ENG_PROGRAMS,
  OA_ENG_RISKS,
  OA_ENG_SUPPLY,
  OA_ENG_TEAM,
  type OaEngRag,
} from "@/lib/onwardair/engineering-data";
import {
  getInternalNavHref,
  type InternalOperationsView,
} from "@/lib/internal-operations-data";
import { cn } from "@/lib/utils";

export type OnwardAirEngineeringPage =
  | "overview"
  | "programs"
  | "team"
  | "supply"
  | "assurance"
  | "risks"
  | "integrations";

const chartTooltipStyle = {
  background: "#0b1524",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 12,
  fontSize: 12,
  color: "#fff",
} as const;

const RAG_COLORS = {
  green: "#34d399",
  amber: "#fbbf24",
  red: "#f87171",
} as const;

function ragClass(rag: OaEngRag | string) {
  const s = rag.toLowerCase();
  if (s === "green" || s === "done" || s === "complete" || s === "connected" || s === "received") {
    return "border-emerald-400/30 bg-emerald-500/15 text-emerald-100";
  }
  if (
    s === "amber" ||
    s === "in_progress" ||
    s === "mitigating" ||
    s === "syncing" ||
    s === "ordered" ||
    s === "in_transit" ||
    s === "quoting"
  ) {
    return "border-amber-400/30 bg-amber-500/15 text-amber-100";
  }
  if (
    s === "red" ||
    s === "at_risk" ||
    s === "critical" ||
    s === "high" ||
    s === "blocked" ||
    s === "degraded" ||
    s === "open"
  ) {
    return "border-rose-400/30 bg-rose-500/15 text-rose-100";
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
          OnwardAir · Engineering
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/55">{subtitle}</p>
      </header>
      {children}
    </div>
  );
}

function OverviewPage() {
  const basePath = useInternalOperationsBasePath();
  const summary = getOaEngineeringOverviewSummary();
  const href = (view: InternalOperationsView) => getInternalNavHref(view, basePath);

  const tiles = [
    {
      label: "Active programs",
      value: String(summary.programsActive),
      hint: `${summary.programsAmberOrRed} amber/red RAG`,
      view: "oa-programs-milestones" as const,
      icon: Target,
    },
    {
      label: "Milestones (30d)",
      value: String(summary.milestonesDue30d),
      hint: `${summary.milestonesAtRisk} at risk`,
      view: "oa-programs-milestones" as const,
      icon: Cpu,
    },
    {
      label: "Team utilization",
      value: `${summary.avgUtilizationPct}%`,
      hint: `${summary.teamHeadcount} engineers · Houston`,
      view: "oa-team-capacity" as const,
      icon: Users,
    },
    {
      label: "Supply watch",
      value: String(summary.supplyAtRisk),
      hint: `${summary.longLeadOpen} long-lead open`,
      view: "oa-supply-dependencies" as const,
      icon: Truck,
    },
    {
      label: "Assurance evidence",
      value: `${summary.assuranceEvidenceAvgPct}%`,
      hint: `${summary.certArtifactsOpen} artifacts open`,
      view: "oa-assurance-certification" as const,
      icon: ShieldCheck,
    },
    {
      label: "Open risks",
      value: String(summary.risksOpen),
      hint: `${summary.risksCriticalOrHigh} critical/high`,
      view: "oa-engineering-risks" as const,
      icon: AlertTriangle,
    },
  ];

  const ragBars = [
    { rag: "Green", count: OA_ENG_PROGRAMS.filter((p) => p.rag === "green").length },
    { rag: "Amber", count: OA_ENG_PROGRAMS.filter((p) => p.rag === "amber").length },
    { rag: "Red", count: OA_ENG_PROGRAMS.filter((p) => p.rag === "red").length },
  ];

  const disciplineLoad = Object.entries(
    OA_ENG_TEAM.reduce<Record<string, number>>((acc, member) => {
      acc[member.discipline] = (acc[member.discipline] ?? 0) + member.bookedHrsWeek;
      return acc;
    }, {}),
  ).map(([name, value]) => ({ name, value }));

  const upcoming = OA_ENG_MILESTONES.filter((m) => m.status !== "done")
    .slice()
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 5);

  const topRisks = OA_ENG_RISKS.filter((r) => r.status === "open" || r.status === "mitigating")
    .slice()
    .sort((a, b) => {
      const rank = { critical: 0, high: 1, medium: 2, low: 3 };
      return rank[a.severity] - rank[b.severity];
    })
    .slice(0, 4);

  return (
    <Shell
      title="Engineering Overview"
      subtitle="Houston HQ snapshot across Vertex VTOL™, FLEX Pod™, capacity, supply, assurance, and risks — USD."
    >
      <div className="rounded-2xl border border-violet-400/25 bg-violet-500/10 px-4 py-3 sm:px-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-200/80">
          Next hover gate
        </p>
        <p className="mt-1 text-sm font-semibold text-white">
          {summary.nextHoverGateLabel}
          <span className="ml-2 font-normal text-white/50">· {summary.nextHoverGateDate}</span>
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {tiles.map((tile) => {
          const Icon = tile.icon;
          return (
            <Link
              key={tile.label}
              href={href(tile.view)}
              className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 transition-colors hover:border-violet-400/35 hover:bg-violet-500/[0.07]"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">
                  {tile.label}
                </p>
                <Icon className="h-4 w-4 text-violet-300/80" aria-hidden />
              </div>
              <p className="mt-3 text-2xl font-semibold tabular-nums text-white">{tile.value}</p>
              <p className="mt-1 text-xs text-white/40">{tile.hint}</p>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-2xl border border-white/12 bg-white/[0.03] p-4 sm:p-5">
          <h2 className="text-sm font-semibold text-white">Program RAG</h2>
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
                <Bar dataKey="count" name="Programs" radius={[4, 4, 0, 0]}>
                  {ragBars.map((row) => (
                    <Cell
                      key={row.rag}
                      fill={
                        row.rag === "Green"
                          ? RAG_COLORS.green
                          : row.rag === "Amber"
                            ? RAG_COLORS.amber
                            : RAG_COLORS.red
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
          <p className="mt-1 text-xs text-white/45">This week · Houston team</p>
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
                    <Cell
                      key={index}
                      fill={["#a78bfa", "#38bdf8", "#34d399", "#fbbf24", "#f472b6", "#94a3b8"][index % 6]}
                    />
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
                  <p className="text-sm font-medium text-white">{m.name}</p>
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
          subtitle="Feeds Board Risk Management."
          actions={
            <Link
              href={href("oa-engineering-risks")}
              className="text-xs font-medium text-violet-300 hover:text-violet-200"
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

      <div className="flex flex-wrap gap-2">
        <Link
          href={href("oa-engineering-integrations")}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/60 hover:border-violet-400/30 hover:text-white"
        >
          <Plug className="h-3.5 w-3.5" />
          {summary.integrationsConnected} integrations connected
          {summary.integrationsDegraded
            ? ` · ${summary.integrationsDegraded} need attention`
            : ""}
        </Link>
      </div>
    </Shell>
  );
}

function ProgramsPage() {
  return (
    <Shell
      title="Programs & Milestones"
      subtitle="Aircraft and product programmes, gates, and RAG for Houston engineering."
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <TqmsKpiTile label="Programs" value={String(OA_ENG_PROGRAMS.length)} hint="Active" />
        <TqmsKpiTile
          label="Budget (USD)"
          value={formatOaEngUsd(OA_ENG_PROGRAMS.reduce((s, p) => s + p.budgetUsd, 0))}
          hint="All programmes"
        />
        <TqmsKpiTile
          label="Spent (USD)"
          value={formatOaEngUsd(OA_ENG_PROGRAMS.reduce((s, p) => s + p.spentUsd, 0))}
          hint="To date"
        />
        <TqmsKpiTile
          label="At-risk gates"
          value={String(OA_ENG_MILESTONES.filter((m) => m.status === "at_risk").length)}
          hint="Milestones"
        />
      </div>

      <TqmsSection title="Programmes" subtitle="RAG, spend, and next gate.">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-white/10 text-[10px] uppercase tracking-wider text-white/45">
              <tr>
                <th className="px-2 py-2 font-semibold">Program</th>
                <th className="px-2 py-2 font-semibold">Owner</th>
                <th className="px-2 py-2 font-semibold">Progress</th>
                <th className="px-2 py-2 font-semibold">RAG</th>
                <th className="px-2 py-2 font-semibold">Spend</th>
                <th className="px-2 py-2 font-semibold">Next gate</th>
              </tr>
            </thead>
            <tbody>
              {OA_ENG_PROGRAMS.map((p) => (
                <tr key={p.id} className="border-b border-white/5 text-white/80">
                  <td className="px-2 py-3">
                    <p className="font-medium text-white">{p.name}</p>
                    <p className="text-[11px] text-white/40">
                      {p.code} · {p.site}
                    </p>
                  </td>
                  <td className="px-2 py-3">{p.owner}</td>
                  <td className="px-2 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-violet-400"
                          style={{ width: `${p.progressPct}%` }}
                        />
                      </div>
                      <span className="tabular-nums text-xs">{p.progressPct}%</span>
                    </div>
                  </td>
                  <td className="px-2 py-3">
                    <TqmsStatusPill className={ragClass(p.rag)}>{p.rag}</TqmsStatusPill>
                  </td>
                  <td className="px-2 py-3 tabular-nums">
                    {formatOaEngUsd(p.spentUsd)}
                    <span className="block text-[11px] text-white/35">
                      of {formatOaEngUsd(p.budgetUsd)}
                    </span>
                  </td>
                  <td className="px-2 py-3">
                    <p>{p.nextGate}</p>
                    <p className="text-[11px] text-white/40">{p.nextGateDate}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TqmsSection>

      <TqmsSection title="Milestones" subtitle="Gate tracker across programmes.">
        <ul className="space-y-2">
          {OA_ENG_MILESTONES.map((m) => (
            <li
              key={m.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-3"
            >
              <div>
                <p className="text-sm font-medium text-white">{m.name}</p>
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
    </Shell>
  );
}

function TeamPage() {
  const overbooked = OA_ENG_TEAM.filter((m) => m.bookedHrsWeek > m.capacityHrsWeek);
  const avgUtil = Math.round(
    (OA_ENG_TEAM.reduce((s, m) => s + m.bookedHrsWeek, 0) /
      OA_ENG_TEAM.reduce((s, m) => s + m.capacityHrsWeek, 0)) *
      100,
  );

  return (
    <Shell
      title="Team & Capacity"
      subtitle="Allocation and weekly load for Houston engineering disciplines."
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <TqmsKpiTile label="Headcount" value={String(OA_ENG_TEAM.length)} hint="Engineering" />
        <TqmsKpiTile label="Avg utilization" value={`${avgUtil}%`} hint="Booked / capacity" />
        <TqmsKpiTile
          label="Overbooked"
          value={String(overbooked.length)}
          hint="Above weekly capacity"
        />
        <TqmsKpiTile
          label="Fully allocated"
          value={String(OA_ENG_TEAM.filter((m) => m.allocationPct >= 100).length)}
          hint="100% programme load"
        />
      </div>

      <TqmsSection title="Team roster" subtitle="Primary programme and weekly hours.">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="border-b border-white/10 text-[10px] uppercase tracking-wider text-white/45">
              <tr>
                <th className="px-2 py-2 font-semibold">Person</th>
                <th className="px-2 py-2 font-semibold">Discipline</th>
                <th className="px-2 py-2 font-semibold">Program</th>
                <th className="px-2 py-2 font-semibold">Alloc</th>
                <th className="px-2 py-2 font-semibold">Hrs booked</th>
              </tr>
            </thead>
            <tbody>
              {OA_ENG_TEAM.map((m) => (
                <tr key={m.id} className="border-b border-white/5 text-white/80">
                  <td className="px-2 py-3">
                    <p className="font-medium text-white">{m.name}</p>
                    <p className="text-[11px] text-white/40">
                      {m.role} · {m.location}
                    </p>
                  </td>
                  <td className="px-2 py-3">{m.discipline}</td>
                  <td className="px-2 py-3">{m.primaryProgram}</td>
                  <td className="px-2 py-3 tabular-nums">{m.allocationPct}%</td>
                  <td className="px-2 py-3">
                    <span
                      className={cn(
                        "tabular-nums",
                        m.bookedHrsWeek > m.capacityHrsWeek ? "text-amber-200" : "text-white/80",
                      )}
                    >
                      {m.bookedHrsWeek}/{m.capacityHrsWeek}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TqmsSection>
    </Shell>
  );
}

function SupplyPage() {
  return (
    <Shell
      title="Supply & Dependencies"
      subtitle="Long-lead items, suppliers, and blockers on the engineering critical path."
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <TqmsKpiTile label="Open items" value={String(OA_ENG_SUPPLY.length)} hint="Tracked" />
        <TqmsKpiTile
          label="At risk"
          value={String(OA_ENG_SUPPLY.filter((s) => s.status === "at_risk").length)}
          hint="Need expedite"
        />
        <TqmsKpiTile
          label="In transit"
          value={String(OA_ENG_SUPPLY.filter((s) => s.status === "in_transit").length)}
          hint="Inbound"
        />
        <TqmsKpiTile
          label="Value open"
          value={formatOaEngUsd(
            OA_ENG_SUPPLY.filter((s) => s.status !== "received").reduce((n, s) => n + s.valueUsd, 0),
          )}
          hint="USD"
        />
      </div>

      <TqmsSection title="Supply board" subtitle="Dependencies mapped to programme gates.">
        <div className="space-y-2.5">
          {OA_ENG_SUPPLY.map((s) => (
            <div
              key={s.id}
              className="rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-white">{s.item}</p>
                <TqmsStatusPill className={ragClass(s.status)}>{labelStatus(s.status)}</TqmsStatusPill>
              </div>
              <p className="mt-1 text-[12px] text-white/50">
                {s.supplier} · {s.program} · lead {s.leadWeeks}w · need by {s.needBy}
              </p>
              <p className="mt-1 text-[12px] text-white/40">
                Blocks: {s.dependency} · {formatOaEngUsd(s.valueUsd)}
              </p>
            </div>
          ))}
        </div>
      </TqmsSection>
    </Shell>
  );
}

function AssurancePage() {
  const avg = Math.round(
    OA_ENG_ASSURANCE.reduce((s, a) => s + a.evidencePct, 0) / OA_ENG_ASSURANCE.length,
  );

  return (
    <Shell
      title="Assurance & Certification"
      subtitle="Evidence packs and readiness for hover demo gates — adapted aerospace standards."
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <TqmsKpiTile label="Artifacts" value={String(OA_ENG_ASSURANCE.length)} hint="Tracked" />
        <TqmsKpiTile label="Avg evidence" value={`${avg}%`} hint="Across domains" />
        <TqmsKpiTile
          label="Complete"
          value={String(OA_ENG_ASSURANCE.filter((a) => a.status === "complete").length)}
          hint="Signed off"
        />
        <TqmsKpiTile
          label="Blocked"
          value={String(OA_ENG_ASSURANCE.filter((a) => a.status === "blocked").length)}
          hint="Need unblock"
        />
      </div>

      <TqmsSection title="Evidence tracker" subtitle="Domain · standard · owner.">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-white/10 text-[10px] uppercase tracking-wider text-white/45">
              <tr>
                <th className="px-2 py-2 font-semibold">Artifact</th>
                <th className="px-2 py-2 font-semibold">Standard</th>
                <th className="px-2 py-2 font-semibold">Evidence</th>
                <th className="px-2 py-2 font-semibold">Status</th>
                <th className="px-2 py-2 font-semibold">Due</th>
              </tr>
            </thead>
            <tbody>
              {OA_ENG_ASSURANCE.map((a) => (
                <tr key={a.id} className="border-b border-white/5 text-white/80">
                  <td className="px-2 py-3">
                    <p className="font-medium text-white">{a.artifact}</p>
                    <p className="text-[11px] text-white/40">
                      {a.domain} · {a.owner}
                    </p>
                  </td>
                  <td className="px-2 py-3 text-[12px]">{a.standard}</td>
                  <td className="px-2 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-emerald-400"
                          style={{ width: `${a.evidencePct}%` }}
                        />
                      </div>
                      <span className="tabular-nums text-xs">{a.evidencePct}%</span>
                    </div>
                  </td>
                  <td className="px-2 py-3">
                    <TqmsStatusPill className={ragClass(a.status)}>
                      {labelStatus(a.status)}
                    </TqmsStatusPill>
                  </td>
                  <td className="px-2 py-3 tabular-nums text-[12px]">{a.dueDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TqmsSection>
    </Shell>
  );
}

function RisksPage() {
  return (
    <Shell
      title="Engineering Risks"
      subtitle="Engineering-scoped risks that feed Board Risk Management."
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <TqmsKpiTile label="Register" value={String(OA_ENG_RISKS.length)} hint="Total" />
        <TqmsKpiTile
          label="Open / mitigating"
          value={String(
            OA_ENG_RISKS.filter((r) => r.status === "open" || r.status === "mitigating").length,
          )}
          hint="Active"
        />
        <TqmsKpiTile
          label="Critical / high"
          value={String(
            OA_ENG_RISKS.filter(
              (r) =>
                (r.severity === "critical" || r.severity === "high") &&
                (r.status === "open" || r.status === "mitigating"),
            ).length,
          )}
          hint="Escalate"
        />
        <TqmsKpiTile
          label="Accepted / closed"
          value={String(
            OA_ENG_RISKS.filter((r) => r.status === "accepted" || r.status === "closed").length,
          )}
          hint="Parked"
        />
      </div>

      <TqmsSection title="Risk register" subtitle="Severity · likelihood · mitigation.">
        <div className="space-y-2.5">
          {OA_ENG_RISKS.map((r) => (
            <div
              key={r.id}
              className="rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-3"
            >
              <div className="flex flex-wrap items-center gap-2">
                <TqmsStatusPill className={ragClass(r.severity)}>{r.severity}</TqmsStatusPill>
                <TqmsStatusPill className={ragClass(r.likelihood)}>{r.likelihood}</TqmsStatusPill>
                <TqmsStatusPill className={ragClass(r.status)}>{r.status}</TqmsStatusPill>
              </div>
              <p className="mt-2 text-sm font-medium text-white">{r.title}</p>
              <p className="mt-1 text-[12px] text-white/45">
                {r.program} · {r.owner} · due {r.dueDate}
              </p>
              <p className="mt-1.5 text-[12px] text-white/55">{r.mitigation}</p>
            </div>
          ))}
        </div>
      </TqmsSection>
    </Shell>
  );
}

function IntegrationsPage() {
  return (
    <Shell
      title="Integrations"
      subtitle="Connections to Jira, Azure DevOps, PLM, and related engineering systems — not a ticket tracker."
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <TqmsKpiTile
          label="Connected"
          value={String(OA_ENG_INTEGRATIONS.filter((i) => i.status === "connected").length)}
          hint="Healthy"
        />
        <TqmsKpiTile
          label="Syncing"
          value={String(OA_ENG_INTEGRATIONS.filter((i) => i.status === "syncing").length)}
          hint="In flight"
        />
        <TqmsKpiTile
          label="Degraded"
          value={String(OA_ENG_INTEGRATIONS.filter((i) => i.status === "degraded").length)}
          hint="Needs attention"
        />
        <TqmsKpiTile
          label="Planned"
          value={String(OA_ENG_INTEGRATIONS.filter((i) => i.status === "planned").length)}
          hint="Roadmap"
        />
      </div>

      <TqmsSection title="Connector status" subtitle="Last sync from Houston systems.">
        <div className="grid gap-3 md:grid-cols-2">
          {OA_ENG_INTEGRATIONS.map((i) => (
            <div
              key={i.id}
              className="rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-white">{i.name}</p>
                  <p className="mt-0.5 text-[12px] text-white/45">{i.system}</p>
                </div>
                <TqmsStatusPill className={ragClass(i.status)}>{i.status}</TqmsStatusPill>
              </div>
              <p className="mt-2 text-[12px] text-white/55">{i.purpose}</p>
              <p className="mt-2 text-[11px] text-white/40">
                Owner {i.owner}
                {i.lastSync !== "—"
                  ? ` · last sync ${new Date(i.lastSync).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}`
                  : " · not live yet"}
              </p>
            </div>
          ))}
        </div>
      </TqmsSection>
    </Shell>
  );
}

export default function OnwardAirEngineeringWorkspaces({
  page,
}: {
  page: OnwardAirEngineeringPage;
}) {
  switch (page) {
    case "overview":
      return <OverviewPage />;
    case "programs":
      return <ProgramsPage />;
    case "team":
      return <TeamPage />;
    case "supply":
      return <SupplyPage />;
    case "assurance":
      return <AssurancePage />;
    case "risks":
      return <RisksPage />;
    case "integrations":
      return <IntegrationsPage />;
    default:
      return <OverviewPage />;
  }
}

export function EngineeringOverviewWorkspace() {
  return <OnwardAirEngineeringWorkspaces page="overview" />;
}
export function EngineeringProgramsWorkspace() {
  return <OnwardAirEngineeringWorkspaces page="programs" />;
}
export function EngineeringTeamWorkspace() {
  return <OnwardAirEngineeringWorkspaces page="team" />;
}
export function EngineeringSupplyWorkspace() {
  return <OnwardAirEngineeringWorkspaces page="supply" />;
}
export function EngineeringAssuranceWorkspace() {
  return <OnwardAirEngineeringWorkspaces page="assurance" />;
}
export function EngineeringRisksWorkspace() {
  return <OnwardAirEngineeringWorkspaces page="risks" />;
}
export function EngineeringIntegrationsWorkspace() {
  return <OnwardAirEngineeringWorkspaces page="integrations" />;
}
