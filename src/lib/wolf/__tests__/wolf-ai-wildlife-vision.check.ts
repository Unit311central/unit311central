/**
 * WOLF AI Wildlife Vision demo checks.
 *
 * Run: npx tsx src/lib/wolf/__tests__/wolf-ai-wildlife-vision.check.ts
 */
import assert from "node:assert/strict";

import { WOLF_AI_WILDLIFE_VISION_DURATION_SEC } from "@/lib/wolf/ai-wildlife-vision/config";
import { getWildlifeVisionHudAt } from "@/lib/wolf/ai-wildlife-vision/config";
import { createWildlifeVisionDetectionProvider } from "@/lib/wolf/ai-wildlife-vision/detection-provider";
import {
  WOLF_AI_WILDLIFE_VISION_FINAL_COUNTS,
  getSimulatedDetectionsAt,
  getSimulatedUniqueCountsAt,
} from "@/lib/wolf/ai-wildlife-vision/simulated-detections";

const provider = createWildlifeVisionDetectionProvider("simulated");

assert.equal(provider.mode, "simulated");
assert.equal(provider.durationSec, 30);

const aerialScan = getSimulatedDetectionsAt(4);
assert.equal(aerialScan.length, 0, "no detections during nadir establishing pass");

const at5 = getSimulatedUniqueCountsAt(5);
assert.equal(at5.totalUnique, 0);

const at10 = getSimulatedUniqueCountsAt(10.5);
assert.equal(at10.bySpecies.zebra, 3);
assert.equal(at10.bySpecies.wildebeest, 2);
assert.equal(at10.bySpecies.impala, 1);
assert.equal(at10.totalUnique, 6);

const at12 = getSimulatedUniqueCountsAt(12);
assert.equal(at12.bySpecies.zebra, 7);
assert.equal(at12.bySpecies.wildebeest, 6);
assert.equal(at12.bySpecies.impala, 4);
assert.equal(at12.bySpecies.giraffe, 0);
assert.equal(at12.totalUnique, 17);

const at20 = getSimulatedUniqueCountsAt(20);
assert.equal(at20.bySpecies.zebra, 8);
assert.equal(at20.bySpecies.wildebeest, 10);
assert.equal(at20.bySpecies.impala, 6);
assert.equal(at20.bySpecies.eland, 0);
assert.equal(at20.bySpecies.buffalo, 0);
assert.equal(at20.bySpecies.rhino, 0);
assert.equal(at20.totalUnique, 24);

const at30 = getSimulatedUniqueCountsAt(WOLF_AI_WILDLIFE_VISION_DURATION_SEC);
assert.deepEqual(at30, WOLF_AI_WILDLIFE_VISION_FINAL_COUNTS);
assert.equal(at30.totalUnique, 24);

const midPlayback = provider.getDetectionsAt(15);
assert.ok(midPlayback.length > 0, "expected visible simulated detections mid-playback");
assert.ok(
  midPlayback.every((detection) => ["zebra", "wildebeest", "impala"].includes(detection.species)),
  "demo footage only contains zebra, wildebeest, and impala",
);

const hudMid = getWildlifeVisionHudAt(15);
assert.ok(hudMid.altitudeM >= 650 && hudMid.altitudeM <= 750);
assert.equal(hudMid.speedMps, 24);
assert.equal(hudMid.fov, "Wide");
assert.equal(hudMid.mode, "Survey");

console.log("wolf-ai-wildlife-vision.check.ts — all assertions passed.");
