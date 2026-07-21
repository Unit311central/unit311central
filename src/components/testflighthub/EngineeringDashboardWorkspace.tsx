"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  ArrowUpRight,
  BarChart3,
  BookOpen,
  FolderKanban,
  Headphones,
  Users,
  Wrench,
} from "lucide-react";

import {
  computeEngKpis,
  engStatusClass,
  type EngEngineer,
} from "@/lib/engineering-data";
import { getInternalNavHref } from "@/lib/internal-operations-data";
import { useInternalOperationsBasePath } from "./InternalOperationsBasePathContext";
import { useEngineeringMockStore } from "./useEngineeringMockStore";
import {
  WsEmpty,
  WsKpiTile,
  WsSection,
  WsStatusPill,
  WsPrimaryButtonClass,
  WsSecondaryButtonClass,
} from "./domain-workspace-ui";

function formatActivityWhen(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function teamSummary(engineers: EngEngineer[]) {
  const byDept = new Map<string, number>();
  for (const engineer of engineers) {
    byDept.set(engineer.department, (byDept.get(engineer.department) ?? 0) + 1);
  }
  return [...byDept.entries()]
    .map(([department, count]) => ({ department, count }))
    .sort((a, b) => b.count - a.count);
}

const KPI_LABELS: { key: keyof ReturnType<typeof computeEngKpis>; label: string }[] = [
  { key: "engineers", label: "Engineers" },
  { key: "activeInternal", label: "Active Internal Projects" },
  { key: "activeClient", label: "Active Client Projects" },
  { key: "sprintVelocity", label: "Sprint Velocity" },
  { key: "deploymentsThisWeek", label: "Deployments This Week" },
  { key: "openBugs", label: "Open Bugs" },
  { key: "codeReviewsPending", label: "Code Reviews Pending" },
  { key: "productionIncidents", label: "Production Incidents" },
  { key: "averageLeadTime", label: "Average Lead Time" },
  { key: "utilisation", label: "Utilisation" },
  { key: "technicalDebtItems", label: "Technical Debt Items" },
  { key: "releaseReadiness", label: "Release Readiness" },
];

export default function EngineeringDashboardWorkspace() {
  const basePath = useInternalOperationsBasePath();
  const store = useEngineeringMockStore();

  const kpis = useMemo(
    () => computeEngKpis(store.engineers, store.projects, store.incidents, store.debt),
    [store],
  );

  const teams = useMemo(() => teamSummary(store.engineers), [store.engineers]);
  const archReviews = useMemo(
    () => store.activity.filter((item) => item.label.toLowerCase().includes("architecture")),
    [store.activity],
  );
  const deployments = useMemo(
    () => store.activity.filter((item) => item.label.toLowerCase().includes("deployment")),
    [store.activity],
  );

  const quickLinks = [
    { label: "Engineer Resources", href: getInternalNavHref("engineering-resources", basePath), icon: Users },
    { label: "Capacity Planning", href: getInternalNavHref("engineering-capacity", basePath), icon: BarChart3 },
    { label: "Projects", href: getInternalNavHref("projects", basePath), icon: FolderKanban },
    { label: "HR", href: getInternalNavHref("hr", basePath), icon: Users },
    { label: "Training", href: getInternalNavHref("training", basePath), icon: BookOpen },
    { label: "Support", href: getInternalNavHref("support", basePath), icon: Headphones },
  ];

  return (
    <div className="space-y-5">
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {KPI_LABELS.map(({ key, label }) => (
          <WsKpiTile key={key} label={label} value={kpis[key]} />
        ))}
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <WsSection title="Teams Summary" subtitle="Headcount by engineering department.">
          {teams.length === 0 ? (
            <WsEmpty message="No engineers in the roster yet." />
          ) : (
            <ul className="space-y-2">
              {teams.map((row) => (
                <li
                  key={row.department}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5"
                >
                  <span className="text-sm text-white">{row.department}</span>
                  <span className="text-sm font-semibold tabular-nums text-white">{row.count}</span>
                </li>
              ))}
            </ul>
          )}
        </WsSection>

        <WsSection title="Current Sprint" subtitle="Active delivery window.">
          <p className="text-lg font-semibold text-white">{store.currentSprint}</p>
          <ul className="mt-3 space-y-2">
            {store.projects.slice(0, 4).map((project) => (
              <li
                key={project.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">{project.name}</p>
                  <p className="text-xs text-white/45">{project.owner}</p>
                </div>
                <WsStatusPill className={engStatusClass(project.health)}>{project.health}</WsStatusPill>
              </li>
            ))}
          </ul>
        </WsSection>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <WsSection title="Upcoming Releases" subtitle="Planned production promotions.">
          {store.upcomingReleases.length === 0 ? (
            <WsEmpty message="No releases scheduled." />
          ) : (
            <ul className="space-y-2">
              {store.upcomingReleases.map((release) => (
                <li
                  key={release}
                  className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white"
                >
                  {release}
                </li>
              ))}
            </ul>
          )}
        </WsSection>

        <WsSection title="Architecture Reviews" subtitle="Recent design decisions.">
          {archReviews.length === 0 ? (
            <WsEmpty message="No architecture reviews logged recently." />
          ) : (
            <ul className="space-y-2">
              {archReviews.map((item) => (
                <li
                  key={item.id}
                  className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5"
                >
                  <p className="text-sm font-medium text-white">{item.detail}</p>
                  <p className="mt-1 text-xs text-white/45">{formatActivityWhen(item.at)}</p>
                </li>
              ))}
            </ul>
          )}
        </WsSection>

        <WsSection title="Incidents" subtitle="Production reliability tracker.">
          {store.incidents.length === 0 ? (
            <WsEmpty message="No incidents recorded." />
          ) : (
            <ul className="space-y-2">
              {store.incidents.map((incident) => (
                <li
                  key={incident.id}
                  className="flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white">{incident.title}</p>
                    <p className="text-xs text-white/45">{incident.owner}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <WsStatusPill className={engStatusClass(incident.severity)}>{incident.severity}</WsStatusPill>
                    <WsStatusPill className={engStatusClass(incident.status)}>{incident.status}</WsStatusPill>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </WsSection>

        <WsSection title="Infrastructure Status" subtitle="Platform health snapshot.">
          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-400/30 bg-emerald-500/10">
              <Wrench className="h-5 w-5 text-emerald-200" />
            </div>
            <div>
              <p className="text-lg font-semibold text-white">{store.infraStatus}</p>
              <p className="text-sm text-white/45">All core services operational</p>
            </div>
          </div>
        </WsSection>

        <WsSection title="Technical Debt" subtitle="Prioritised remediation backlog.">
          {store.debt.length === 0 ? (
            <WsEmpty message="No technical debt items tracked." />
          ) : (
            <ul className="space-y-2">
              {store.debt.map((item) => (
                <li
                  key={item.id}
                  className="flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5"
                >
                  <div>
                    <p className="text-sm font-medium text-white">{item.title}</p>
                    <p className="text-xs text-white/45">
                      {item.area} · {item.effort}
                    </p>
                  </div>
                  <WsStatusPill className={engStatusClass(item.priority)}>{item.priority}</WsStatusPill>
                </li>
              ))}
            </ul>
          )}
        </WsSection>

        <WsSection title="Recent Deployments" subtitle="Production promotion trail.">
          {deployments.length === 0 ? (
            <WsEmpty message="No deployments logged recently." />
          ) : (
            <ul className="space-y-2">
              {deployments.map((item) => (
                <li
                  key={item.id}
                  className="flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5"
                >
                  <p className="text-sm text-white">{item.detail}</p>
                  <p className="shrink-0 text-xs tabular-nums text-white/45">{formatActivityWhen(item.at)}</p>
                </li>
              ))}
            </ul>
          )}
        </WsSection>
      </div>

      <WsSection
        title="Quick Links"
        subtitle="Cross-module engineering workflows."
        actions={
          <Link href={getInternalNavHref("clients", basePath)} className={WsSecondaryButtonClass()}>
            Clients
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        }
      >
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {quickLinks.map((link) => (
            <Link key={link.label} href={link.href} className={WsPrimaryButtonClass()}>
              <link.icon className="h-3.5 w-3.5" />
              {link.label}
            </Link>
          ))}
        </div>
      </WsSection>
    </div>
  );
}
