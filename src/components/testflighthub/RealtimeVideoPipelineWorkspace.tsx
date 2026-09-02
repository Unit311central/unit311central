"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  Copy,
  Loader2,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

import {
  WsEmpty,
  WsInputClass,
  WsPrimaryButtonClass,
  WsSecondaryButtonClass,
  WsSection,
  WsSlideOver,
} from "@/components/testflighthub/domain-workspace-ui";
import { ArchitectureOptionsTab } from "@/components/testflighthub/realtime-video-workbench/ArchitectureOptionsTab";
import { ArchitecturesTab } from "@/components/testflighthub/realtime-video-workbench/ArchitecturesTab";
import { AssumptionsTab } from "@/components/testflighthub/realtime-video-workbench/AssumptionsTab";
import { CostCalculatorTab } from "@/components/testflighthub/realtime-video-workbench/CostCalculatorTab";
import { FailureResilienceTab } from "@/components/testflighthub/realtime-video-workbench/FailureResilienceTab";
import { FlightScenariosTab } from "@/components/testflighthub/realtime-video-workbench/FlightScenariosTab";
import { LatencySuccessTab } from "@/components/testflighthub/realtime-video-workbench/LatencySuccessTab";
import { MissionProfilesTab } from "@/components/testflighthub/realtime-video-workbench/MissionProfilesTab";
import { OverviewTab } from "@/components/testflighthub/realtime-video-workbench/OverviewTab";
import {
  LatencyCategoryGuide,
  MilestoneLatencyGuide,
} from "@/components/testflighthub/realtime-video-workbench/PipelineLatencyGuide";
import { StageTechnicalEditor } from "@/components/testflighthub/realtime-video-workbench/StageTechnicalEditor";
import { TestRunsTab } from "@/components/testflighthub/realtime-video-workbench/TestRunsTab";
import { VideoBandwidthTab } from "@/components/testflighthub/realtime-video-workbench/VideoBandwidthTab";
import type { WorkbenchTabId } from "@/components/testflighthub/realtime-video-workbench/shared";
import { WorkspaceStatusPill } from "@/components/workspace-ui/primitives";
import {
  DEFAULT_REALTIME_VIDEO_WORKBENCH_TAB_SLUG,
  isRealtimeVideoWorkbenchTabSlug,
  resolveWorkbenchTabIdFromSlug,
  workbenchTabSlug,
} from "@/lib/realtime-video-workbench-nav";
import { formatLatencyMs } from "@/lib/realtime-video-pipeline/calculations";
import { computeStageTotals } from "@/lib/realtime-video-pipeline/calculations";
import {
  MEASUREMENT_STATUSES,
  PIPELINE_SECTIONS,
} from "@/lib/realtime-video-pipeline/constants";
import {
  createStageApi,
  createScenarioApi,
  deleteStageApi,
  duplicateScenarioApi,
  duplicateStageApi,
  getScenarioApi,
  getWorkbenchApi,
  listScenariosApi,
  reorderStagesApi,
  toggleStageApi,
  updateStageApi,
  updateWorkbenchApi,
} from "@/lib/realtime-video-pipeline/client-api";
import type {
  PipelineScenario,
  PipelineStage,
  ScenarioWithSummary,
} from "@/lib/realtime-video-pipeline/types";
import {
  resolveStageLocation,
  resolveStageProvider,
} from "@/lib/realtime-video-pipeline/stage-terminology-sync";
import type { WorkbenchModel } from "@/lib/realtime-video-pipeline/workbench-types";
import { cn } from "@/lib/utils";

function statusTone(status: string) {
  if (status === "Measured") return "border-emerald-400/30 bg-emerald-500/15 text-emerald-100";
  if (status === "Calculated") return "border-sky-400/30 bg-sky-500/15 text-sky-100";
  if (status === "Manufacturer Specification") return "border-violet-400/30 bg-violet-500/15 text-violet-100";
  if (status === "Engineering Estimate" || status === "Assumed")
    return "border-amber-400/30 bg-amber-500/15 text-amber-100";
  return "border-white/10 bg-white/5 text-slate-300";
}

function latencyCell(value: number | null) {
  return value == null ? "TBD" : formatLatencyMs(value);
}

const SECTION_VISUAL_ORDER = [
  "Drone",
  "RF Transmission",
  "HQ Ground Station",
  "HQ Network",
  "Internet",
  "Cloud Video Ingest",
  "Cloud Media Processing",
  "AI Infrastructure",
  "AI Detection",
  "AI Identification",
  "WOLF Backend",
  "Database",
  "Browser Delivery",
  "Browser",
] as const;

export default function RealtimeVideoPipelineWorkspace() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTab = useMemo(
    () => resolveWorkbenchTabIdFromSlug(searchParams.get("tab")),
    [searchParams],
  );

  const [scenarios, setScenarios] = useState<PipelineScenario[]>([]);
  const [scenarioId, setScenarioId] = useState<string | null>(null);
  const [data, setData] = useState<ScenarioWithSummary | null>(null);
  const [workbench, setWorkbench] = useState<WorkbenchModel | null>(null);
  const [compareId, setCompareId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [workbenchSaving, setWorkbenchSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sectionFilter, setSectionFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [editorStage, setEditorStage] = useState<PipelineStage | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (searchParams.get("view") !== "realtime-video-pipeline") return;
    const tab = searchParams.get("tab");
    if (tab && isRealtimeVideoWorkbenchTabSlug(tab)) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", DEFAULT_REALTIME_VIDEO_WORKBENCH_TAB_SLUG);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [pathname, router, searchParams]);

  function navigateToTab(tabId: WorkbenchTabId) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", "realtime-video-pipeline");
    params.set("tab", workbenchTabSlug(tabId));
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  const loadScenarios = useCallback(async () => {
    const rows = await listScenariosApi();
    setScenarios(rows);
    const flight = rows.find((s) => s.scenarioKind === "flight") ?? rows[0];
    if (!scenarioId && flight) {
      setScenarioId(flight.id);
    } else if (!flight) {
      setLoading(false);
      setWorkbench(null);
      setData(null);
    }
  }, [scenarioId]);

  const loadWorkbench = useCallback(async (id: string) => {
    const { model } = await getWorkbenchApi(id);
    setWorkbench(model);
    const pipelineId =
      model.pipelineScenario?.id ??
      model.flightScenario.pipelineScenarioId ??
      (model.flightScenario.scenarioKind === "pipeline" ? model.flightScenario.id : null);
    if (pipelineId) {
      const row = await getScenarioApi(pipelineId);
      setData(row);
    } else {
      setData(null);
    }
  }, []);

  const loadScenario = useCallback(
    async (id: string) => {
      setLoading(true);
      setError(null);
      try {
        await loadWorkbench(id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load workbench.");
      } finally {
        setLoading(false);
      }
    },
    [loadWorkbench],
  );

  useEffect(() => {
    void loadScenarios().catch((err) => {
      setLoading(false);
      setError(err instanceof Error ? err.message : "Failed to load scenarios.");
    });
  }, [loadScenarios]);

  useEffect(() => {
    if (scenarioId) void loadScenario(scenarioId);
  }, [loadScenario, scenarioId]);

  const filteredStages = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    return data.stages.filter((stage) => {
      if (sectionFilter !== "All" && stage.pipelineSection !== sectionFilter) return false;
      if (statusFilter !== "All" && stage.measurementStatus !== statusFilter) return false;
      if (!q) return true;
      return (
        stage.component.toLowerCase().includes(q) ||
        stage.whatHappens.toLowerCase().includes(q) ||
        stage.pipelineSection.toLowerCase().includes(q)
      );
    });
  }, [data, search, sectionFilter, statusFilter]);

  const summary = data?.summary;

  async function refresh(id: string) {
    await loadScenario(id);
  }

  async function handleSaveWorkbench(config: WorkbenchModel["config"]) {
    if (!scenarioId) return;
    setWorkbenchSaving(true);
    try {
      const { model } = await updateWorkbenchApi(scenarioId, config);
      setWorkbench(model);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setWorkbenchSaving(false);
    }
  }

  async function handleDuplicateScenario() {
    if (!scenarioId || !workbench) return;
    const name = window.prompt("New scenario name", `${workbench.flightScenario.name} (copy)`);
    if (!name?.trim()) return;
    try {
      const { scenario, model } = await duplicateScenarioApi(scenarioId, name.trim());
      await loadScenarios();
      setScenarioId(scenario.id);
      setWorkbench(model);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Duplicate failed.");
    }
  }

  function jumpToStage(stageId: string) {
    navigateToTab("pipeline");
    const stage = data?.stages.find((s) => s.id === stageId);
    if (stage) setEditorStage(stage);
  }

  async function handleSaveStage() {
    if (!editorStage || !scenarioId) return;
    setSaving(true);
    try {
      const updated = await updateStageApi(editorStage.id, editorStage);
      setData(updated);
      setEditorStage(null);
      if (scenarioId) await loadWorkbench(scenarioId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddStage() {
    if (!scenarioId) return;
    try {
      const updated = await createStageApi(scenarioId, {
        pipelineSection: "Drone",
        component: "New stage",
        whatHappens: "",
        detailedDescription: "",
      });
      setData(updated);
      const last = updated.stages[updated.stages.length - 1];
      if (last) setEditorStage(last);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Add failed.");
    }
  }

  async function handleDelete(stage: PipelineStage) {
    if (!window.confirm(`Delete stage "${stage.component}"?`)) return;
    try {
      const updated = await deleteStageApi(stage.id, stage.scenarioId);
      setData(updated);
      if (editorStage?.id === stage.id) setEditorStage(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    }
  }

  async function handleDuplicate(stage: PipelineStage) {
    try {
      const updated = await duplicateStageApi(stage.id);
      setData(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Duplicate failed.");
    }
  }

  async function handleMove(stage: PipelineStage, direction: -1 | 1) {
    if (!data) return;
    const ordered = [...data.stages].sort((a, b) => a.stageOrder - b.stageOrder);
    const idx = ordered.findIndex((s) => s.id === stage.id);
    const target = idx + direction;
    if (target < 0 || target >= ordered.length) return;
    const swapped = [...ordered];
    [swapped[idx], swapped[target]] = [swapped[target]!, swapped[idx]!];
    try {
      const updated = await reorderStagesApi(
        stage.scenarioId,
        swapped.map((s) => s.id),
      );
      setData(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reorder failed.");
    }
  }

  async function handleCreateFirstScenario() {
    setError(null);
    setLoading(true);
    try {
      const scenario = await createScenarioApi("WOLF flight scenario", "WOLF Central pipeline");
      await loadScenarios();
      setScenarioId(scenario.id);
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : "Failed to create scenario.");
    }
  }

  const annotatedDisplay =
    summary?.aiAnnotatedLatencyMs != null
      ? `${formatLatencyMs(summary.aiAnnotatedLatencyMs)} ms`
      : "TBD";

  return (
    <div className="space-y-5 pb-10">
      {scenarios.length > 0 ? (
      <div className="flex flex-wrap items-center justify-end gap-2">
        <label className="text-xs text-white/45">Flight scenario</label>
        <select
          className={cn(WsInputClass(), "min-w-[18rem]")}
          value={scenarioId ?? ""}
          onChange={(e) => setScenarioId(e.target.value)}
        >
          {scenarios.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <button type="button" className={WsSecondaryButtonClass()} onClick={() => void handleDuplicateScenario()}>
          Duplicate version
        </button>
      </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      {!loading && scenarios.length === 0 ? (
        <WsSection
          title="No pipeline scenarios yet"
          subtitle="Create a flight scenario to model latency, bandwidth, and architecture options."
        >
          <div className="flex flex-col items-center justify-center gap-4 py-10 text-center">
            <p className="max-w-md text-sm text-white/55">
              WOLF Central starts with an empty pipeline. Add your first scenario to use the
              Real-Time Video & AI workbench.
            </p>
            <button
              type="button"
              className={WsPrimaryButtonClass()}
              onClick={() => void handleCreateFirstScenario()}
            >
              Create first scenario
            </button>
          </div>
        </WsSection>
      ) : null}

      {loading && scenarios.length > 0 ? (
        <div className="flex min-h-[16rem] items-center justify-center text-white/50">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading workbench…
        </div>
      ) : null}

      {!loading && workbench && activeTab === "overview" ? (
        <OverviewTab model={workbench} />
      ) : null}
      {!loading && workbench && activeTab === "flight" ? (
        <FlightScenariosTab
          model={workbench}
          saving={workbenchSaving}
          onSave={handleSaveWorkbench}
        />
      ) : null}
      {!loading && workbench && activeTab === "missions" ? (
        <MissionProfilesTab
          model={workbench}
          saving={workbenchSaving}
          onSave={handleSaveWorkbench}
        />
      ) : null}
      {!loading && workbench && activeTab === "video" ? (
        <VideoBandwidthTab
          model={workbench}
          saving={workbenchSaving}
          onSave={handleSaveWorkbench}
        />
      ) : null}
      {!loading && workbench && activeTab === "cost" ? (
        <CostCalculatorTab model={workbench} />
      ) : null}
      {!loading && workbench && activeTab === "latency" ? (
        <LatencySuccessTab
          model={workbench}
          saving={workbenchSaving}
          onSave={handleSaveWorkbench}
          onJumpToStage={jumpToStage}
        />
      ) : null}
      {!loading && workbench && activeTab === "architectures" ? (
        <ArchitecturesTab model={workbench} />
      ) : null}
      {!loading && workbench && activeTab === "assumptions" ? (
        <AssumptionsTab model={workbench} />
      ) : null}
      {!loading && activeTab === "test-runs" ? <TestRunsTab /> : null}
      {!loading && data && activeTab === "failure" ? (
        <FailureResilienceTab stages={data.stages} onSelectStage={jumpToStage} />
      ) : null}
      {!loading && workbench && activeTab === "architecture-options" ? (
        <ArchitectureOptionsTab
          model={workbench}
          scenarios={scenarios.map((s) => ({ id: s.id, name: s.name }))}
          compareId={compareId}
          onCompareIdChange={setCompareId}
        />
      ) : null}

      {!loading && activeTab === "pipeline" && data && summary ? (
        <>
          <WsSection
            title="AI-Annotated End-to-End Latency"
            subtitle="Drone camera capture → AI identification → annotated result visible in Chrome"
          >
            <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
              <div className="rounded-2xl border border-sky-400/25 bg-sky-500/10 p-6 text-center">
                <p className="text-xs uppercase tracking-widest text-sky-200/70">Primary metric</p>
                <p className="mt-2 text-5xl font-semibold tabular-nums text-white">{annotatedDisplay}</p>
                {summary.aiAnnotatedLatencyMs == null ? (
                  <p className="mt-3 text-sm text-amber-200/90">
                    COMPLETE LATENCY: TBD · KNOWN MINIMUM: {formatLatencyMs(summary.knownMinimumMs)} ms
                    · TBD STAGES: {summary.tbdStageCount}
                  </p>
                ) : null}
              </div>
              <div className="overflow-x-auto rounded-xl border border-white/10">
                <table className="min-w-full text-sm">
                  <tbody className="divide-y divide-white/8">
                    {[
                      ["Raw video latency", summary.rawVideoLatencyMs],
                      ["AI detection latency", summary.aiDetectionLatencyMs],
                      ["AI identification latency", summary.aiIdentificationLatencyMs],
                      ["AI annotated video latency", summary.aiAnnotatedLatencyMs],
                      ["Total processing latency", summary.totalProcessingMs],
                      ["Total transmission latency", summary.totalTransmissionMs],
                      ["Total buffering latency", summary.totalBufferMs],
                      ["Total queue latency", summary.totalQueueMs],
                    ].map(([label, value]) => (
                      <tr key={String(label)}>
                        <td className="px-4 py-2 text-white/60">{label}</td>
                        <td className="px-4 py-2 text-right font-mono text-white">
                          {value == null ? "TBD" : `${formatLatencyMs(value as number)} ms`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <WorkspaceStatusPill>{`${summary.stageCount} stages`}</WorkspaceStatusPill>
              <WorkspaceStatusPill>{`${summary.measuredStages} measured`}</WorkspaceStatusPill>
              <WorkspaceStatusPill>{`${summary.manufacturerStages} manufacturer spec`}</WorkspaceStatusPill>
              <WorkspaceStatusPill>{`${summary.calculatedStages} calculated`}</WorkspaceStatusPill>
              <WorkspaceStatusPill>{`${summary.estimatedStages} estimated`}</WorkspaceStatusPill>
              <WorkspaceStatusPill>{`${summary.assumedStages} assumed`}</WorkspaceStatusPill>
              <WorkspaceStatusPill>{`${summary.tbdStages} TBD`}</WorkspaceStatusPill>
            </div>
          </WsSection>

          <WsSection title="Pipeline architecture" subtitle="Parallel AI and human viewing paths">
            <div className="grid gap-3 text-center text-[11px] font-medium uppercase tracking-wide text-white/55 md:grid-cols-7">
              {["Drone", "RF", "HQ", "Internet", "Video ingest", "Media", "Branch"].map((label) => (
                <div key={label} className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-3">
                  {label}
                </div>
              ))}
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/5 p-4 text-sm text-white/70">
                <p className="font-semibold text-emerald-200">Human viewing path</p>
                <p className="mt-2 font-mono text-xs leading-relaxed">
                  Video ingest → Media distribution → WebRTC gateway → Chrome decode → render
                </p>
              </div>
              <div className="rounded-xl border border-violet-400/20 bg-violet-500/5 p-4 text-sm text-white/70">
                <p className="font-semibold text-violet-200">AI overlay path</p>
                <p className="mt-2 font-mono text-xs leading-relaxed">
                  AI input → GPU inference → Detector → Tracker → Re-ID → WOLF realtime → overlay
                </p>
              </div>
            </div>
            <p className="mt-3 text-xs text-white/40">
              Vercel hosts the WOLF Next.js application/API only — live video uses managed media
              infrastructure; AI uses managed GPU infrastructure; Supabase carries metadata/events.
            </p>
          </WsSection>

          <WsSection title="Latency breakdown by section">
            <div className="mb-4">
              <p className="mb-2 text-xs text-white/45">Latency category definitions</p>
              <LatencyCategoryGuide compact />
            </div>
            <div className="mb-4">
              <p className="mb-2 text-xs text-white/45">Milestone latency definitions</p>
              <MilestoneLatencyGuide />
            </div>
            <div className="space-y-2">
              {SECTION_VISUAL_ORDER.map((section) => {
                const row = summary.sectionBreakdown.find((r) => r.section === section);
                const display = row?.totalMs ?? row?.knownMinimumMs ?? 0;
                const label =
                  row?.totalMs != null
                    ? `${formatLatencyMs(row.totalMs)} ms`
                    : row && row.knownMinimumMs > 0
                      ? `≥${formatLatencyMs(row.knownMinimumMs)} ms (partial)`
                      : "TBD";
                return (
                  <div key={section} className="grid grid-cols-[10rem_1fr_5rem] items-center gap-3 text-sm">
                    <span className="truncate text-white/65">{section}</span>
                    <div className="h-2 rounded-full bg-white/10">
                      <div
                        className="h-2 rounded-full bg-sky-400/80"
                        style={{ width: `${Math.min(100, Math.max(display > 0 ? 8 : 0, display / 5))}%` }}
                      />
                    </div>
                    <span className="text-right font-mono text-white/80">{label}</span>
                  </div>
                );
              })}
            </div>
          </WsSection>

          <WsSection title="Pipeline stages" subtitle={`${filteredStages.length} visible · full CRUD`}>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <div className="relative min-w-[14rem] flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                <input
                  className={cn(WsInputClass(), "pl-9")}
                  placeholder="Search component, section…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <select
                className={WsInputClass()}
                value={sectionFilter}
                onChange={(e) => setSectionFilter(e.target.value)}
              >
                <option value="All">All sections</option>
                {PIPELINE_SECTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <select
                className={WsInputClass()}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All statuses</option>
                {MEASUREMENT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <button type="button" className={WsPrimaryButtonClass()} onClick={() => void handleAddStage()}>
                <Plus className="mr-1 inline h-4 w-4" /> Add stage
              </button>
            </div>

            <div className="relative overflow-x-auto rounded-xl border border-white/10">
              <table className="min-w-[1680px] w-full border-separate border-spacing-0 text-left text-sm">
                <thead className="bg-[#0c1220] text-xs uppercase tracking-wide text-white/45">
                  <tr>
                    <th className="sticky left-0 z-20 min-w-[2.5rem] border-b border-white/10 bg-[#0c1220] px-3 py-2">
                      #
                    </th>
                    <th className="sticky left-[2.5rem] z-20 min-w-[8.5rem] border-b border-white/10 bg-[#0c1220] px-3 py-2 shadow-[4px_0_12px_rgba(0,0,0,0.35)]">
                      Section
                    </th>
                    <th className="sticky left-[11rem] z-20 min-w-[14rem] border-b border-white/10 bg-[#0c1220] px-3 py-2 shadow-[4px_0_12px_rgba(0,0,0,0.35)]">
                      Component
                    </th>
                    <th className="min-w-[9rem] border-b border-white/10 px-3 py-2">Location</th>
                    <th className="min-w-[10rem] border-b border-white/10 px-3 py-2">Provider</th>
                    <th className="min-w-[6rem] border-b border-white/10 px-3 py-2">Status</th>
                    <th className="min-w-[4.5rem] border-b border-white/10 px-3 py-2 text-right">Proc</th>
                    <th className="min-w-[4.5rem] border-b border-white/10 px-3 py-2 text-right">Tx</th>
                    <th className="min-w-[4.5rem] border-b border-white/10 px-3 py-2 text-right">Buf</th>
                    <th className="min-w-[4.5rem] border-b border-white/10 px-3 py-2 text-right">Queue</th>
                    <th className="min-w-[4.5rem] border-b border-white/10 px-3 py-2 text-right">AI</th>
                    <th className="min-w-[5rem] border-b border-white/10 px-3 py-2 text-right">Total</th>
                    <th className="min-w-[3rem] border-b border-white/10 px-3 py-2">On</th>
                    <th className="min-w-[8rem] border-b border-white/10 px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/8 bg-[#080d18]">
                  {filteredStages.length === 0 ? (
                    <tr>
                      <td colSpan={14} className="px-3 py-8">
                        <WsEmpty message="No stages match filters" />
                      </td>
                    </tr>
                  ) : (
                    filteredStages.map((stage) => {
                      const totals = computeStageTotals(stage);
                      const rowBg = !stage.enabled ? "bg-[#080d18]/60" : "bg-[#080d18]";
                      return (
                        <tr
                          key={stage.id}
                          className={cn("hover:bg-white/[0.03]", !stage.enabled && "opacity-45")}
                        >
                          <td
                            className={cn(
                              "sticky left-0 z-10 border-b border-white/5 px-3 py-2 font-mono text-white/70",
                              rowBg,
                            )}
                          >
                            {stage.stageNumber}
                          </td>
                          <td
                            className={cn(
                              "sticky left-[2.5rem] z-10 border-b border-white/5 px-3 py-2 text-white/60",
                              rowBg,
                            )}
                          >
                            {stage.pipelineSection}
                          </td>
                          <td
                            className={cn(
                              "sticky left-[11rem] z-10 border-b border-white/5 px-3 py-2 shadow-[4px_0_12px_rgba(0,0,0,0.25)]",
                              rowBg,
                            )}
                          >
                            <button
                              type="button"
                              className="max-w-[18rem] text-left font-medium text-white hover:text-sky-200"
                              onClick={() => setEditorStage(stage)}
                            >
                              {stage.component}
                            </button>
                            <p className="mt-0.5 line-clamp-2 max-w-[18rem] text-[11px] text-white/40">
                              {stage.whatHappens}
                            </p>
                          </td>
                          <td className="border-b border-white/5 px-3 py-2 text-xs text-white/55">
                            {resolveStageLocation(stage)}
                          </td>
                          <td className="border-b border-white/5 px-3 py-2 text-xs text-white/55">
                            {resolveStageProvider(stage)}
                          </td>
                          <td className="border-b border-white/5 px-3 py-2">
                            <span
                              className={cn(
                                "inline-flex rounded-full border px-2 py-0.5 text-[11px]",
                                statusTone(stage.measurementStatus),
                              )}
                            >
                              {stage.measurementStatus}
                            </span>
                          </td>
                          <td className="border-b border-white/5 px-3 py-2 text-right font-mono">
                            {latencyCell(stage.processingMs)}
                          </td>
                          <td className="border-b border-white/5 px-3 py-2 text-right font-mono">
                            {latencyCell(stage.transmissionMs)}
                          </td>
                          <td className="border-b border-white/5 px-3 py-2 text-right font-mono">
                            {latencyCell(stage.bufferMs)}
                          </td>
                          <td className="border-b border-white/5 px-3 py-2 text-right font-mono">
                            {latencyCell(stage.queueMs)}
                          </td>
                          <td className="border-b border-white/5 px-3 py-2 text-right font-mono">
                            {latencyCell(stage.aiInferenceMs)}
                          </td>
                          <td className="border-b border-white/5 px-3 py-2 text-right font-mono font-semibold text-white">
                            {latencyCell(totals.totalMs)}
                          </td>
                          <td className="border-b border-white/5 px-3 py-2">
                            <input
                              type="checkbox"
                              checked={stage.enabled}
                              onChange={(e) =>
                                void toggleStageApi(stage.id, e.target.checked).then(setData)
                              }
                            />
                          </td>
                          <td className="border-b border-white/5 px-3 py-2">
                            <div className="flex items-center gap-1">
                              <button type="button" className={WsSecondaryButtonClass()} onClick={() => void handleMove(stage, -1)} aria-label="Move up">
                                <ArrowUp className="h-3.5 w-3.5" />
                              </button>
                              <button type="button" className={WsSecondaryButtonClass()} onClick={() => void handleMove(stage, 1)} aria-label="Move down">
                                <ArrowDown className="h-3.5 w-3.5" />
                              </button>
                              <button type="button" className={WsSecondaryButtonClass()} onClick={() => void handleDuplicate(stage)} aria-label="Duplicate">
                                <Copy className="h-3.5 w-3.5" />
                              </button>
                              <button type="button" className={WsSecondaryButtonClass()} onClick={() => void handleDelete(stage)} aria-label="Delete">
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs text-white/40">
              Scroll horizontally for latency columns — stage number, section, and component remain
              fixed while reviewing engineering data.
            </p>
          </WsSection>
        </>
      ) : null}

      {editorStage ? (
      <WsSlideOver
        onClose={() => setEditorStage(null)}
        title={`Edit · ${editorStage.component}`}
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" className={WsSecondaryButtonClass()} onClick={() => setEditorStage(null)}>
              Cancel
            </button>
            <button
              type="button"
              className={WsPrimaryButtonClass(saving)}
              disabled={saving}
              onClick={() => void handleSaveStage()}
            >
              {saving ? "Saving…" : "Save stage"}
            </button>
          </div>
        }
      >
        {editorStage ? (
          <div className="space-y-4 text-sm">
            <label className="block space-y-1">
              <span className="text-white/50">Pipeline section</span>
              <select
                className={WsInputClass()}
                value={editorStage.pipelineSection}
                onChange={(e) =>
                  setEditorStage({
                    ...editorStage,
                    pipelineSection: e.target.value as PipelineStage["pipelineSection"],
                  })
                }
              >
                {PIPELINE_SECTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1">
              <span className="text-white/50">Component</span>
              <input
                className={WsInputClass()}
                value={editorStage.component}
                onChange={(e) => setEditorStage({ ...editorStage, component: e.target.value })}
              />
            </label>
            <label className="block space-y-1">
              <span className="text-white/50">What happens</span>
              <textarea
                className={cn(WsInputClass(), "min-h-[4rem]")}
                value={editorStage.whatHappens}
                onChange={(e) => setEditorStage({ ...editorStage, whatHappens: e.target.value })}
              />
            </label>
            <label className="block space-y-1">
              <span className="text-white/50">Detailed description</span>
              <textarea
                className={cn(WsInputClass(), "min-h-[8rem] font-mono text-xs")}
                value={editorStage.detailedDescription}
                onChange={(e) =>
                  setEditorStage({ ...editorStage, detailedDescription: e.target.value })
                }
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  ["processingMs", "Processing ms"],
                  ["transmissionMs", "Transmission ms"],
                  ["bufferMs", "Buffer ms"],
                  ["queueMs", "Queue ms"],
                  ["aiInferenceMs", "AI inference ms"],
                  ["processingMinMs", "Min processing ms"],
                  ["processingTypicalMs", "Typical processing ms"],
                  ["processingMaxMs", "Max processing ms"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="block space-y-1">
                  <span className="text-white/50">{label}</span>
                  <input
                    className={WsInputClass()}
                    value={editorStage[key] ?? ""}
                    onChange={(e) =>
                      setEditorStage({
                        ...editorStage,
                        [key]: e.target.value === "" ? null : Number(e.target.value),
                      })
                    }
                  />
                </label>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1">
                <span className="text-white/50">Measurement status</span>
                <select
                  className={WsInputClass()}
                  value={editorStage.measurementStatus}
                  onChange={(e) =>
                    setEditorStage({
                      ...editorStage,
                      measurementStatus: e.target.value as PipelineStage["measurementStatus"],
                    })
                  }
                >
                  {MEASUREMENT_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-1">
                <span className="text-white/50">Confidence</span>
                <select
                  className={WsInputClass()}
                  value={editorStage.confidence}
                  onChange={(e) =>
                    setEditorStage({
                      ...editorStage,
                      confidence: e.target.value as PipelineStage["confidence"],
                    })
                  }
                >
                  {["High", "Medium", "Low", "Unknown"].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <StageTechnicalEditor stage={editorStage} onChange={setEditorStage} />
            <label className="block space-y-1">
              <span className="text-white/50">Source / evidence</span>
              <input
                className={WsInputClass()}
                value={editorStage.source}
                onChange={(e) => setEditorStage({ ...editorStage, source: e.target.value })}
              />
            </label>
            <label className="block space-y-1">
              <span className="text-white/50">Source URL</span>
              <input
                className={WsInputClass()}
                value={editorStage.sourceUrl ?? ""}
                onChange={(e) =>
                  setEditorStage({ ...editorStage, sourceUrl: e.target.value || null })
                }
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1">
                <span className="text-white/50">Path kind</span>
                <select
                  className={WsInputClass()}
                  value={editorStage.pathKind ?? ""}
                  onChange={(e) =>
                    setEditorStage({
                      ...editorStage,
                      pathKind: (e.target.value || null) as PipelineStage["pathKind"],
                    })
                  }
                >
                  <option value="">—</option>
                  {["shared", "video", "ai", "overlay", "control", "metadata"].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-1">
                <span className="text-white/50">Milestone</span>
                <select
                  className={WsInputClass()}
                  value={editorStage.milestone ?? ""}
                  onChange={(e) =>
                    setEditorStage({
                      ...editorStage,
                      milestone: (e.target.value || null) as PipelineStage["milestone"],
                    })
                  }
                >
                  <option value="">—</option>
                  {[
                    "capture",
                    "raw_video_visible",
                    "ai_detection",
                    "ai_identification",
                    "ai_annotated",
                    "operator_visible",
                  ].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={editorStage.parallel}
                onChange={(e) => setEditorStage({ ...editorStage, parallel: e.target.checked })}
              />
              <span className="text-white/60">Parallel branch stage</span>
            </label>
          </div>
        ) : null}
      </WsSlideOver>
      ) : null}
    </div>
  );
}
