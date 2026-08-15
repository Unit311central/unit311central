/**
 * Guards Unit311 Central homepage overview video constants.
 * Run: node --import tsx src/lib/__tests__/unit311-central-homepage-video.check.ts
 */
import assert from "node:assert/strict";

import {
  UNIT311_CENTRAL_HOMEPAGE_HERO_VIDEO_SRC,
  UNIT311_CENTRAL_OVERVIEW_VIDEO_SRC,
} from "@/lib/unit311-central-homepage-video";

const FORBIDDEN = [
  "drone",
  "onwardair",
  "testingvideo",
  "FINAL.mp4",
  "bestvideo",
  "unit311central.mp4",
];

for (const src of [UNIT311_CENTRAL_HOMEPAGE_HERO_VIDEO_SRC, UNIT311_CENTRAL_OVERVIEW_VIDEO_SRC]) {
  assert.equal(src.startsWith("/"), true, `expected absolute path: ${src}`);
  for (const token of FORBIDDEN) {
    assert.equal(
      src.toLowerCase().includes(token),
      false,
      `forbidden video reference "${token}" in ${src}`,
    );
  }
}

assert.equal(UNIT311_CENTRAL_OVERVIEW_VIDEO_SRC, "/videos/overview.mp4");
assert.equal(UNIT311_CENTRAL_HOMEPAGE_HERO_VIDEO_SRC, "/images/video.mp4");

console.log("unit311-central-homepage-video.check.ts — all assertions passed");
