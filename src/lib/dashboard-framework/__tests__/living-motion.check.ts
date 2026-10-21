import assert from "node:assert/strict";

import {
  HOME_LIVING_INTRO_CHANGED_EVENT,
  HOME_LIVING_INTRO_SESSION_KEY,
  markHomeLivingIntroPlayed,
  readHomeLivingIntroPlayed,
} from "@/components/dashboard-framework/motion/living-motion-session";
import {
  estimateHomeLivingIntroPlaybackMs,
  livingEntranceProps,
} from "@/components/dashboard-framework/motion/living-motion";

assert.equal(typeof HOME_LIVING_INTRO_SESSION_KEY, "string");
assert.ok(estimateHomeLivingIntroPlaybackMs() >= 3500);

const noIntro = livingEntranceProps(2, true, false);
assert.equal(noIntro.initial, false);

const withIntro = livingEntranceProps(2, true, true);
assert.notEqual(withIntro.initial, false);

const reducedMotion = livingEntranceProps(2, false, true);
assert.equal(reducedMotion.initial, false);

if (typeof globalThis.sessionStorage !== "undefined" && typeof globalThis.window !== "undefined") {
  sessionStorage.removeItem(HOME_LIVING_INTRO_SESSION_KEY);
  assert.equal(readHomeLivingIntroPlayed(), false);

  let eventCount = 0;
  const onChanged = () => {
    eventCount += 1;
  };
  window.addEventListener(HOME_LIVING_INTRO_CHANGED_EVENT, onChanged);

  markHomeLivingIntroPlayed();
  assert.equal(readHomeLivingIntroPlayed(), true);
  assert.equal(eventCount, 1);

  markHomeLivingIntroPlayed();
  assert.equal(eventCount, 1, "second mark should be idempotent");

  window.removeEventListener(HOME_LIVING_INTRO_CHANGED_EVENT, onChanged);
  sessionStorage.removeItem(HOME_LIVING_INTRO_SESSION_KEY);
}

console.log("living-motion.check: OK");
