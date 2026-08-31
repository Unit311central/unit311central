/**
 * Workbench calculation engine tests.
 * Run: npm run prove:realtime-video-workbench
 */
import assert from "node:assert/strict";

import {
  computeOperatingSchedule,
  computeVideoDataVolumes,
  computeContention,
  computePeriodCosts,
  mbpsToGbPerHour,
  buildWorkbenchModel,
  compareWorkbenchModels,
} from "@/lib/realtime-video-pipeline/workbench-engine";
import { buildAssumptionsRegister } from "@/lib/realtime-video-pipeline/workbench-assumptions";
import {
  BCN_FLIGHT_SCHEDULE,
  ORYX_AIRCRAFT_NAME,
  createBcnWorkbenchConfig,
  REFERENCE_MISSION_PROFILES,
} from "@/lib/realtime-video-pipeline/workbench-reference-data";
import type { PipelineScenario } from "@/lib/realtime-video-pipeline/types";

const mockFlightScenario = (): PipelineScenario => ({
  id: "flight-1",
  workspaceId: "w1",
  slug: "south-africa-bcn-daily-reserve-operations",
  name: "South Africa — BCN Daily Reserve Operations",
  description: "",
  isDefault: false,
  scenarioKind: "flight",
  parentScenarioId: null,
  pipelineScenarioId: "pipeline-1",
  config: {},
  syncConfig: {},
  workbenchConfig: createBcnWorkbenchConfig(),
  createdAt: "",
  updatedAt: "",
});

assert.ok(mbpsToGbPerHour(8) > 3.5 && mbpsToGbPerHour(8) < 4, "8 Mbps ≈ 3.6 GB/hour");

const schedule = computeOperatingSchedule(BCN_FLIGHT_SCHEDULE, REFERENCE_MISSION_PROFILES, 7, 30);
assert.equal(schedule.flightsPerDay, 4);
assert.equal(schedule.flightHoursPerDay, 8);

const config = createBcnWorkbenchConfig();
const video = computeVideoDataVolumes(8, 8, 7, 30, 12);
assert.ok(video.gbPerDay > 28, "8 Mbps × 8 hours produces meaningful daily volume");
assert.ok(video.tbPerMonth > 0.8, "monthly TB volume calculated");

const contention = computeContention(config, 8);
assert.ok(typeof contention.uploadHeadroomMbps === "number");
assert.ok(["GREEN", "AMBER", "RED"].includes(contention.status));

const costs = computePeriodCosts(config, schedule, video);
assert.equal(costs.length, 24);
assert.ok(costs[0]!.months === 1);
assert.ok(costs[23]!.months === 24);
assert.ok((costs[11]!.wolfTotalUsd ?? 0) > 0, "12-month wolf cost computed");

const model = buildWorkbenchModel({
  flightScenario: mockFlightScenario(),
  pipeline: null,
});
assert.equal(model.schedule.flightHoursPerDay, 8);
assert.equal(model.config.videoProfile.droneModel, ORYX_AIRCRAFT_NAME);
assert.equal(model.overview.flightsPerDay, 4);
assert.ok(model.criteria.length >= 4);
assert.ok(model.architectureViews.length >= 5);
assert.equal(model.overview.completeLatencyTbd, true);

// TBD live bitrate change propagates (scales mission profile bitrates like the UI)
const config2 = createBcnWorkbenchConfig();
const ratio = 12 / config2.videoProfile.liveStreamBitrateMbps;
config2.videoProfile.liveStreamBitrateMbps = 12;
config2.missionProfiles = config2.missionProfiles.map((p) => ({
  ...p,
  liveBitrateMbps: Number((p.liveBitrateMbps * ratio).toFixed(2)),
}));
const model2 = buildWorkbenchModel({
  flightScenario: { ...mockFlightScenario(), workbenchConfig: config2 },
  pipeline: null,
});
assert.ok(model2.videoData.mbps > model.videoData.mbps, "bitrate increase propagates to video model");

assert.ok(buildAssumptionsRegister(createBcnWorkbenchConfig()).length >= 8);
assert.ok(compareWorkbenchModels(model, model2).deltas.length >= 4);

console.log("realtime-video-workbench.check.ts: ok");
