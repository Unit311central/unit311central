/**
 * Real-Time Video & AI Pipeline — calculations and reference seed.
 * Run: npm run prove:realtime-video-pipeline
 */
import assert from "node:assert/strict";

import { computePipelineSummary, computeStageTotals, formatLatencyMs } from "@/lib/realtime-video-pipeline/calculations";
import { RF_10KM_PROPAGATION_MS } from "@/lib/realtime-video-pipeline/constants";
import { REFERENCE_PIPELINE_STAGES } from "@/lib/realtime-video-pipeline/reference-scenario-seed";
import type { PipelineStage } from "@/lib/realtime-video-pipeline/types";

assert.ok(REFERENCE_PIPELINE_STAGES.length >= 54, "reference pipeline must include at least 54 stages");

const rfStage = REFERENCE_PIPELINE_STAGES.find((s) => s.component === "RF propagation");
assert.ok(rfStage);
assert.equal(rfStage.measurementStatus, "Calculated");
assert.ok(Math.abs((rfStage.transmissionMs ?? 0) - RF_10KM_PROPAGATION_MS) < 0.0001);

const mockStage = (partial: Partial<PipelineStage>): PipelineStage => ({
  id: "s1",
  workspaceId: "w1",
  scenarioId: "sc1",
  stageOrder: 1,
  stageNumber: 1,
  enabled: true,
  pipelineSection: "Drone",
  component: "Test",
  whatHappens: "",
  detailedDescription: "",
  processingMs: 10,
  transmissionMs: null,
  bufferMs: null,
  queueMs: null,
  aiInferenceMs: null,
  processingMinMs: null,
  processingTypicalMs: null,
  processingMaxMs: null,
  measurementStatus: "TBD",
  source: "",
  sourceUrl: null,
  sourceType: "",
  confidence: "Unknown",
  parallel: false,
  branchGroup: null,
  pathKind: null,
  milestone: null,
  details: {},
  createdAt: "",
  updatedAt: "",
  ...partial,
});

const incomplete = computeStageTotals(mockStage({ processingMs: null, transmissionMs: 5 }));
assert.equal(incomplete.totalMs, null);
assert.equal(formatLatencyMs(null), "TBD");

const complete = computeStageTotals(
  mockStage({ processingMs: 10, transmissionMs: 5, bufferMs: 2, queueMs: 1, aiInferenceMs: 3 }),
);
assert.equal(complete.totalMs, 21);

const summary = computePipelineSummary([
  mockStage({
    id: "a",
    stageOrder: 1,
    milestone: "capture",
    processingMs: 10,
    transmissionMs: 5,
  }),
  mockStage({
    id: "b",
    stageOrder: 2,
    milestone: "raw_video_visible",
    processingMs: null,
    transmissionMs: null,
  }),
]);
assert.equal(summary.rawVideoLatencyMs, null);
assert.ok(summary.knownMinimumMs >= 15);

console.log("realtime-video-pipeline.check.ts: ok");
