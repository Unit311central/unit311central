/**
 * Guards Unit311 Central homepage overview video constants.
 * Run: node --import tsx src/lib/__tests__/unit311-central-homepage-video.check.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  UNIT311_CENTRAL_HOMEPAGE_HERO_FINGERPRINT,
  UNIT311_CENTRAL_HOMEPAGE_HERO_POSTER_SRC,
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
assert.equal(UNIT311_CENTRAL_HOMEPAGE_HERO_POSTER_SRC, "/images/unit311central-hero.png");
assert.match(UNIT311_CENTRAL_HOMEPAGE_HERO_FINGERPRINT, /^homepage-hero-video-v\d+-/);

const heroVideoPath = path.join(process.cwd(), "public", UNIT311_CENTRAL_HOMEPAGE_HERO_VIDEO_SRC);
const heroPosterPath = path.join(process.cwd(), "public", UNIT311_CENTRAL_HOMEPAGE_HERO_POSTER_SRC);
const homeHeroPath = path.join(process.cwd(), "src/components/home/HomeHero.tsx");

assert.equal(fs.existsSync(heroVideoPath), true, `missing hero video asset: ${heroVideoPath}`);
assert.equal(fs.existsSync(heroPosterPath), true, `missing hero poster asset: ${heroPosterPath}`);

const heroVideoBytes = fs.statSync(heroVideoPath).size;
assert.ok(heroVideoBytes > 1_000_000, `hero video too small (${heroVideoBytes} bytes)`);

const homeHeroSource = fs.readFileSync(homeHeroPath, "utf8");
assert.match(homeHeroSource, /HeroVideoBackground/, "HomeHero must render HeroVideoBackground");

console.log("unit311-central-homepage-video.check.ts — all assertions passed");
