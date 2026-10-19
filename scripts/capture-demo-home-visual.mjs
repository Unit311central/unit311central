/**
 * Capture timed screenshots + video of demo Home dashboard for visual motion audit.
 * Single attempt — no retries.
 */
import fs from "node:fs";
import { chromium } from "playwright";

const ORIGIN = (process.env.ORIGIN ?? "https://demo.unit311central.com").replace(/\/$/, "");
const USERNAME = process.env.DEMO_PROSPECT_USERNAME ?? "demo@unit311central.com";
const PASSWORD = process.env.DEMO_PROSPECT_PASSWORD ?? "Letmein2026$";
const ARTIFACT_DIR = "/opt/cursor/artifacts";

async function main() {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir: ARTIFACT_DIR, size: { width: 1280, height: 720 } },
  });
  const page = await context.newPage();

  await page.addInitScript(() => {
    sessionStorage.removeItem("unit311-executive-home-living-intro-v1");
  });

  await page.goto(`${ORIGIN}/login?next=${encodeURIComponent("/dashboard?view=home")}`, {
    waitUntil: "domcontentloaded",
    timeout: 120_000,
  });
  await page.locator("input[name=username]").fill(USERNAME);
  await page.locator("input[name=password][type=password]").fill(PASSWORD);
  const navStart = Date.now();
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 90_000 });

  const t0 = Date.now();
  await page.waitForSelector('[data-qa-target="dashboard-widget"]', { timeout: 120_000 }).catch(() => {});
  const widgetsVisibleMs = Date.now() - t0;
  const loginToDashboardMs = Date.now() - navStart;

  await page.evaluate(() =>
    document.querySelector('[data-ai-target="home-tiles"]')?.scrollIntoView({ block: "start" }),
  );
  await page.waitForTimeout(300);
  await page.evaluate(() => window.scrollBy(0, 420));

  for (const ms of [0, 150, 350, 600, 900, 1500, 3000, 5000]) {
    const elapsed = Date.now() - t0;
    if (elapsed < ms) await page.waitForTimeout(ms - elapsed);
    await page.screenshot({
      path: `${ARTIFACT_DIR}/demo-home-visual-t${ms}ms.png`,
      fullPage: false,
    });
  }

  const audit = await page.evaluate(() => {
    const tiles = Array.from(document.querySelectorAll('[data-qa-target="dashboard-widget"]'));
    const firstKpi = tiles[0]?.textContent ?? "";
    const bars = Array.from(document.querySelectorAll(".rounded-t-sm.opacity-95"));
    const barHeights = bars.slice(0, 6).map((el) => getComputedStyle(el).height);
    const motionDivs = document.querySelectorAll("[style*='opacity']").length;
    return {
      widgetCount: tiles.length,
      firstKpiSnippet: firstKpi.slice(0, 120),
      introFlag: sessionStorage.getItem("unit311-executive-home-living-intro-v1"),
      reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
      barHeights,
      motionDivs,
    };
  });

  console.log(JSON.stringify({ loginToDashboardMs, widgetsVisibleMs, audit }, null, 2));

  const videoPath = await page.video().path();
  await context.close();
  await browser.close();
  const videoName =
    process.env.CAPTURE_VIDEO_NAME ?? "demo-home-deployed-visual-audit.webm";
  fs.renameSync(videoPath, `${ARTIFACT_DIR}/${videoName}`);
  console.log("ok  capture-demo-home-visual");
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
