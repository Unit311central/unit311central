/**
 * User-like Finance motion recording for demo (scroll + replay).
 *   node scripts/record-finance-dashboard-motion-demo.mjs
 */
import fs from "node:fs";
import { chromium } from "playwright";

const ORIGIN = (process.env.ORIGIN ?? "https://demo.unit311central.com").replace(/\/$/, "");
const USERNAME = process.env.DEMO_PROSPECT_USERNAME ?? "demo@unit311central.com";
const PASSWORD = process.env.DEMO_PROSPECT_PASSWORD ?? "Letmein2026$";
const ARTIFACT_DIR = "/opt/cursor/artifacts";
const FINANCE_URL = `${ORIGIN}/dashboard?view=financials`;

async function login(page) {
  await page.goto(`${ORIGIN}/login?next=${encodeURIComponent("/dashboard?view=financials")}`, {
    waitUntil: "domcontentloaded",
    timeout: 120_000,
  });
  const username = page.locator("input[name=username]");
  const password = page.locator("input[name=password][type=password]");
  await username.waitFor({ state: "visible", timeout: 60_000 });
  await username.click();
  await username.fill(USERNAME);
  await password.click();
  await password.fill(PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 90_000 });
}

async function main() {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    recordVideo: { dir: ARTIFACT_DIR, size: { width: 1280, height: 800 } },
  });
  const page = await context.newPage();

  await login(page);
  await page.goto(FINANCE_URL, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await page.waitForFunction(() => Boolean(window.__financeDashboardMotionAudit), { timeout: 120_000 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${ARTIFACT_DIR}/finance-motion-user-01-top.png`, fullPage: false });

  await page.waitForTimeout(2800);

  for (let step = 0; step < 18; step++) {
    await page.mouse.wheel(0, 140);
    await page.waitForTimeout(180);
    if (step === 4) {
      await page.screenshot({ path: `${ARTIFACT_DIR}/finance-motion-user-02-charts-entering.png`, fullPage: false });
    }
    if (step === 8) {
      await page.screenshot({ path: `${ARTIFACT_DIR}/finance-motion-user-03-charts-mid.png`, fullPage: false });
    }
  }

  await page.waitForTimeout(2200);
  await page.screenshot({ path: `${ARTIFACT_DIR}/finance-motion-user-04-charts-settled.png`, fullPage: false });

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(600);
  await page.locator('[data-qa-target="finance-living-replay"]').click();
  await page.waitForTimeout(3500);
  await page.screenshot({ path: `${ARTIFACT_DIR}/finance-motion-user-05-after-replay-top.png`, fullPage: false });

  for (let step = 0; step < 14; step++) {
    await page.mouse.wheel(0, 140);
    await page.waitForTimeout(180);
  }
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${ARTIFACT_DIR}/finance-motion-user-06-replay-scroll.png`, fullPage: false });

  const videoPath = await page.video().path();
  await context.close();
  await browser.close();

  if (videoPath) {
    fs.renameSync(videoPath, `${ARTIFACT_DIR}/finance-dashboard-motion-visible-demo.webm`);
  }
  console.log("ok  recorded finance dashboard motion demo");
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
