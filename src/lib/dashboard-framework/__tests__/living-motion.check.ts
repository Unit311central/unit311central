import assert from "node:assert/strict";

import {
  HOME_LIVING_INTRO_SESSION_KEY,
  markHomeLivingIntroPlayed,
  readHomeLivingIntroPlayed,
} from "@/components/dashboard-framework/motion/living-motion-session";

assert.equal(typeof HOME_LIVING_INTRO_SESSION_KEY, "string");

if (typeof globalThis.sessionStorage !== "undefined") {
  sessionStorage.removeItem(HOME_LIVING_INTRO_SESSION_KEY);
  assert.equal(readHomeLivingIntroPlayed(), false);
  markHomeLivingIntroPlayed();
  assert.equal(readHomeLivingIntroPlayed(), true);
  sessionStorage.removeItem(HOME_LIVING_INTRO_SESSION_KEY);
}

console.log("living-motion.check: OK");
