"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Play, RefreshCw } from "lucide-react";

import { wolfCardClass, wolfEyebrowClass, wolfShellClass } from "@/components/wolf/wolf-ui";
import {
  SHARK_TEST_VIDEOS,
  type SharkViewId,
} from "@/lib/wolf/shark/constants";
import type { SharkJobRecord, SharkTestResultPayload } from "@/lib/wolf/shark/types";
import { cn } from "@/lib/utils";

const SECTION_LABELS: Record<SharkViewId, string> = {
  "wolf-shark-dashboard": "Dashboard",
  "wolf-shark-video-analysis": "Video Analysis",
  "wolf-shark-ai-detection": "AI Detection",
  "wolf-shark-tracking": "Tracking",
  "wolf-shark-test-results": "Test Results",
  "wolf-shark-settings": "Settings",
};

type Props = {
  activeView: SharkViewId;
};

function modelRow(result: SharkTestResultPayload | null, model: string) {
  const summary = result?.model_summaries?.find((m) => m.model === model);
  if (!summary) return "—";
  if (summary.status === "NOT_SUPPORTED") return "NOT_SUPPORTED";
  if (summary.status === "NOT_AVAILABLE") return "NOT_AVAILABLE";
  if (summary.status === "FAILED") return `FAILED`;
  return String(summary.unique_tracks ?? summary.detections ?? 0);
}

export default function WolfSharkWorkspace({ activeView }: Props) {
  const section = SECTION_LABELS[activeView] ?? "SHARK";
  const [video, setVideo] = useState<string>("shark.mp4");
  const [job, setJob] = useState<SharkJobRecord | null>(null);
  const [history, setHistory] = useState<SharkJobRecord[]>([]);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [showOverlays, setShowOverlays] = useState(true);

  const expected = useMemo(
    () => SHARK_TEST_VIDEOS.find((v) => v.id === video)?.expectedSharks ?? 0,
    [video],
  );

  const loadVideoUrl = useCallback(async () => {
    const res = await fetch(`/api/wolf/shark/video-url?video=${encodeURIComponent(video)}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Video URL failed");
    setVideoUrl(data.url);
  }, [video]);

  const refreshHistory = useCallback(async () => {
    const res = await fetch("/api/wolf/shark/jobs");
    if (!res.ok) return;
    const data = await res.json();
    setHistory((data.jobs as SharkJobRecord[]) ?? []);
  }, []);

  useEffect(() => {
    void refreshHistory();
  }, [refreshHistory]);

  useEffect(() => {
    if (activeView === "wolf-shark-video-analysis") {
      void loadVideoUrl().catch((e) => setError(e instanceof Error ? e.message : "Video load failed"));
    }
  }, [activeView, loadVideoUrl]);

  const pollJob = useCallback(async (id: string) => {
    for (let i = 0; i < 600; i++) {
      const res = await fetch(`/api/wolf/shark/jobs/${id}`);
      const data = (await res.json()) as SharkJobRecord;
      if (!res.ok) break;
      setJob(data);
      if (data.status === "COMPLETED" || data.status === "FAILED") {
        setRunning(false);
        void refreshHistory();
        return;
      }
      await new Promise((r) => setTimeout(r, 2000));
    }
    setRunning(false);
  }, [refreshHistory]);

  const runTest = useCallback(async () => {
    setError(null);
    setRunning(true);
    setJob(null);
    const res = await fetch("/api/wolf/shark/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ video }),
    });
    const data = await res.json();
    if (!res.ok) {
      setRunning(false);
      setError(data.error ?? "Failed to start job");
      return;
    }
    setJob({
      id: data.id,
      video: data.video,
      status: "QUEUED",
      progress: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      error: null,
      result: null,
    });
    void pollJob(data.id);
  }, [pollJob, video]);

  const result = job?.result ?? null;

  return (
    <div className={cn(wolfShellClass, "space-y-6 p-6")}>
      <div>
        <p className={wolfEyebrowClass}>WOLF Central · Development / testing only</p>
        <h1 className="text-2xl font-semibold tracking-tight text-white">SHARK — {section}</h1>
        <p className="mt-1 max-w-3xl text-sm text-white/70">
          Server-side AI test pipeline. Results are measured detections/tracks — not operational shark
          accuracy. Human expected counts are reference only.
        </p>
      </div>

      {(activeView === "wolf-shark-dashboard" || activeView === "wolf-shark-test-results") && (
        <div className={wolfCardClass}>
          <h2 className="text-lg font-medium text-white">WOLF SHARK AI TEST</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="text-sm text-white/80">
              Video
              <select
                className="mt-1 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-white"
                value={video}
                onChange={(e) => setVideo(e.target.value)}
                disabled={running}
              >
                {SHARK_TEST_VIDEOS.map((v) => (
                  <option key={v.id} value={v.id}>{v.label}</option>
                ))}
              </select>
            </label>
            <div className="text-sm text-white/70">
              Sample rate: <strong>2 FPS</strong> (server default)
              <br />
              Models: YOLO, Grounding DINO, SAM 2 (fusion on pipeline)
            </div>
          </div>
          <button
            type="button"
            disabled={running}
            onClick={() => void runTest()}
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50"
          >
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            RUN TEST
          </button>
          {error && <p className="mt-2 text-sm text-red-300">{error}</p>}
          {job && (
            <p className="mt-2 text-sm text-white/70">
              Job {job.id.slice(0, 8)}… — {job.status}
              {job.status === "PROCESSING" && " (server processing…)"}
            </p>
          )}
        </div>
      )}

      {(activeView === "wolf-shark-test-results" || activeView === "wolf-shark-dashboard") && (
        <div className={wolfCardClass}>
          <h2 className="text-lg font-medium text-white">SHARK AI TEST RESULTS</h2>
          <table className="mt-4 w-full text-left text-sm text-white/90">
            <thead>
              <tr className="border-b border-white/10 text-white/60">
                <th className="py-2 pr-4">Metric</th>
                <th className="py-2">Value</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-2 pr-4">Expected visible sharks (human reference)</td>
                <td>{expected}</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">YOLO unique tracks</td>
                <td>{modelRow(result, "yolo")}</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">Grounding DINO unique tracks</td>
                <td>{modelRow(result, "grounding_dino")}</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">SAM 2 supported</td>
                <td>{modelRow(result, "sam2")}</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">WOLF AI fused unique tracks</td>
                <td>{result?.wolf_unique_tracks ?? "—"}</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">Frames analysed</td>
                <td>{result?.frames_analysed ?? "—"}</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">Processing time (s)</td>
                <td>{result?.processing_seconds?.toFixed(1) ?? "—"}</td>
              </tr>
            </tbody>
          </table>
          <p className="mt-3 text-xs text-amber-200/90">
            Track counts are not shark counts. High values on base.mp4 indicate false positives.
          </p>
        </div>
      )}

      {activeView === "wolf-shark-video-analysis" && (
        <div className={wolfCardClass}>
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="text-sm text-white/80 underline"
              onClick={() => void loadVideoUrl()}
            >
              Reload signed URL
            </button>
            <label className="flex items-center gap-2 text-sm text-white/80">
              <input
                type="checkbox"
                checked={showOverlays}
                onChange={(e) => setShowOverlays(e.target.checked)}
              />
              Show track labels (metadata)
            </label>
          </div>
          {videoUrl ? (
            <video
              key={videoUrl}
              src={videoUrl}
              controls
              className="max-h-[480px] w-full rounded-md bg-black"
            />
          ) : (
            <p className="text-sm text-white/60">Loading video from wolf-shark bucket…</p>
          )}
          {showOverlays && result?.wolf_tracks?.length ? (
            <ul className="mt-3 space-y-1 text-xs text-white/70">
              {result.wolf_tracks.map((t) => (
                <li key={t.wolf_track_id}>
                  {t.wolf_track_id} · {t.first_seen_seconds.toFixed(2)}s–{t.last_seen_seconds.toFixed(2)}s ·
                  models: {t.models.join(", ")}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      )}

      {activeView === "wolf-shark-tracking" && (
        <div className={wolfCardClass}>
          <h2 className="text-lg font-medium text-white">Tracks</h2>
          {!result?.wolf_tracks?.length ? (
            <p className="mt-2 text-sm text-white/60">Run a test from Dashboard or Test Results.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm text-white/85">
              {result.wolf_tracks.map((t) => (
                <li key={t.track_id} className="rounded border border-white/10 p-2">
                  <strong>{t.wolf_track_id}</strong> ({t.track_id}) — {t.frame_count} frames, conf{" "}
                  {t.avg_confidence.toFixed(2)}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {activeView === "wolf-shark-ai-detection" && (
        <div className={wolfCardClass}>
          <h2 className="text-lg font-medium text-white">Per-model summaries</h2>
          <ul className="mt-3 space-y-2 text-sm text-white/85">
            {(result?.model_summaries ?? []).map((m) => (
              <li key={m.model} className="rounded border border-white/10 p-2">
                {m.model}: {m.status} — detections {m.detections}, tracks {m.unique_tracks}
              </li>
            ))}
          </ul>
        </div>
      )}

      {activeView === "wolf-shark-settings" && (
        <div className={wolfCardClass}>
          <h2 className="text-lg font-medium text-white">Settings</h2>
          <p className="mt-2 text-sm text-white/70">
            Server env: <code className="text-white">WOLF_AI_REPO_PATH</code>,{" "}
            <code className="text-white">WOLF_AI_SHARK_API_URL</code>, Supabase{" "}
            <code className="text-white">wolf-shark</code> bucket. Phase 2 benchmark:{" "}
            <code className="text-white">python3 scripts/run_shark_benchmark.py</code> in wolf-ai.
          </p>
        </div>
      )}

      {(activeView === "wolf-shark-dashboard" || activeView === "wolf-shark-test-results") && (
        <div className={wolfCardClass}>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-white">Recent jobs (this server instance)</h2>
            <button type="button" onClick={() => void refreshHistory()} className="text-white/70">
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
          <ul className="mt-3 space-y-1 text-xs text-white/70">
            {history.map((h) => (
              <li key={h.id}>
                {h.video} · {h.status} · {h.result?.wolf_unique_tracks ?? "—"} WOLF tracks
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
