/**
 * Demo Home living dashboard visual smoke.
 * ORIGIN=https://demo.unit311central.com node scripts/prove-demo-home-living.mjs
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import { chromium } from "playwright";

const ORIGIN = (process.env.ORIGIN ?? "https://demo.unit311central.com").replace(/\/$/, "");
const USERNAME = process.env.DEMO_PROSPECT_USERNAME ?? "demo@unit311central.com";
const PASSWORD = process.env.DEMO_PROSPECT_PASSWORD ?? "Letmein2026$";
const ARTIFACT_DIR = "/opt/cursor/artifacts";

async function main() {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir: ARTIFACT_DIR, size: { width: 1280, height: 720 } },
  });
  const page = await context.newPage();

  await page.goto(`${ORIGIN}/login?next=${encodeURIComponent("/dashboard?view=home")}`, {
    waitUntil: "domcontentloaded",
  });
  await page.locator("input[name=username]").fill(USERNAME);
  await page.locator("input[name=password][type=password]").fill(PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 90_000 });
  await page.waitForLoadState("networkidle", { timeout: 60_000 }).catch(() => {});

  await page.waitForSelector('[data-qa-target="dashboard-widget"]', { timeout: 60_000 });
  await page.screenshot({ path: `${ARTIFACT_DIR}/demo-home-living-load.png`, fullPage: true });

  const kpiText0 = await page.locator('[data-qa-target="dashboard-widget"]').first().innerText();
  await page.waitForTimeout(1200);
  const kpiText1 = await page.locator('[data-qa-target="dashboard-widget"]').first().innerText();
  assert.notEqual(kpiText0, kpiText1, "KPI tile text should change during count-up");

  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${ARTIFACT_DIR}/demo-home-living-mid.png`, fullPage: false });

  const videoPath = await page.video().path();
  await context.close();
  await browser.close();
  fs.renameSync(videoPath, `${ARTIFACT_DIR}/demo-home-living-dashboard.webm`);

  console.log("ok  prove-demo-home-living passed");
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
