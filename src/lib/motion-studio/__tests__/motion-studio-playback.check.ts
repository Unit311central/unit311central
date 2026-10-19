import assert from "node:assert/strict";

import { buildSalesOpportunitySpec } from "../templates/sales-opportunity";
import {
  PLAYBACK_TICK_MS,
  activeScene,
  advancePlaybackTime,
  elementMotionProgress,
  elementRevealAtMs,
  isElementRevealed,
  pipelineActiveIndex,
  restartPlayback,
  togglePlayPause,
} from "../playback";

const spec = buildSalesOpportunitySpec({ promptEcho: "demo" });

assert.equal(spec.scenes.length, 5);

const contact = spec.scenes[0]!;
assert.equal(activeScene(spec, 0)?.id, "contact");
assert.equal(activeScene(spec, 5_999)?.id, "contact");
assert.equal(activeScene(spec, 6_000)?.id, "company");
assert.equal(activeScene(spec, 12_000)?.id, "pipeline");
assert.equal(activeScene(spec, 19_000)?.id, "quote");
assert.equal(activeScene(spec, 25_000)?.id, "won");

assert.equal(isElementRevealed(contact, 2, 0, true), true);
assert.equal(isElementRevealed(contact, 2, 500, false), false);
const revealMs = elementRevealAtMs(contact, 2, contact.elements.length);
assert.ok(isElementRevealed(contact, 2, revealMs + 500, false));

const progressEarly = elementMotionProgress(contact, 1, 500, false);
const progressLate = elementMotionProgress(contact, 1, 2_500, false);
assert.ok(progressLate > progressEarly);
assert.equal(elementMotionProgress(contact, 1, 500, true), 1);

const pipelineScene = spec.scenes.find((s) => s.id === "pipeline")!;
const pipelineEl = pipelineScene.elements.find((e) => e.type === "pipeline");
assert.ok(pipelineEl && pipelineEl.type === "pipeline");

const idxStart = pipelineActiveIndex(pipelineEl, pipelineScene, 12_000, false);
const idxMid = pipelineActiveIndex(pipelineEl, pipelineScene, 15_500, false);
assert.ok(idxMid >= idxStart);
assert.ok(pipelineActiveIndex(pipelineEl, pipelineScene, 18_000, false) >= idxMid);

let t = 0;
let playing = true;
for (let i = 0; i < 600 && playing; i++) {
  const step = advancePlaybackTime(t, spec.durationMs, PLAYBACK_TICK_MS);
  t = step.timeMs;
  if (step.reachedEnd) playing = false;
}
assert.equal(t, spec.durationMs);

const paused = togglePlayPause(true, 1000, spec.durationMs);
assert.equal(paused.playing, false);
assert.equal(paused.timeMs, 1000);

const replay = togglePlayPause(false, spec.durationMs, spec.durationMs);
assert.equal(replay.playing, true);
assert.equal(replay.timeMs, 0);

const restarted = restartPlayback();
assert.equal(restarted.timeMs, 0);
assert.equal(restarted.playing, true);

assert.ok(elementRevealAtMs(contact, 0, contact.elements.length) <= elementRevealAtMs(contact, 3, contact.elements.length));

console.log("motion-studio-playback.check: OK");
