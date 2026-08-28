/**
 * WOLF AI Wildlife Vision demo checks.
 *
 * Run: npx tsx src/lib/wolf/__tests__/wolf-ai-wildlife-vision.check.ts
 */
import assert from "node:assert/strict";

import { WOLF_AI_WILDLIFE_VISION_DURATION_SEC } from "@/lib/wolf/ai-wildlife-vision/config";
import { createWildlifeVisionDetectionProvider } from "@/lib/wolf/ai-wildlife-vision/detection-provider";
import { getSimulatedUniqueCountsAt } from "@/lib/wolf/ai-wildlife-vision/simulated-detections";

const provider = createWildlifeVisionDetectionProvider("simulated");

assert.equal(provider.mode, "simulated");
assert.equal(provider.durationSec, 30);

const at5 = getSimulatedUniqueCountsAt(5);
assert.equal(at5.bySpecies.zebra, 4);
assert.equal(at5.bySpecies.eland, 2);
assert.equal(at5.totalUnique, 6);

const at12 = getSimulatedUniqueCountsAt(12);
assert.equal(at12.bySpecies.zebra, 11);
assert.equal(at12.bySpecies.eland, 4);
assert.equal(at12.bySpecies.giraffe, 2);
assert.equal(at12.totalUnique, 17);

const at20 = getSimulatedUniqueCountsAt(20);
assert.equal(at20.bySpecies.zebra, 18);
assert.equal(at20.bySpecies.eland, 7);
assert.equal(at20.bySpecies.giraffe, 3);
assert.equal(at20.bySpecies.wildebeest, 8);
assert.equal(at20.totalUnique, 36);

const at30 = getSimulatedUniqueCountsAt(WOLF_AI_WILDLIFE_VISION_DURATION_SEC);
assert.equal(at30.bySpecies.zebra, 23);
assert.equal(at30.bySpecies.eland, 8);
assert.equal(at30.bySpecies.giraffe, 4);
assert.equal(at30.bySpecies.wildebeest, 17);
assert.equal(at30.bySpecies.impala, 6);
assert.equal(at30.bySpecies.buffalo, 3);
assert.equal(at30.bySpecies.rhino, 2);
assert.equal(at30.totalUnique, 63);

const midPlayback = provider.getDetectionsAt(10);
assert.ok(midPlayback.length > 0, "expected visible simulated detections mid-playback");

console.log("wolf-ai-wildlife-vision.check.ts — all assertions passed.");
