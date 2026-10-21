/**
 * Demo Home living dashboard visual smoke (single attempt — no retries).
 *
 * Usage:
 *   node scripts/prove-demo-home-living.mjs
 *   ORIGIN=http://127.0.0.1:3002 node scripts/prove-demo-home-living.mjs  # local dev
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import { chromium } from "playwright";

const ORIGIN = (process.env.ORIGIN ?? "https://demo.unit311central.com").replace(/\/$/, "");
const USERNAME = process.env.DEMO_PROSPECT_USERNAME ?? "demo@unit311central.com";
const PASSWORD = process.env.DEMO_PROSPECT_PASSWORD ?? "Letmein2026$";
const ARTIFACT_DIR = "/opt/cursor/artifacts";
const IS_LOCAL = /localhost|127\.0\.0\.1/.test(ORIGIN);

function attachKpiSampler(page) {
  return page.addInitScript(() => {
    window.__homeKpiSamples = [];
    window.setInterval(() => {
      const tiles = document.querySelectorAll('[data-qa-target="dashboard-widget"]');
      if (!tiles.length) return;
      const snap = Array.from(tiles)
        .map((n) => n.textContent ?? "")
        .join("|");
      const samples = window.__homeKpiSamples;
      if (samples[samples.length - 1] !== snap) samples.push(snap);
    }, 35);
  });
}

async function loginDemo(page, context) {
  await page.goto(`${ORIGIN}/login?next=${encodeURIComponent("/dashboard?view=home")}`, {
    waitUntil: "domcontentloaded",
    timeout: 120_000,
  });
  await page.locator("input[name=username]").fill(USERNAME);
  await page.locator("input[name=password][type=password]").fill(PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();
  try {
    await page.waitForURL(/\/dashboard/, { timeout: 90_000 });
  } catch (error) {
    const url = page.url();
    const bodySnippet = await page.locator("body").innerText().catch(() => "");
    throw new Error(
      `Login did not reach /dashboard (at ${url}). ` +
        `Body snippet: ${bodySnippet.slice(0, 200).replace(/\s+/g, " ")}. ` +
        `Original: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  await page.waitForLoadState("domcontentloaded", { timeout: 90_000 }).catch(() => {});
  const cookies = await context.cookies();
  const session = cookies.filter((c) => c.name === "dc_platform_session");
  if (session.length !== 1) {
    throw new Error(`Expected 1 dc_platform_session cookie after login, got ${session.length}`);
  }
}

async function readStoryMetrics(page) {
  return page.evaluate(() => {
    const bar = document.querySelector('[data-living-chart-bar="0"]');
    const barHeight = bar ? bar.getBoundingClientRect().height : 0;
    const queueBar = document.querySelector('[data-living-queue-bar="0"]');
    const trendPath = document.querySelector(
      '[data-qa-target="home-business-performance"] path[stroke]',
    );
    return {
      revenue: document.querySelector('[data-living-count-up="revenue"]')?.textContent?.trim() ?? "",
      cash: document.querySelector('[data-living-count-up="cash"]')?.textContent?.trim() ?? "",
      chartBarHeight: barHeight,
      queueBarWidth: queueBar ? queueBar.getBoundingClientRect().width : 0,
      hasTrendStroke: Boolean(trendPath),
    };
  });
}

async function captureDashboardStory(page) {
  await page.waitForSelector('[data-living-count-up="revenue"]', { timeout: 90_000 });
  let t0 = await readStoryMetrics(page);
  if (!/^£0(?:\.00)?$/.test(t0.revenue)) {
    const replayBtn = page.locator('[data-qa-target="home-living-replay"]');
    if (await replayBtn.count()) await replayBtn.click();
  }
  for (let i = 0; i < 40; i++) {
    t0 = await readStoryMetrics(page);
    if (/^£0(?:\.00)?$/.test(t0.revenue)) break;
    await page.waitForTimeout(40);
  }

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: `${ARTIFACT_DIR}/demo-home-story-hero-t0ms.png`, fullPage: false });
  await page.waitForTimeout(500);
  const heroMid = await readStoryMetrics(page);
  await page.screenshot({ path: `${ARTIFACT_DIR}/demo-home-story-hero-t500ms.png`, fullPage: false });
  assert.ok(
    /^£0(?:\.00)?$/.test(t0.revenue) || heroMid.revenue !== t0.revenue,
    "top KPIs should animate on initial load",
  );

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(3000);
  const beforeScroll = await readStoryMetrics(page);
  assert.ok(
    beforeScroll.chartBarHeight < 3,
    "Business Performance bars should stay collapsed until the section enters the viewport",
  );

  await page.locator('[data-qa-target="home-business-performance"]').scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${ARTIFACT_DIR}/demo-home-story-performance-enter.png`, fullPage: false });
  await page.waitForTimeout(100);
  const perfEarly = await readStoryMetrics(page);
  await page.waitForTimeout(2400);
  const perfLate = await readStoryMetrics(page);
  await page.screenshot({ path: `${ARTIFACT_DIR}/demo-home-story-performance-mid.png`, fullPage: false });
  assert.ok(
    perfLate.chartBarHeight > beforeScroll.chartBarHeight + 8,
    "Business Performance should animate when scrolled into view",
  );
  assert.ok(
    perfLate.chartBarHeight >= perfEarly.chartBarHeight,
    "Business Performance bars should reach final height after viewport entry",
  );
  assert.ok(perfLate.hasTrendStroke, "revenue trend should render in Business Performance");

  await page.locator('[data-qa-target="home-recent-activity"]').scrollIntoViewIfNeeded();
  await page.waitForTimeout(2200);
  await page.screenshot({ path: `${ARTIFACT_DIR}/demo-home-story-activity.png`, fullPage: false });

  await page.locator('[data-qa-target="home-work-queue"]').scrollIntoViewIfNeeded();
  await page.waitForTimeout(120);
  const queueEarly = await readStoryMetrics(page);
  await page.waitForTimeout(2200);
  const queueLate = await readStoryMetrics(page);
  await page.screenshot({ path: `${ARTIFACT_DIR}/demo-home-story-queue.png`, fullPage: false });
  assert.ok(
    queueLate.queueBarWidth > queueEarly.queueBarWidth + 4 || queueLate.queueBarWidth > 24,
    "Tasks queue attention bars should grow when scrolled into view",
  );

  const settledBarHeight = queueLate.chartBarHeight;
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(600);
  await page.locator('[data-qa-target="home-business-performance"]').scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  const rescroll = await readStoryMetrics(page);
  assert.ok(
    rescroll.chartBarHeight >= settledBarHeight - 2,
    "scrolling away and back should not reset completed chart animation",
  );

  const replayBtn = page.locator('[data-qa-target="home-living-replay"]');
  await replayBtn.waitFor({ timeout: 15_000 });
  const beforeReplay = await readStoryMetrics(page);
  await page.evaluate(() => window.scrollTo(0, 0));
  await replayBtn.click();
  await page.waitForTimeout(400);
  const replayHero = await readStoryMetrics(page);
  assert.match(replayHero.revenue, /^£0(?:\.00)?$/, "replay should reset hero KPI count-up");
  await page.locator('[data-qa-target="home-business-performance"]').scrollIntoViewIfNeeded();
  await page.waitForTimeout(2500);
  const replayPerf = await readStoryMetrics(page);
  assert.ok(
    replayPerf.chartBarHeight > 4,
    "replay should re-animate Business Performance when scrolled into view",
  );
  assert.equal(replayPerf.revenue, beforeReplay.revenue, "replay should preserve final revenue KPI value");
  console.log("ok  viewport-gated dashboard story + replay");
  return replayPerf;
}

async function main() {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  console.log(`prove-demo-home-living: origin=${ORIGIN} (single attempt)`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 960, height: 720 },
    recordVideo: { dir: ARTIFACT_DIR, size: { width: 960, height: 720 } },
  });
  const page = await context.newPage();

  await attachKpiSampler(page);

  await loginDemo(page, context);
  await captureDashboardStory(page);

  await page.waitForFunction(
    () => {
      const samples = window.__homeKpiSamples ?? [];
      return samples.length >= 2 && samples[0] !== samples[samples.length - 1];
    },
    { timeout: 90_000 },
  );

  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${ARTIFACT_DIR}/demo-home-living-mid.png`, fullPage: false });

  await page.screenshot({ path: `${ARTIFACT_DIR}/demo-home-living-before-reload.png`, fullPage: false });

  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForSelector('[data-qa-target="dashboard-widget"]', { timeout: 90_000 });
  await page.screenshot({ path: `${ARTIFACT_DIR}/demo-home-living-after-reload-early.png`, fullPage: false });
  const replayedOnReload = await page.evaluate(async () => {
    const read = () =>
      Array.from(document.querySelectorAll('[data-qa-target="dashboard-widget"]'))
        .map((n) => n.textContent ?? "")
        .join("|");
    const start = read();
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 50));
      if (read() !== start) return "replayed";
    }
    return "stable";
  });
  assert.equal(replayedOnReload, "replayed", "full page reload should replay KPI count-up");
  console.log("ok  reload replays living intro");

  await page.goto(`${ORIGIN}/dashboard?view=clients`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(800);
  await page.goto(`${ORIGIN}/dashboard?view=home`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('[data-qa-target="dashboard-widget"]', { timeout: 90_000 });
  const replayedOnReturn = await page.evaluate(async () => {
    const read = () =>
      Array.from(document.querySelectorAll('[data-qa-target="dashboard-widget"]'))
        .map((n) => n.textContent ?? "")
        .join("|");
    const start = read();
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 50));
      if (read() !== start) return "replayed";
    }
    return "stable";
  });
  assert.equal(replayedOnReturn, "replayed", "returning to Home should replay KPI count-up");
  console.log("ok  navigate away and back replays living intro");

  const videoPath = await page.video().path();
  await context.close();
  fs.renameSync(videoPath, `${ARTIFACT_DIR}/demo-home-story-recording.webm`);

  const reducedContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
  });
  const reducedPage = await reducedContext.newPage();
  await attachKpiSampler(reducedPage);
  await reducedPage.goto(`${ORIGIN}/login?next=${encodeURIComponent("/dashboard?view=home")}`, {
    waitUntil: "domcontentloaded",
    timeout: 120_000,
  });
  await reducedPage.locator("input[name=username]").fill(USERNAME);
  await reducedPage.locator("input[name=password][type=password]").fill(PASSWORD);
  await reducedPage.getByRole("button", { name: /sign in/i }).click();
  await reducedPage.waitForURL(/\/dashboard/, { timeout: 90_000 });
  await reducedPage.waitForSelector('[data-qa-target="dashboard-widget"]', { timeout: 90_000 });
  await reducedPage.waitForTimeout(1500);
  const reduced = await reducedPage.evaluate(() => {
    const samples = window.__homeKpiSamples ?? [];
    const kpiChanged =
      samples.length >= 2 && samples[0] !== samples[samples.length - 1];
    return { kpiChanged };
  });
  if (reduced.kpiChanged) {
    assert.equal(reduced.kpiChanged, false, "prefers-reduced-motion should skip KPI count-up");
  } else {
    console.log("ok  prefers-reduced-motion skips KPI count-up");
  }
  await reducedContext.close();
  await browser.close();

  console.log(`ok  prove-demo-home-living passed (${IS_LOCAL ? "local" : "demo host"})`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
