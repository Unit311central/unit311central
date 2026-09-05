"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronRight,
  ExternalLink,
  Loader2,
  Network,
} from "lucide-react";

import ArchitectureViewer from "@/components/architecture/ArchitectureViewer";
import type {
  ModelTestingEvidenceImage,
  ModelTestingOutcome,
  WolfBenchmarkVideoRecord,
  WolfModelTestingArchPayload,
  WolfModelTestingRecord,
} from "@/lib/wolf/wolf-model-testing-arch-types";
import { cn } from "@/lib/utils";

const MISSION_1_ARCHITECTURE_TITLE = "Mission 1 Model Testing Architecture";
const MISSION_1_MODEL_SUMMARY_TITLE = "Mission 1 - Animal Counting - Living Model Testing Summary";

const API_PATH = "/api/information-repository/model-testing-arch";

const OUTCOME_STYLES: Record<ModelTestingOutcome, string> = {
  ACCEPTED: "border-emerald-400/40 bg-emerald-500/15 text-emerald-100",
  REJECTED: "border-red-400/40 bg-red-500/15 text-red-100",
  TESTED: "border-sky-400/40 bg-sky-500/15 text-sky-100",
  PENDING: "border-amber-400/40 bg-amber-500/15 text-amber-100",
  LICENCE_REVIEW: "border-violet-400/40 bg-violet-500/15 text-violet-100",
  NOT_YET_TESTED: "border-white/15 bg-white/[0.04] text-white/55",
};

async function readApiJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text) throw new Error(`Request failed (${response.status})`);
  return JSON.parse(text) as T;
}

function OutcomeBadge({ value }: { value: ModelTestingOutcome }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        OUTCOME_STYLES[value],
      )}
    >
      {value.replace(/_/g, " ")}
    </span>
  );
}

function EvidenceGallery({ evidence }: { evidence: ModelTestingEvidenceImage[] }) {
  if (evidence.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-white/15 bg-[#0b1524]/50 px-3 py-4 text-sm text-white/45">
        No benchmark evidence yet.
      </p>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {evidence.map((item, index) => (
        <div
          key={`${item.kind}-${item.label}-${index}`}
          className="overflow-hidden rounded-xl border border-white/10 bg-[#0b1524]/70"
        >
          <div className="border-b border-white/10 px-3 py-2">
            <p className="text-xs font-medium text-white/80">{item.label}</p>
            <p className="text-[10px] uppercase tracking-wide text-white/35">{item.kind.replace(/_/g, " ")}</p>
          </div>
          {item.url ? (
            <img
              src={item.url}
              alt={item.label}
              className="h-40 w-full object-cover object-center"
            />
          ) : (
            <div className="flex h-40 flex-col items-center justify-center gap-2 px-4 text-center">
              <p className="text-sm text-white/50">No benchmark evidence yet.</p>
              {item.repositoryPath ? (
                <p className="font-mono text-[10px] text-white/30">{item.repositoryPath}</p>
              ) : null}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ModelDetailPanel({
  model,
  videosBySlug,
  onSelectVideo,
  onClose,
}: {
  model: WolfModelTestingRecord;
  videosBySlug: Map<string, WolfBenchmarkVideoRecord>;
  onSelectVideo: (slug: string) => void;
  onClose: () => void;
}) {
  return (
    <aside className="rounded-xl border border-white/10 bg-[#0b1524]/80 p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-white">{model.modelName}</h4>
          <p className="mt-0.5 text-xs text-white/50">{model.modelFunction}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-white/45 hover:text-white/70"
        >
          Close
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <OutcomeBadge value={model.outcome} />
        <OutcomeBadge value={model.testStatus} />
      </div>

      <dl className="space-y-2 text-xs text-white/70">
        <div>
          <dt className="text-white/40">Confidence / result summary</dt>
          <dd className="mt-0.5">{model.confidenceSummary}</dd>
        </div>
        <div>
          <dt className="text-white/40">Comments</dt>
          <dd className="mt-0.5">{model.comments}</dd>
        </div>
        <div>
          <dt className="text-white/40">Commercial use</dt>
          <dd className="mt-0.5">{model.commercialUseStatus}</dd>
        </div>
      </dl>

      <div className="mt-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-white/40">Evidence</p>
        <EvidenceGallery evidence={model.evidence} />
      </div>

      {model.videoTests.length > 0 ? (
        <div className="mt-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-white/40">
            Video tests
          </p>
          <ul className="divide-y divide-white/10 rounded-lg border border-white/10">
            {model.videoTests.map((test) => {
              const video = videosBySlug.get(test.videoSlug);
              return (
                <li key={test.videoSlug}>
                  <button
                    type="button"
                    onClick={() => onSelectVideo(test.videoSlug)}
                    className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm text-white/80 hover:bg-white/[0.04]"
                  >
                    <span>{video?.slug ?? test.videoSlug}</span>
                    <ChevronRight className="h-3.5 w-3.5 text-white/35" />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </aside>
  );
}

function VideoDetailPanel({
  video,
  modelsById,
  onSelectModel,
  onClose,
}: {
  video: WolfBenchmarkVideoRecord;
  modelsById: Map<string, WolfModelTestingRecord>;
  onSelectModel: (modelId: string) => void;
  onClose: () => void;
}) {
  const linkedTests = useMemo(() => {
    const tests: Array<{
      model: WolfModelTestingRecord;
      test: WolfModelTestingRecord["videoTests"][number];
    }> = [];
    for (const model of modelsById.values()) {
      for (const test of model.videoTests) {
        if (test.videoSlug === video.slug) {
          tests.push({ model, test });
        }
      }
    }
    return tests;
  }, [modelsById, video.slug]);

  return (
    <aside className="rounded-xl border border-white/10 bg-[#0b1524]/80 p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-white">{video.slug}</h4>
          <p className="mt-0.5 text-xs text-white/50">{video.sourceDataset}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-white/45 hover:text-white/70"
        >
          Close
        </button>
      </div>

      <dl className="grid gap-2 text-xs text-white/70 sm:grid-cols-2">
        <div>
          <dt className="text-white/40">Resolution</dt>
          <dd>{video.resolution}</dd>
        </div>
        <div>
          <dt className="text-white/40">FPS</dt>
          <dd>{video.fps}</dd>
        </div>
        <div>
          <dt className="text-white/40">Duration</dt>
          <dd>{video.durationSeconds}s</dd>
        </div>
        <div>
          <dt className="text-white/40">Benchmark status</dt>
          <dd>{video.benchmarkStatus}</dd>
        </div>
        <div>
          <dt className="text-white/40">Detection count</dt>
          <dd>{video.detectionCount}</dd>
        </div>
        <div>
          <dt className="text-white/40">Unique animals</dt>
          <dd>{video.uniqueAnimalCount}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-white/40">Source</dt>
          <dd className="break-all">
            {video.sourceUrl.startsWith("http") ? (
              <a
                href={video.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sky-200 hover:underline"
              >
                {video.sourceIdentifier}
                <ExternalLink className="h-3 w-3" />
              </a>
            ) : (
              video.sourceUrl
            )}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-white/40">Comments</dt>
          <dd>{video.comments}</dd>
        </div>
      </dl>

      <div className="mt-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-white/40">Evidence</p>
        <EvidenceGallery evidence={video.evidenceImages} />
      </div>

      {linkedTests.length > 0 ? (
        <div className="mt-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-white/40">
            Model results on this video
          </p>
          <ul className="divide-y divide-white/10 rounded-lg border border-white/10">
            {linkedTests.map(({ model, test }) => (
              <li key={model.id}>
                <button
                  type="button"
                  onClick={() => onSelectModel(model.id)}
                  className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-white/[0.04]"
                >
                  <div>
                    <p className="text-sm font-medium text-white">{model.modelName}</p>
                    <p className="text-xs text-white/45">{test.confidenceSummary}</p>
                  </div>
                  <OutcomeBadge value={test.outcome} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mt-4 text-xs text-white/45">No model benchmark runs recorded for this video yet.</p>
      )}
    </aside>
  );
}

export default function WolfModelTestingArchWorkspace() {
  const [payload, setPayload] = useState<WolfModelTestingArchPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [selectedVideoSlug, setSelectedVideoSlug] = useState<string | null>(null);

  const loadPayload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(API_PATH, { cache: "no-store" });
      const data = await readApiJson<WolfModelTestingArchPayload & { error?: string }>(response);
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to load MODEL TESTING ARCH");
      }
      setPayload(data);
    } catch (loadError) {
      setPayload(null);
      setError(loadError instanceof Error ? loadError.message : "Failed to load MODEL TESTING ARCH");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPayload();
  }, [loadPayload]);

  const modelsById = useMemo(() => {
    const map = new Map<string, WolfModelTestingRecord>();
    for (const model of payload?.models ?? []) {
      map.set(model.id, model);
    }
    return map;
  }, [payload?.models]);

  const videosBySlug = useMemo(() => {
    const map = new Map<string, WolfBenchmarkVideoRecord>();
    for (const video of payload?.videos ?? []) {
      map.set(video.slug, video);
    }
    return map;
  }, [payload?.videos]);

  const selectedModel = selectedModelId ? modelsById.get(selectedModelId) ?? null : null;
  const selectedVideo = selectedVideoSlug ? videosBySlug.get(selectedVideoSlug) ?? null : null;

  const handleSelectModel = useCallback((modelId: string) => {
    setSelectedModelId(modelId);
    setSelectedVideoSlug(null);
  }, []);

  const handleSelectVideo = useCallback((slug: string) => {
    setSelectedVideoSlug(slug);
    setSelectedModelId(null);
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[20rem] items-center justify-center text-sm text-white/60">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading MODEL TESTING ARCH…
      </div>
    );
  }

  if (error || !payload) {
    return (
      <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-6 text-sm text-red-100">
        {error ?? "MODEL TESTING ARCH data is unavailable."}
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto pr-1">
      <div className="rounded-xl border border-sky-400/20 bg-sky-500/10 px-4 py-3">
        <p className="text-sm font-medium text-sky-100">{payload.mission}</p>
        <p className="mt-1 text-xs leading-relaxed text-sky-100/70">
          Living engineering repository for Mission 1 model and video benchmark evaluation. Species
          model slot:{" "}
          <span className="font-semibold text-sky-50">{payload.speciesModelSlotLabel}</span>
          {" — "}
          {payload.speciesModelSlotDescription}
        </p>
        <p className="mt-2 text-[11px] text-sky-100/45">
          Seed v{payload.seedVersion} · refreshed {new Date(payload.generatedAt).toLocaleString()}
        </p>
      </div>

      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-white">{MISSION_1_ARCHITECTURE_TITLE}</h3>
          <p className="mt-1 text-xs text-white/55">
            A living architecture diagram, not a static document.
          </p>
          <p className="mt-2 text-xs text-white/45">
            WOLF AI orchestrates each hand-off between stages. Supabase persists results — it is not
            an AI-processing stage.
          </p>
        </div>
        <ArchitectureViewer
          title="Mission 1 — Animal Detection & Counting"
          sectionSlug="model-testing-arch"
          diagramDocument={payload.diagram}
          readOnly
          height="min(56vh, 640px)"
        />
      </section>

      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-white">{MISSION_1_MODEL_SUMMARY_TITLE}</h3>
          <p className="mt-1 text-xs text-white/55">
            Living model-testing summary for Mission 1 Animal Counting.
          </p>
        </div>
        <div className="overflow-hidden rounded-xl border border-white/10">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs text-white/75">
              <thead className="bg-[#0b1524]/90 text-[11px] uppercase tracking-wide text-white/40">
                <tr>
                  <th className="px-3 py-2">Model</th>
                  <th className="px-3 py-2">Function</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Outcome</th>
                  <th className="px-3 py-2">Videos tested</th>
                  <th className="px-3 py-2">Licence / commercial</th>
                  <th className="px-3 py-2">Summary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {payload.models.map((model) => (
                  <tr
                    key={model.id}
                    className={cn(
                      "cursor-pointer transition-colors hover:bg-white/[0.03]",
                      selectedModelId === model.id && "bg-emerald-500/10",
                    )}
                    onClick={() => handleSelectModel(model.id)}
                  >
                    <td className="px-3 py-2 font-medium text-white">{model.modelName}</td>
                    <td className="max-w-[12rem] px-3 py-2 text-white/55">{model.modelFunction}</td>
                    <td className="px-3 py-2">
                      <OutcomeBadge value={model.testStatus} />
                    </td>
                    <td className="px-3 py-2">
                      <OutcomeBadge value={model.outcome} />
                    </td>
                    <td className="px-3 py-2 text-white/55">
                      {model.videosTested.length > 0 ? model.videosTested.join(", ") : "—"}
                    </td>
                    <td className="max-w-[10rem] px-3 py-2 text-white/55">
                      {model.commercialUseStatus}
                    </td>
                    <td className="max-w-md px-3 py-2 text-white/55">{model.confidenceSummary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-white">Benchmark video catalogue</h3>
          <p className="mt-1 text-xs text-white/55">
            Nine internal evaluation videos — counts remain &quot;Not yet benchmarked&quot; until
            harness runs establish them.
          </p>
        </div>
        <div className="overflow-hidden rounded-xl border border-white/10">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs text-white/75">
              <thead className="bg-[#0b1524]/90 text-[11px] uppercase tracking-wide text-white/40">
                <tr>
                  <th className="px-3 py-2">Slug</th>
                  <th className="px-3 py-2">Dataset</th>
                  <th className="px-3 py-2">Resolution</th>
                  <th className="px-3 py-2">FPS</th>
                  <th className="px-3 py-2">Benchmark status</th>
                  <th className="px-3 py-2">Models tested</th>
                  <th className="px-3 py-2">Detections</th>
                  <th className="px-3 py-2">Unique</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {payload.videos.map((video) => (
                  <tr
                    key={video.slug}
                    className={cn(
                      "cursor-pointer transition-colors hover:bg-white/[0.03]",
                      selectedVideoSlug === video.slug && "bg-emerald-500/10",
                    )}
                    onClick={() => handleSelectVideo(video.slug)}
                  >
                    <td className="px-3 py-2 font-medium text-white">{video.slug}</td>
                    <td className="px-3 py-2 text-white/55">{video.sourceDataset}</td>
                    <td className="px-3 py-2">{video.resolution}</td>
                    <td className="px-3 py-2">{video.fps}</td>
                    <td className="px-3 py-2 text-white/55">{video.benchmarkStatus}</td>
                    <td className="px-3 py-2 text-white/55">
                      {video.modelsTested.length > 0 ? video.modelsTested.join(", ") : "—"}
                    </td>
                    <td className="px-3 py-2">{video.detectionCount}</td>
                    <td className="px-3 py-2">{video.uniqueAnimalCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {(selectedModel || selectedVideo) && (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]">
          <div />
          {selectedModel ? (
            <ModelDetailPanel
              model={selectedModel}
              videosBySlug={videosBySlug}
              onSelectVideo={handleSelectVideo}
              onClose={() => setSelectedModelId(null)}
            />
          ) : null}
          {selectedVideo ? (
            <VideoDetailPanel
              video={selectedVideo}
              modelsById={modelsById}
              onSelectModel={handleSelectModel}
              onClose={() => setSelectedVideoSlug(null)}
            />
          ) : null}
        </div>
      )}
    </div>
  );
}
