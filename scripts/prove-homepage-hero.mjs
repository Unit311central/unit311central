/**
 * Guardrail: Unit311 Central homepage hero video + pricing must stay wired.
 * Usage: npm run prove:homepage-hero [baseUrl]
 */
import fs from "node:fs";
import path from "node:path";

const PROD = "https://unit311central.com";
const ORIGIN = process.argv[2]?.replace(/\/$/, "") ?? PROD;

const HERO_VIDEO_SRC = "/images/video.mp4";
const HERO_FINGERPRINT = "homepage-hero-video-v1-2026-08-17";
const EXPECTED_PRICES = ["$1,400", "$2,500", "$4,000"];

function assertSourceGuards() {
  const videoModulePath = path.join(process.cwd(), "src/lib/unit311-central-homepage-video.ts");
  const videoModule = fs.readFileSync(videoModulePath, "utf8");
  if (!videoModule.includes(HERO_FINGERPRINT)) {
    throw new Error(`Missing fingerprint ${HERO_FINGERPRINT}`);
  }
  if (!videoModule.includes(`"${HERO_VIDEO_SRC}"`)) {
    throw new Error(`Hero video src must remain ${HERO_VIDEO_SRC}`);
  }

  const heroVideoPath = path.join(process.cwd(), "public", HERO_VIDEO_SRC);
  if (!fs.existsSync(heroVideoPath)) {
    throw new Error(`Missing hero video asset: ${heroVideoPath}`);
  }
  if (fs.statSync(heroVideoPath).size < 1_000_000) {
    throw new Error(`Hero video asset too small: ${heroVideoPath}`);
  }

  const homeHero = fs.readFileSync(
    path.join(process.cwd(), "src/components/home/HomeHero.tsx"),
    "utf8",
  );
  if (!homeHero.includes("HeroVideoBackground")) {
    throw new Error("HomeHero.tsx must import and render HeroVideoBackground");
  }

  const pricingModule = fs.readFileSync(
    path.join(process.cwd(), "src/lib/platform-pricing.ts"),
    "utf8",
  );
  for (const price of ["1400", "2500", "4000"]) {
    if (!pricingModule.includes(`= ${price};`)) {
      throw new Error(`platform-pricing.ts missing marketing tier ${price}`);
    }
  }
}

async function assertProduction(origin) {
  const videoUrl = `${origin}${HERO_VIDEO_SRC}`;
  const videoRes = await fetch(videoUrl, { method: "HEAD" });
  if (!videoRes.ok) {
    throw new Error(`Hero video not reachable (${videoRes.status}): ${videoUrl}`);
  }
  const contentLength = Number(videoRes.headers.get("content-length") ?? "0");
  if (contentLength < 1_000_000) {
    throw new Error(`Hero video content-length too small (${contentLength}): ${videoUrl}`);
  }

  const homeRes = await fetch(`${origin}/`);
  if (!homeRes.ok) {
    throw new Error(`Homepage not reachable (${homeRes.status}): ${origin}/`);
  }
  const html = await homeRes.text();
  if (!html.includes(HERO_VIDEO_SRC)) {
    throw new Error(`Homepage HTML missing hero video src ${HERO_VIDEO_SRC}`);
  }
  if (!html.includes('<video src="/images/video.mp4"')) {
    throw new Error("Homepage HTML missing hero video element");
  }

  for (const price of EXPECTED_PRICES) {
    if (!html.includes(price)) {
      throw new Error(`Homepage HTML missing pricing tier ${price}`);
    }
  }
}

assertSourceGuards();
await assertProduction(ORIGIN);

console.log(`prove-homepage-hero — passed (${ORIGIN})`);
