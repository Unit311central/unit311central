"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronRight, Loader2 } from "lucide-react";

import { PLATFORM_ANALYTICS_PERIODS } from "@/lib/platform-analytics/period";
import { WORKSPACE_FILTERS } from "@/lib/platform-analytics/taxonomy";
import type { WorkspaceFilterKey } from "@/lib/platform-analytics/taxonomy";
import type {
  FeatureOpportunityRow,
  ModuleAdoptionRow,
  PageAdoptionRow,
  PlatformAnalyticsPeriod,
  PlatformAnalyticsSummary,
  WorkspaceAdoptionRow,
} from "@/lib/platform-analytics/types";
import { cn } from "@/lib/utils";
import { TqmsSection } from "./tqms-ui";

const OPPORTUNITY_LABELS: Record<FeatureOpportunityRow["type"], string> = {
  high_visibility_low_adoption: "High visibility / low adoption",
  never_used: "Never used",
  emerging: "Emerging",
  needs_enablement: "Needs customer enablement",
};

type Drill =
  | { kind: "global" }
  | { kind: "workspace"; workspaceKey: string; workspaceLabel: string }
  | { kind: "module"; module: ModuleAdoptionRow };

function ScorePill({ value }: { value: number }) {
  const tone =
    value >= 70
      ? "border-emerald-400/35 bg-emerald-500/15 text-emerald-100"
      : value >= 40
        ? "border-amber-400/35 bg-amber-500/15 text-amber-100"
        : "border-white/15 bg-white/[0.04] text-white/70";
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold tabular-nums",
        tone,
      )}
    >
      {value}
    </span>
  );
}

function AdoptionBar({ value }: { value: number }) {
  return (
    <div className="flex min-w-[120px] items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-sky-400/80"
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
      <ScorePill value={value} />
    </div>
  );
}

export default function PlatformAnalyticsWorkspace() {
  const [period, setPeriod] = useState<PlatformAnalyticsPeriod>("30d");
  const [workspaceFilter, setWorkspaceFilter] = useState<WorkspaceFilterKey>("all");
  const [summary, setSummary] = useState<PlatformAnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drill, setDrill] = useState<Drill>({ kind: "global" });

  const load = useCallback(
    async (nextPeriod: PlatformAnalyticsPeriod, nextWorkspace: WorkspaceFilterKey) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          period: nextPeriod,
          workspace: nextWorkspace,
        });
        const response = await fetch(`/api/platform-analytics/summary?${params}`, {
          cache: "no-store",
        });
        const data = (await response.json()) as PlatformAnalyticsSummary & { error?: string };
        if (!response.ok) throw new Error(data.error ?? "Failed to load analytics.");
        setSummary(data);
      } catch (loadError) {
        setSummary(null);
        setError(loadError instanceof Error ? loadError.message : "Failed to load analytics.");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void load(period, workspaceFilter);
  }, [load, period, workspaceFilter]);

  useEffect(() => {
    // Reset module drill when filter changes; keep workspace drill if matching filter.
    setDrill((prev) => {
      if (prev.kind === "module") return { kind: "global" };
      if (prev.kind === "workspace" && workspaceFilter !== "all" && workspaceFilter !== prev.workspaceKey) {
        return { kind: "global" };
      }
      return prev;
    });
  }, [workspaceFilter, period]);

  const selectedModule = drill.kind === "module" ? drill.module : null;

  const workspaceDetail = useMemo(() => {
    if (!summary || drill.kind !== "workspace") return null;
    return summary.workspaceComparison.find((w) => w.workspaceKey === drill.workspaceKey) ?? null;
  }, [summary, drill]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">Platform Analytics</h1>
          <p className="mt-1 max-w-3xl text-sm text-white/55">
            Page-level adoption across the navigation hierarchy. Drill Workspace → Module →
            Section → Page. First-party telemetry only.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex flex-wrap justify-end gap-2">
            {PLATFORM_ANALYTICS_PERIODS.map((item) => (
              <FilterChip
                key={item.id}
                active={period === item.id}
                onClick={() => setPeriod(item.id)}
                label={item.label}
              />
            ))}
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            {WORKSPACE_FILTERS.map((item) => (
              <FilterChip
                key={item.key}
                active={workspaceFilter === item.key}
                onClick={() => {
                  setWorkspaceFilter(item.key);
                  setDrill({ kind: "global" });
                }}
                label={item.label}
              />
            ))}
          </div>
        </div>
      </div>

      <Breadcrumb
        drill={drill}
        workspaceFilter={workspaceFilter}
        onGlobal={() => setDrill({ kind: "global" })}
      />

      {loading ? (
        <p className="flex items-center gap-2 text-sm text-white/50">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading adoption analytics…
        </p>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      {summary && !loading ? (
        drill.kind === "module" && selectedModule ? (
          <ModuleDrillDown
            module={selectedModule}
            onBack={() => setDrill({ kind: "global" })}
          />
        ) : drill.kind === "workspace" && workspaceDetail ? (
          <WorkspaceDrillDown
            row={workspaceDetail}
            modules={summary.modules}
            pagesMost={summary.pagesMost}
            pagesLeast={summary.pagesLeast}
            ea={summary.executiveAssistant}
            onBack={() => {
              setDrill({ kind: "global" });
              setWorkspaceFilter("all");
            }}
            onOpenModule={(module) => setDrill({ kind: "module", module })}
          />
        ) : (
          <GlobalView
            summary={summary}
            onOpenModule={(module) => setDrill({ kind: "module", module })}
            onOpenWorkspace={(row) => {
              // Recalculate all analytics for the selected workspace.
              setWorkspaceFilter(row.workspaceKey as WorkspaceFilterKey);
              setDrill({
                kind: "workspace",
                workspaceKey: row.workspaceKey,
                workspaceLabel: row.workspaceLabel,
              });
            }}
          />
        )
      ) : null}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
        active
          ? "border-sky-400/50 bg-sky-500/20 text-sky-100"
          : "border-white/10 bg-white/[0.03] text-white/55 hover:border-white/20 hover:text-white/80",
      )}
    >
      {label}
    </button>
  );
}

function Breadcrumb({
  drill,
  workspaceFilter,
  onGlobal,
}: {
  drill: Drill;
  workspaceFilter: WorkspaceFilterKey;
  onGlobal: () => void;
}) {
  const filterLabel =
    WORKSPACE_FILTERS.find((w) => w.key === workspaceFilter)?.label ?? "All Workspaces";
  return (
    <div className="flex flex-wrap items-center gap-1 text-xs text-white/50">
      <button type="button" className="hover:text-white" onClick={onGlobal}>
        Platform Analytics
      </button>
      <ChevronRight className="h-3 w-3" />
      <span className={drill.kind === "global" ? "text-white/80" : ""}>{filterLabel}</span>
      {drill.kind === "workspace" ? (
        <>
          <ChevronRight className="h-3 w-3" />
          <span className="text-white/80">{drill.workspaceLabel}</span>
        </>
      ) : null}
      {drill.kind === "module" ? (
        <>
          <ChevronRight className="h-3 w-3" />
          <span className="text-white/80">{drill.module.moduleLabel}</span>
        </>
      ) : null}
    </div>
  );
}

function GlobalView({
  summary,
  onOpenModule,
  onOpenWorkspace,
}: {
  summary: PlatformAnalyticsSummary;
  onOpenModule: (module: ModuleAdoptionRow) => void;
  onOpenWorkspace: (row: WorkspaceAdoptionRow) => void;
}) {
  return (
    <>
      <TqmsSection
        title="Most used modules"
        subtitle="Click a module to see every page and sub-module underneath."
      >
        <ModuleTable rows={summary.modulesMost} onOpen={onOpenModule} />
      </TqmsSection>

      <TqmsSection title="Least used modules" subtitle="Modules with the weakest adoption.">
        <ModuleTable rows={summary.modulesLeast} onOpen={onOpenModule} />
      </TqmsSection>

      <div className="grid gap-4 lg:grid-cols-2">
        <TqmsSection title="Most used pages" subtitle="Sub-modules and pages across the platform.">
          <PageTable rows={summary.pagesMost} />
        </TqmsSection>
        <TqmsSection title="Least used pages" subtitle="Including never-used eligible pages.">
          <PageTable rows={summary.pagesLeast} showNeverUsed />
        </TqmsSection>
      </div>

      <TqmsSection
        title="Never used pages"
        subtitle="Eligible navigation leaves with no adoption in this period."
      >
        <PageTable rows={summary.neverUsedPages} showNeverUsed empty="Every mapped page has some usage." />
      </TqmsSection>

      <TqmsSection
        title="Workspace comparison"
        subtitle="Click a workspace for overview, top/least pages, and EA usage."
      >
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-white/[0.04] text-xs uppercase tracking-wide text-white/45">
              <tr>
                <th className="px-3 py-2.5">Workspace</th>
                <th className="px-3 py-2.5">Adoption</th>
                <th className="px-3 py-2.5">Top pages</th>
                <th className="px-3 py-2.5">Least used pages</th>
                <th className="px-3 py-2.5">EA</th>
                <th className="px-3 py-2.5">Training</th>
              </tr>
            </thead>
            <tbody>
              {summary.workspaceComparison.map((row) => (
                <tr key={row.workspaceKey} className="border-t border-white/8 text-white/80">
                  <td className="px-3 py-2.5">
                    <button
                      type="button"
                      className="font-medium text-sky-200 hover:text-sky-100"
                      onClick={() => onOpenWorkspace(row)}
                    >
                      {row.workspaceLabel}
                    </button>
                  </td>
                  <td className="px-3 py-2.5">
                    <AdoptionBar value={row.adoptionScore} />
                  </td>
                  <td className="px-3 py-2.5">{row.topPages.join(" · ")}</td>
                  <td className="px-3 py-2.5 text-white/60">{row.leastPages.join(" · ")}</td>
                  <td className="px-3 py-2.5">
                    <ScorePill value={row.eaAdoption} />
                  </td>
                  <td className="px-3 py-2.5">
                    <ScorePill value={row.trainingAdoption} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TqmsSection>

      <EaSection summary={summary} />

      <TqmsSection title="Usage trend" subtitle="Adoption score across period buckets.">
        <MiniTable
          headers={["Bucket", "Adoption", "Active users"]}
          rows={summary.usageTrend.map((r) => [
            r.bucket,
            String(r.adoptionScore),
            String(r.activeUsers),
          ])}
          empty="No trend data yet."
        />
      </TqmsSection>

      <TqmsSection
        title="Feature opportunities"
        subtitle="Where to invest enablement and product effort."
      >
        <MiniTable
          headers={["Type", "Item", "Detail"]}
          rows={summary.featureOpportunities.map((r) => [
            OPPORTUNITY_LABELS[r.type],
            r.label,
            r.detail,
          ])}
          empty="Not enough telemetry yet to surface opportunities."
        />
      </TqmsSection>
    </>
  );
}

function ModuleDrillDown({
  module,
  onBack,
}: {
  module: ModuleAdoptionRow;
  onBack: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-semibold text-white">{module.moduleLabel}</h2>
          <p className="mt-1 text-sm text-white/50">
            Every navigation page under this module, with adoption for each.
          </p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-white/70 hover:bg-white/5"
        >
          Back to overview
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Kpi label="Module adoption" value={String(module.adoptionScore)} />
        <Kpi label="Pages used" value={`${module.pagesUsed} / ${module.pageCount}`} />
        <Kpi label="Users" value={String(module.users)} />
      </div>

      {module.sections.length > 0 ? (
        <TqmsSection title="Sections" subtitle="Sub-module groups inside this module.">
          <div className="space-y-4">
            {module.sections.map((section) => (
              <div key={section.sectionKey} className="rounded-xl border border-white/10 p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-white">{section.sectionLabel}</h3>
                  <ScorePill value={section.adoptionScore} />
                </div>
                <PageTable rows={section.pages} showNeverUsed showPath={false} />
              </div>
            ))}
          </div>
        </TqmsSection>
      ) : null}

      <TqmsSection title="All pages" subtitle={`${module.moduleLabel} navigation leaves.`}>
        <PageTable rows={module.pages} showNeverUsed showPath={false} />
      </TqmsSection>
    </div>
  );
}

function WorkspaceDrillDown({
  row,
  modules,
  pagesMost,
  pagesLeast,
  ea,
  onBack,
  onOpenModule,
}: {
  row: WorkspaceAdoptionRow;
  modules: ModuleAdoptionRow[];
  pagesMost: PageAdoptionRow[];
  pagesLeast: PageAdoptionRow[];
  ea: PlatformAnalyticsSummary["executiveAssistant"];
  onBack: () => void;
  onOpenModule: (module: ModuleAdoptionRow) => void;
}) {
  const eaRow = ea.byWorkspace.find((w) => w.workspaceKey === row.workspaceKey);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-semibold text-white">{row.workspaceLabel}</h2>
          <p className="mt-1 text-sm text-white/50">
            Workspace overview for the selected period (respects the workspace filter when set).
          </p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-white/70 hover:bg-white/5"
        >
          Back to overview
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Adoption" value={String(row.adoptionScore)} />
        <Kpi label="Users" value={String(row.users)} />
        <Kpi label="EA adoption" value={String(row.eaAdoption)} />
        <Kpi label="Training adoption" value={String(row.trainingAdoption)} />
      </div>

      <TqmsSection title="Top modules" subtitle="Click through for page-level detail.">
        <ModuleTable
          rows={modules.filter((m) => m.adoptionScore > 0).slice(0, 8)}
          onOpen={onOpenModule}
        />
      </TqmsSection>

      <div className="grid gap-4 lg:grid-cols-2">
        <TqmsSection title="Top pages">
          <PageTable rows={pagesMost.slice(0, 10)} />
        </TqmsSection>
        <TqmsSection title="Least used pages">
          <PageTable rows={pagesLeast.slice(0, 10)} showNeverUsed />
        </TqmsSection>
      </div>

      <TqmsSection title="Executive Assistant usage">
        <div className="grid gap-3 sm:grid-cols-3">
          <Kpi label="Conversations" value={String(eaRow?.conversations ?? 0)} />
          <Kpi label="Actions" value={String(eaRow?.actions ?? 0)} />
          <Kpi label="Users" value={String(eaRow?.users ?? 0)} />
        </div>
      </TqmsSection>
    </div>
  );
}

function EaSection({ summary }: { summary: PlatformAnalyticsSummary }) {
  const ea = summary.executiveAssistant;
  return (
    <TqmsSection
      title="Executive Assistant"
      subtitle="Conversations, users, workspaces, actions, and request categories."
    >
      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Conversations" value={String(ea.conversations)} />
        <Kpi label="Users" value={String(ea.users)} />
        <Kpi label="Workspaces" value={String(ea.workspacesActive)} />
        <Kpi label="Actions" value={String(ea.actions)} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <MiniTable
          headers={["Most used actions", "Count"]}
          rows={ea.mostUsedActions.map((r) => [r.actionName, String(r.count)])}
          empty="No EA actions recorded yet."
        />
        <MiniTable
          headers={["Request categories", "Share"]}
          rows={ea.topics.map((r) => [r.topic, `${r.sharePct}%`])}
          empty="No topic signals yet."
        />
      </div>
      <div className="mt-4 overflow-x-auto rounded-xl border border-white/10">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-white/[0.04] text-xs uppercase tracking-wide text-white/45">
            <tr>
              <th className="px-3 py-2.5">Workspace</th>
              <th className="px-3 py-2.5">Conversations</th>
              <th className="px-3 py-2.5">Users</th>
              <th className="px-3 py-2.5">Actions</th>
              <th className="px-3 py-2.5">Adoption</th>
            </tr>
          </thead>
          <tbody>
            {ea.byWorkspace.map((row) => (
              <tr key={row.workspaceKey} className="border-t border-white/8 text-white/80">
                <td className="px-3 py-2.5 font-medium text-white">{row.workspaceLabel}</td>
                <td className="px-3 py-2.5 tabular-nums">{row.conversations}</td>
                <td className="px-3 py-2.5 tabular-nums">{row.users}</td>
                <td className="px-3 py-2.5 tabular-nums">{row.actions}</td>
                <td className="px-3 py-2.5">
                  <ScorePill value={row.adoptionScore} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4">
        <MiniTable
          headers={["Trend bucket", "Conversations", "Actions"]}
          rows={ea.trend.map((r) => [r.bucket, String(r.conversations), String(r.actions)])}
          empty="No EA trend yet."
        />
      </div>
    </TqmsSection>
  );
}

function ModuleTable({
  rows,
  onOpen,
}: {
  rows: ModuleAdoptionRow[];
  onOpen: (module: ModuleAdoptionRow) => void;
}) {
  if (!rows.length) {
    return <Empty>No module adoption yet for this scope.</Empty>;
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-white/10">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-white/[0.04] text-xs uppercase tracking-wide text-white/45">
          <tr>
            <th className="px-3 py-2.5">Module</th>
            <th className="px-3 py-2.5">Adoption</th>
            <th className="px-3 py-2.5">Pages used</th>
            <th className="px-3 py-2.5">Top pages</th>
            <th className="px-3 py-2.5">Users</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.moduleKey} className="border-t border-white/8 text-white/80">
              <td className="px-3 py-2.5">
                <button
                  type="button"
                  className="font-medium text-sky-200 hover:text-sky-100"
                  onClick={() => onOpen(row)}
                >
                  {row.moduleLabel}
                </button>
              </td>
              <td className="px-3 py-2.5">
                <AdoptionBar value={row.adoptionScore} />
              </td>
              <td className="px-3 py-2.5 tabular-nums">
                {row.pagesUsed}/{row.pageCount}
              </td>
              <td className="px-3 py-2.5">{row.topPages.join(" · ") || "—"}</td>
              <td className="px-3 py-2.5 tabular-nums">{row.users}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PageTable({
  rows,
  showNeverUsed = false,
  showPath = true,
  empty = "No page data yet.",
}: {
  rows: PageAdoptionRow[];
  showNeverUsed?: boolean;
  showPath?: boolean;
  empty?: string;
}) {
  if (!rows.length) return <Empty>{empty}</Empty>;
  return (
    <div className="overflow-x-auto rounded-xl border border-white/10">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-white/[0.04] text-xs uppercase tracking-wide text-white/45">
          <tr>
            <th className="px-3 py-2.5">Page</th>
            {showPath ? <th className="px-3 py-2.5">Path</th> : null}
            <th className="px-3 py-2.5">Adoption</th>
            <th className="px-3 py-2.5">Reach</th>
            <th className="px-3 py-2.5">Users</th>
            {showNeverUsed ? <th className="px-3 py-2.5">Status</th> : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.moduleKey}-${row.pageKey}-${row.pageLabel}`} className="border-t border-white/8 text-white/80">
              <td className="px-3 py-2.5 font-medium text-white">{row.pageLabel}</td>
              {showPath ? (
                <td className="px-3 py-2.5 text-white/55">
                  {row.moduleLabel}
                  {row.sectionLabel ? ` / ${row.sectionLabel}` : ""}
                </td>
              ) : null}
              <td className="px-3 py-2.5">
                <AdoptionBar value={row.adoptionScore} />
              </td>
              <td className="px-3 py-2.5 tabular-nums">{row.reachPct}%</td>
              <td className="px-3 py-2.5 tabular-nums">{row.users}</td>
              {showNeverUsed ? (
                <td className="px-3 py-2.5">
                  {row.neverUsed ? (
                    <span className="text-xs text-amber-200">Never used</span>
                  ) : (
                    <span className="text-xs text-white/40">Active</span>
                  )}
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3">
      <p className="text-xs uppercase tracking-wide text-white/45">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums text-white">{value}</p>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed border-white/15 px-4 py-6 text-center text-sm text-white/45">
      {children}
    </p>
  );
}

function MiniTable({
  headers,
  rows,
  empty,
}: {
  headers: string[];
  rows: string[][];
  empty: string;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-white/10">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-white/[0.04] text-xs uppercase tracking-wide text-white/45">
          <tr>
            {headers.map((h) => (
              <th key={h} className="px-3 py-2.5">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr className="border-t border-white/8 text-white/55">
              <td className="px-3 py-6" colSpan={headers.length}>
                {empty}
              </td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr key={`${row[0]}-${index}`} className="border-t border-white/8 text-white/80">
                {row.map((cell, cellIndex) => (
                  <td
                    key={`${cellIndex}-${cell}`}
                    className={cn("px-3 py-2.5", cellIndex === 0 ? "font-medium text-white" : "")}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
