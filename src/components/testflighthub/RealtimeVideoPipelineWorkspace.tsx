"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import { WorkspaceStatusPill } from "@/components/workspace-ui/primitives";
import { formatLatencyMs } from "@/lib/realtime-video-pipeline/calculations";
import { computeStageTotals } from "@/lib/realtime-video-pipeline/calculations";
import {
  MEASUREMENT_STATUSES,
  PIPELINE_SECTIONS,
} from "@/lib/realtime-video-pipeline/constants";
import {
  createStageApi,
  deleteStageApi,
  duplicateStageApi,
  getScenarioApi,
  listScenariosApi,
  reorderStagesApi,
  toggleStageApi,
  updateStageApi,
} from "@/lib/realtime-video-pipeline/client-api";
import type {
  PipelineScenario,
  PipelineStage,
  ScenarioWithSummary,
} from "@/lib/realtime-video-pipeline/types";
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
  const [scenarios, setScenarios] = useState<PipelineScenario[]>([]);
  const [scenarioId, setScenarioId] = useState<string | null>(null);
  const [data, setData] = useState<ScenarioWithSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sectionFilter, setSectionFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [editorStage, setEditorStage] = useState<PipelineStage | null>(null);
  const [saving, setSaving] = useState(false);

  const loadScenarios = useCallback(async () => {
    const rows = await listScenariosApi();
    setScenarios(rows);
    if (!scenarioId && rows[0]) setScenarioId(rows[0].id);
  }, [scenarioId]);

  const loadScenario = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const row = await getScenarioApi(id);
      setData(row);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load pipeline.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadScenarios().catch((err) =>
      setError(err instanceof Error ? err.message : "Failed to load scenarios."),
    );
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

  async function handleSaveStage() {
    if (!editorStage || !scenarioId) return;
    setSaving(true);
    try {
      const updated = await updateStageApi(editorStage.id, editorStage);
      setData(updated);
      setEditorStage(null);
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

  const annotatedDisplay =
    summary?.aiAnnotatedLatencyMs != null
      ? `${formatLatencyMs(summary.aiAnnotatedLatencyMs)} ms`
      : "TBD";

  return (
    <div className="space-y-5 pb-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-300/80">
            Analytics · WOLF Engineering
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">
            Real-Time Video &amp; AI Pipeline
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-white/50">
            End-to-end latency model from drone camera capture through managed cloud video, AI
            inference, WOLF backend, and Chrome overlay rendering.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-white/45">Scenario</label>
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
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      {loading || !data || !summary ? (
        <div className="flex min-h-[16rem] items-center justify-center text-white/50">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading pipeline model…
        </div>
      ) : (
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

            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="min-w-[1100px] w-full text-left text-sm">
                <thead className="bg-white/[0.04] text-xs uppercase tracking-wide text-white/45">
                  <tr>
                    <th className="px-3 py-2">#</th>
                    <th className="px-3 py-2">Section</th>
                    <th className="px-3 py-2">Component</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2 text-right">Proc</th>
                    <th className="px-3 py-2 text-right">Tx</th>
                    <th className="px-3 py-2 text-right">Buf</th>
                    <th className="px-3 py-2 text-right">Queue</th>
                    <th className="px-3 py-2 text-right">AI</th>
                    <th className="px-3 py-2 text-right">Total</th>
                    <th className="px-3 py-2">On</th>
                    <th className="px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/8">
                  {filteredStages.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="px-3 py-8">
                        <WsEmpty message="No stages match filters" />
                      </td>
                    </tr>
                  ) : (
                    filteredStages.map((stage) => {
                      const totals = computeStageTotals(stage);
                      return (
                        <tr
                          key={stage.id}
                          className={cn(
                            "hover:bg-white/[0.03]",
                            !stage.enabled && "opacity-45",
                          )}
                        >
                          <td className="px-3 py-2 font-mono text-white/70">{stage.stageNumber}</td>
                          <td className="px-3 py-2 text-white/60">{stage.pipelineSection}</td>
                          <td className="px-3 py-2">
                            <button
                              type="button"
                              className="text-left font-medium text-white hover:text-sky-200"
                              onClick={() => setEditorStage(stage)}
                            >
                              {stage.component}
                            </button>
                          </td>
                          <td className="px-3 py-2">
                            <span
                              className={cn(
                                "inline-flex rounded-full border px-2 py-0.5 text-[11px]",
                                statusTone(stage.measurementStatus),
                              )}
                            >
                              {stage.measurementStatus}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-right font-mono">{latencyCell(stage.processingMs)}</td>
                          <td className="px-3 py-2 text-right font-mono">{latencyCell(stage.transmissionMs)}</td>
                          <td className="px-3 py-2 text-right font-mono">{latencyCell(stage.bufferMs)}</td>
                          <td className="px-3 py-2 text-right font-mono">{latencyCell(stage.queueMs)}</td>
                          <td className="px-3 py-2 text-right font-mono">{latencyCell(stage.aiInferenceMs)}</td>
                          <td className="px-3 py-2 text-right font-mono font-semibold text-white">
                            {latencyCell(totals.totalMs)}
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="checkbox"
                              checked={stage.enabled}
                              onChange={(e) =>
                                void toggleStageApi(stage.id, e.target.checked).then(setData)
                              }
                            />
                          </td>
                          <td className="px-3 py-2">
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
          </WsSection>
        </>
      )}

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
