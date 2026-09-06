"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

import ArchitectureViewer from "@/components/architecture/ArchitectureViewer";
import type {
  Mission2TestingOutcome,
  WolfMission2BenchmarkVideoRecord,
  WolfMission2ModelTestingArchPayload,
  WolfMission2ModelTestingRecord,
} from "@/lib/wolf/wolf-mission2-model-testing-arch-types";
import { cn } from "@/lib/utils";

const API_PATH = "/api/information-repository/mission-2-model-testing-arch";

const OUTCOME_STYLES: Record<Mission2TestingOutcome, string> = {
  ACCEPTED: "border-emerald-400/40 bg-emerald-500/15 text-emerald-100",
  REJECTED: "border-red-400/40 bg-red-500/15 text-red-100",
  TESTED: "border-sky-400/40 bg-sky-500/15 text-sky-100",
  PENDING: "border-amber-400/40 bg-amber-500/15 text-amber-100",
  FAILED: "border-red-400/40 bg-red-500/15 text-red-100",
  "RESEARCH ONLY": "border-violet-400/40 bg-violet-500/15 text-violet-100",
  LICENCE_REVIEW: "border-violet-400/40 bg-violet-500/15 text-violet-100",
  NOT_YET_TESTED: "border-white/15 bg-white/[0.04] text-white/55",
};

async function readApiJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text) throw new Error(`Request failed (${response.status})`);
  return JSON.parse(text) as T;
}

function OutcomeBadge({ value }: { value: Mission2TestingOutcome }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        OUTCOME_STYLES[value],
      )}
    >
      {value}
    </span>
  );
}

export default function WolfMission2ModelTestingArchWorkspace() {
  const [payload, setPayload] = useState<WolfMission2ModelTestingArchPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [selectedVideoSlug, setSelectedVideoSlug] = useState<string | null>(null);

  const loadPayload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(API_PATH, { cache: "no-store" });
      const data = await readApiJson<WolfMission2ModelTestingArchPayload & { error?: string }>(response);
      if (!response.ok) throw new Error(data.error ?? "Failed to load Mission 2 MODEL TESTING ARCH");
      setPayload(data);
    } catch (loadError) {
      setPayload(null);
      setError(loadError instanceof Error ? loadError.message : "Failed to load Mission 2 MODEL TESTING ARCH");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPayload();
  }, [loadPayload]);

  const selectedModel = useMemo(
    () => payload?.models.find((model) => model.id === selectedModelId) ?? null,
    [payload?.models, selectedModelId],
  );
  const selectedVideo = useMemo(
    () => payload?.videos.find((video) => video.slug === selectedVideoSlug) ?? null,
    [payload?.videos, selectedVideoSlug],
  );

  if (loading) {
    return (
      <div className="flex min-h-[20rem] items-center justify-center text-sm text-white/60">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading Mission 2 MODEL TESTING ARCH…
      </div>
    );
  }

  if (error || !payload) {
    return (
      <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-6 text-sm text-red-100">
        {error ?? "Mission 2 MODEL TESTING ARCH data is unavailable."}
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto pr-1">
      <div className="rounded-xl border border-rose-400/20 bg-rose-500/10 px-4 py-3">
        <p className="text-sm font-medium text-rose-100">{payload.mission}</p>
        <p className="mt-1 text-xs leading-relaxed text-rose-100/75">{payload.syntheticDataWarning}</p>
        <p className="mt-2 text-xs text-rose-100/60">{payload.v1Recommendation}</p>
      </div>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-white">Mission 2 Model Testing Architecture</h3>
        <ArchitectureViewer
          title="Mission 2 — Animal Injury / Welfare"
          sectionSlug="mission-2-model-testing-arch"
          diagramDocument={payload.diagram}
          readOnly
          height="min(56vh, 720px)"
        />
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-white">
          Mission 2 — Animal Injury &amp; Welfare — Living Model Testing Summary
        </h3>
        <div className="overflow-hidden rounded-xl border border-white/10">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs text-white/75">
              <thead className="bg-[#0b1524]/90 text-[11px] uppercase tracking-wide text-white/40">
                <tr>
                  <th className="px-3 py-2">Model / approach</th>
                  <th className="px-3 py-2">Category</th>
                  <th className="px-3 py-2">Purpose</th>
                  <th className="px-3 py-2">Test videos</th>
                  <th className="px-3 py-2">Test status</th>
                  <th className="px-3 py-2">Result</th>
                  <th className="px-3 py-2">Runtime</th>
                  <th className="px-3 py-2">Licence status</th>
                  <th className="px-3 py-2">V1 relevance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {payload.models.map((model: WolfMission2ModelTestingRecord) => (
                  <tr
                    key={model.id}
                    className={cn(
                      "cursor-pointer hover:bg-white/[0.03]",
                      selectedModelId === model.id && "bg-rose-500/10",
                    )}
                    onClick={() => {
                      setSelectedModelId(model.id);
                      setSelectedVideoSlug(null);
                    }}
                  >
                    <td className="px-3 py-2 font-medium text-white">{model.modelName}</td>
                    <td className="px-3 py-2">{model.category}</td>
                    <td className="max-w-[12rem] px-3 py-2 text-white/55">{model.purpose}</td>
                    <td className="px-3 py-2 text-white/55">
                      {model.videosTested.length ? model.videosTested.join(", ") : "—"}
                    </td>
                    <td className="px-3 py-2"><OutcomeBadge value={model.testStatus} /></td>
                    <td className="max-w-md px-3 py-2 text-white/55">{model.result}</td>
                    <td className="px-3 py-2">{model.runtime}</td>
                    <td className="px-3 py-2">{model.commercialLicenceStatus}</td>
                    <td className="px-3 py-2">{model.v1Relevance}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-white">Mission 2 video / test catalogue</h3>
        <div className="overflow-hidden rounded-xl border border-white/10">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs text-white/75">
              <thead className="bg-[#0b1524]/90 text-[11px] uppercase tracking-wide text-white/40">
                <tr>
                  <th className="px-3 py-2">Filename</th>
                  <th className="px-3 py-2">Day</th>
                  <th className="px-3 py-2">Condition</th>
                  <th className="px-3 py-2">Red marker</th>
                  <th className="px-3 py-2">Posture</th>
                  <th className="px-3 py-2">Duplicate</th>
                  <th className="px-3 py-2">SHA-256</th>
                  <th className="px-3 py-2">Models tested</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {payload.videos.map((video: WolfMission2BenchmarkVideoRecord) => (
                  <tr
                    key={video.slug}
                    className={cn(
                      "cursor-pointer hover:bg-white/[0.03]",
                      selectedVideoSlug === video.slug && "bg-rose-500/10",
                    )}
                    onClick={() => {
                      setSelectedVideoSlug(video.slug);
                      setSelectedModelId(null);
                    }}
                  >
                    <td className="px-3 py-2 font-medium text-white">{video.filename}</td>
                    <td className="px-3 py-2">{video.day}</td>
                    <td className="px-3 py-2">{video.condition}</td>
                    <td className="px-3 py-2">{video.redMarker ? "Yes" : "No"}</td>
                    <td className="px-3 py-2">{video.posture}</td>
                    <td className="px-3 py-2 text-white/55">{video.duplicateRelationship}</td>
                    <td className="max-w-[10rem] truncate px-3 py-2 font-mono text-[10px] text-white/45">
                      {video.checksumSha256}
                    </td>
                    <td className="px-3 py-2 text-white/55">
                      {video.modelsTested.length ? video.modelsTested.join(", ") : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {(selectedModel || selectedVideo) && (
        <aside className="rounded-xl border border-white/10 bg-[#0b1524]/80 p-4 text-sm text-white/75">
          {selectedModel ? (
            <>
              <h4 className="font-semibold text-white">{selectedModel.modelName}</h4>
              <p className="mt-2 text-xs">{selectedModel.result}</p>
              <p className="mt-2 text-xs text-white/45">Run: {selectedModel.benchmarkRunReference ?? "—"}</p>
            </>
          ) : null}
          {selectedVideo ? (
            <>
              <h4 className="font-semibold text-white">{selectedVideo.filename}</h4>
              <p className="mt-2 text-xs">{selectedVideo.testPurpose}</p>
              <p className="mt-2 font-mono text-[10px] text-white/45">{selectedVideo.checksumSha256}</p>
            </>
          ) : null}
        </aside>
      )}
    </div>
  );
}
