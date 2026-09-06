import {
  WOLF_MISSION2_MODEL_TESTING_ARCH_MODELS,
  WOLF_MISSION2_MODEL_TESTING_ARCH_SEED_VERSION,
  WOLF_MISSION2_MODEL_TESTING_ARCH_VIDEOS,
} from "@/lib/wolf/wolf-mission2-model-testing-arch-data";
import { createMission2ModelTestingArchitectureDiagram } from "@/lib/wolf/wolf-mission2-model-testing-arch-diagram";
import type {
  Mission2EvidenceImage,
  Mission2TestingOutcome,
  WolfMission2BenchmarkVideoRecord,
  WolfMission2ModelTestingArchPayload,
  WolfMission2ModelTestingRecord,
} from "@/lib/wolf/wolf-mission2-model-testing-arch-types";

const SYNTHETIC_WARNING =
  "Mission 2 videos are controlled synthetic engineering tests (Google Flow). Results measure technical response to controlled conditions — not real-world injury accuracy or veterinary diagnosis.";

const V1_RECOMMENDATION =
  "Recommended Mission 2 V1: MegaDetector V6 → ByteTrack → WOLF AI temporal logic for stationary-animal warnings, plus operator review. Visible-injury research branches remain research-only until validated on controlled synthetic tests. Species identification, pose, and thermal are not required for basic V1 welfare alerts.";

function asOutcome(value: string | undefined): Mission2TestingOutcome {
  const normalized = String(value ?? "PENDING").toUpperCase().replace(/\s+/g, " ");
  const allowed: Mission2TestingOutcome[] = [
    "TESTED",
    "ACCEPTED",
    "REJECTED",
    "PENDING",
    "FAILED",
    "LICENCE_REVIEW",
    "RESEARCH ONLY",
    "NOT_YET_TESTED",
  ];
  return allowed.includes(normalized as Mission2TestingOutcome)
    ? (normalized as Mission2TestingOutcome)
    : "PENDING";
}

function mapEvidence(paths: string[] | undefined, labelPrefix: string): Mission2EvidenceImage[] {
  return (paths ?? []).map((path) => ({
    kind: "detector_output",
    label: `${labelPrefix}: ${path.split("/").pop() ?? path}`,
    url: null,
    repositoryPath: path,
  }));
}

export function buildWolfMission2ModelTestingArchPayload(
  benchmarkResults?: {
    generated_at?: string;
    videos?: Array<Record<string, unknown>>;
    model_runs?: Array<Record<string, unknown>>;
    v1_recommendation?: { summary?: string };
  } | null,
): WolfMission2ModelTestingArchPayload {
  const models = WOLF_MISSION2_MODEL_TESTING_ARCH_MODELS.map((seed) => mergeModelRecord(seed, benchmarkResults));
  const videos = WOLF_MISSION2_MODEL_TESTING_ARCH_VIDEOS.map((seed) => mergeVideoRecord(seed, benchmarkResults));

  return {
    seedVersion: WOLF_MISSION2_MODEL_TESTING_ARCH_SEED_VERSION,
    generatedAt: benchmarkResults?.generated_at ?? new Date().toISOString(),
    mission: "Mission 2 — Animal Injury / Welfare V1",
    syntheticDataWarning: SYNTHETIC_WARNING,
    diagram: createMission2ModelTestingArchitectureDiagram(),
    models,
    videos,
    v1Recommendation: benchmarkResults?.v1_recommendation?.summary ?? V1_RECOMMENDATION,
  };
}

function mergeModelRecord(
  seed: WolfMission2ModelTestingRecord,
  benchmarkResults?: {
    model_runs?: Array<Record<string, unknown>>;
  } | null,
): WolfMission2ModelTestingRecord {
  const run = benchmarkResults?.model_runs?.find((item) => item.model_key === seed.id);
  if (!run) return seed;
  const videosTested = Array.isArray(run.videos_tested) ? run.videos_tested.map(String) : seed.videosTested;
  const evidence = mapEvidence(
    Array.isArray(run.evidence_paths) ? run.evidence_paths.map(String) : [],
    seed.modelName,
  );
  const resultText = run.error
    ? `Failed: ${String(run.error)}`
    : `Completed with status ${String(run.test_status)} / ${String(run.outcome)}.`;
  return {
    ...seed,
    version: String(run.model_version ?? seed.version),
    checkpoint: String(run.model_checkpoint ?? seed.checkpoint),
    testStatus: asOutcome(String(run.test_status)),
    outcome: asOutcome(String(run.outcome)),
    result: resultText,
    runtime: `${Number(run.runtime_seconds ?? 0).toFixed(2)}s`,
    v1Relevance: String(run.v1_relevance ?? seed.v1Relevance),
    videosTested,
    evidence,
    comments: String(run.comments ?? seed.comments),
    testedAt: benchmarkResults ? String((benchmarkResults as { generated_at?: string }).generated_at ?? null) : null,
    benchmarkRunReference: String(run.run_id ?? null),
    videoTests: videosTested.map((videoSlug) => ({
      videoSlug,
      outcome: asOutcome(String(run.outcome)),
      testStatus: asOutcome(String(run.test_status)),
      resultSummary: resultText,
      benchmarkRunReference: String(run.run_id ?? null),
      testedAt: String((benchmarkResults as { generated_at?: string } | undefined)?.generated_at ?? null),
      comments: String(run.comments ?? ""),
      evidence,
    })),
  };
}

function mergeVideoRecord(
  seed: WolfMission2BenchmarkVideoRecord,
  benchmarkResults?: {
    videos?: Array<Record<string, unknown>>;
    model_runs?: Array<Record<string, unknown>>;
  } | null,
): WolfMission2BenchmarkVideoRecord {
  const verified = benchmarkResults?.videos?.find((item) => item.slug === seed.slug);
  if (!verified) return seed;
  const modelsTested = (benchmarkResults?.model_runs ?? [])
    .filter((run) => Array.isArray(run.videos_tested) && run.videos_tested.includes(seed.slug))
    .map((run) => String(run.model_key));
  const runRefs = (benchmarkResults?.model_runs ?? [])
    .filter((run) => Array.isArray(run.videos_tested) && run.videos_tested.includes(seed.slug))
    .map((run) => String(run.run_id));
  return {
    ...seed,
    resolution: `${verified.width}×${verified.height}`,
    width: Number(verified.width ?? 0),
    height: Number(verified.height ?? 0),
    fps: Number(verified.fps ?? 0),
    durationSeconds: Number(verified.duration_seconds ?? 0),
    frameCount: String(verified.frame_count ?? "Unknown"),
    codec: String(verified.codec ?? "unknown"),
    sizeBytes: Number(verified.size_bytes ?? 0),
    checksumSha256: String(verified.checksum_sha256 ?? seed.checksumSha256),
    modelsTested: modelsTested,
    benchmarkRunReferences: runRefs,
    notes: verified.duplicate_match === false
      ? `${seed.notes} DUPLICATE CHECK FAILED.`
      : seed.notes,
  };
}

export function findMission2ModelTestingRecord(modelId: string) {
  return WOLF_MISSION2_MODEL_TESTING_ARCH_MODELS.find((record) => record.id === modelId) ?? null;
}

export function findMission2BenchmarkVideoRecord(slug: string) {
  return WOLF_MISSION2_MODEL_TESTING_ARCH_VIDEOS.find((record) => record.slug === slug) ?? null;
}
