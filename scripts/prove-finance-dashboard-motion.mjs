/**
 * Demo Finance dashboard living motion smoke (single attempt).
 *
 * Usage:
 *   node scripts/prove-finance-dashboard-motion.mjs
 *   ORIGIN=http://127.0.0.1:3002 node scripts/prove-finance-dashboard-motion.mjs
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import { chromium } from "playwright";

const ORIGIN = (process.env.ORIGIN ?? "https://demo.unit311central.com").replace(/\/$/, "");
const USERNAME = process.env.DEMO_PROSPECT_USERNAME ?? "demo@unit311central.com";
const PASSWORD = process.env.DEMO_PROSPECT_PASSWORD ?? "Letmein2026$";
const ARTIFACT_DIR = "/opt/cursor/artifacts";
const FINANCE_URL = `${ORIGIN}/dashboard?view=financials`;

async function loginDemo(page, context) {
  await page.goto(`${ORIGIN}/login?next=${encodeURIComponent("/dashboard?view=financials")}`, {
    waitUntil: "domcontentloaded",
    timeout: 120_000,
  });
  await page.locator("input[name=username]").fill(USERNAME);
  await page.locator("input[name=password][type=password]").fill(PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 90_000 });
  const cookies = await context.cookies();
  const session = cookies.filter((c) => c.name === "dc_platform_session");
  assert.equal(session.length, 1, "expected session cookie after login");
}

async function readLiquidityWidth(page) {
  return page.evaluate(() => {
    const bar = document.querySelector('[data-living-finance-liquidity="0"]');
    return bar ? bar.getBoundingClientRect().width : 0;
  });
}

async function readAgeingWidth(page, index = 0) {
  return page.evaluate((idx) => {
    const bar = document.querySelector(`[data-living-finance-ageing="${idx}"]`);
    return bar ? bar.getBoundingClientRect().width : 0;
  }, index);
}

async function readAudit(page) {
  return page.evaluate(() => window.__financeDashboardMotionAudit ?? null);
}

function compactMatchesAudit(domValue, auditAmount, currency = "GBP") {
  if (!domValue || auditAmount == null) return false;
  const n = Number(auditAmount);
  try {
    const expected = new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency,
      notation: "compact",
      maximumFractionDigits: 0,
    }).format(Math.ceil(n));
    return domValue.trim() === expected;
  } catch {
    return domValue.includes(String(Math.round(n)));
  }
}

async function captureFinanceStory(page) {
  await page.goto(FINANCE_URL, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await page.waitForSelector('[data-tutorial-target="fin-dashboard-hero"]', { timeout: 90_000 });
  await page.waitForFunction(() => Boolean(window.__financeDashboardMotionAudit), { timeout: 90_000 });

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: `${ARTIFACT_DIR}/demo-finance-story-hero.png`, fullPage: false });

  const audit = await readAudit(page);
  assert.ok(audit?.liquidity?.length, "audit liquidity segments should exist");

  await page.locator('[data-qa-target="finance-liquidity-section"]').scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
  const liqEarly = await readLiquidityWidth(page);
  await page.screenshot({ path: `${ARTIFACT_DIR}/demo-finance-story-liquidity-enter.png`, fullPage: false });
  await page.waitForTimeout(1200);
  const liqLate = await readLiquidityWidth(page);
  await page.screenshot({ path: `${ARTIFACT_DIR}/demo-finance-story-liquidity-mid.png`, fullPage: false });
  assert.ok(liqLate > liqEarly + 2, "liquidity stack should grow when section enters viewport");

  const domCash = await page
    .locator('[data-finance-motion="liquidity-stack"] [data-finance-final-value]')
    .first()
    .textContent();
  const cashSeg = audit.liquidity.find((r) => r.name === "Cash");
  assert.ok(
    cashSeg && compactMatchesAudit(domCash ?? "", cashSeg.value),
    "liquidity cash label should match audit",
  );

  await page.locator('[data-qa-target="finance-ar-ageing-section"]').scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
  const ageEarly = await readAgeingWidth(page, 0);
  await page.waitForTimeout(1400);
  const ageLate = await readAgeingWidth(page, 0);
  assert.ok(ageLate > ageEarly + 1, "AR ageing buckets should fill sequentially");

  await page.locator('[data-qa-target="finance-margin-section"]').scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${ARTIFACT_DIR}/demo-finance-story-margin-enter.png`, fullPage: false });

  await page.locator('[data-qa-target="finance-revenue-section"]').scrollIntoViewIfNeeded();
  await page.waitForTimeout(2200);
  await page.screenshot({ path: `${ARTIFACT_DIR}/demo-finance-story-revenue.png`, fullPage: false });

  const marginDom = await page
    .locator('[data-qa-target="finance-margin-section"] [data-finance-final-value]')
    .first()
    .textContent();
  assert.equal(marginDom?.trim(), `${audit.marginPct}%`, "margin % should match audit");

  const settledLiq = liqLate;
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);
  await page.locator('[data-qa-target="finance-liquidity-section"]').scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  const rescrollLiq = await readLiquidityWidth(page);
  assert.ok(
    rescrollLiq >= settledLiq - 2,
    "scrolling away and back should not reset completed liquidity animation",
  );

  const replayBtn = page.locator('[data-qa-target="finance-living-replay"]');
  await replayBtn.waitFor({ timeout: 15_000 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await replayBtn.click();
  await page.waitForTimeout(400);
  await page.locator('[data-qa-target="finance-liquidity-section"]').scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
  const replayEarly = await readLiquidityWidth(page);
  await page.waitForTimeout(1400);
  const replayLate = await readLiquidityWidth(page);
  assert.ok(replayLate > replayEarly + 2, "replay should re-animate liquidity when in view");
  console.log("ok  finance viewport story + replay");
}

async function main() {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  console.log(`prove-finance-dashboard-motion: origin=${ORIGIN}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: { dir: ARTIFACT_DIR, size: { width: 1280, height: 720 } },
  });
  const page = await context.newPage();

  await loginDemo(page, context);
  await captureFinanceStory(page);

  const videoPath = await page.video().path();
  await context.close();

  const reducedContext = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    reducedMotion: "reduce",
  });
  const reducedPage = await reducedContext.newPage();
  await loginDemo(reducedPage, reducedContext);
  await reducedPage.goto(FINANCE_URL, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await reducedPage.waitForSelector('[data-tutorial-target="fin-dashboard-hero"]', { timeout: 90_000 });
  await reducedPage.locator('[data-qa-target="finance-liquidity-section"]').scrollIntoViewIfNeeded();
  await reducedPage.waitForTimeout(800);
  const reducedWidths = await reducedPage.evaluate(() => {
    const bar = document.querySelector('[data-living-finance-liquidity="0"]');
    const w0 = bar ? bar.getBoundingClientRect().width : 0;
    return { w0 };
  });
  await reducedPage.waitForTimeout(1200);
  const reducedAfter = await reducedPage.evaluate(() => {
    const bar = document.querySelector('[data-living-finance-liquidity="0"]');
    return bar ? bar.getBoundingClientRect().width : 0;
  });
  assert.ok(
    Math.abs(reducedAfter - reducedWidths.w0) < 2,
    "prefers-reduced-motion should skip liquidity width animation",
  );
  console.log("ok  prefers-reduced-motion");

  await reducedContext.close();
  await browser.close();

  if (videoPath) {
    fs.renameSync(videoPath, `${ARTIFACT_DIR}/demo-finance-story-recording.webm`);
  }

  console.log("ok  prove-finance-dashboard-motion passed");
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
