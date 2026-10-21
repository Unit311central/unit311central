/**
 * Record LMS player procedure animation for an already-published incident course on preview.
 */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const ORIGIN = (process.env.ORIGIN ?? "https://lms-preview.unit311central.com").replace(/\/$/, "");
const PASSWORD = process.env.TEST_WORKSPACE_ADMIN_PASSWORD ?? "";
const ARTIFACT_DIR = "/opt/cursor/artifacts";
const OUT = path.join(ARTIFACT_DIR, "lms-procedure-animation-e2e.webm");

async function main() {
  if (!PASSWORD) throw new Error("TEST_WORKSPACE_ADMIN_PASSWORD required");
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir: ARTIFACT_DIR, size: { width: 1280, height: 720 } },
  });
  const page = await context.newPage();

  await page.goto(`${ORIGIN}/login?next=${encodeURIComponent("/dashboard?view=portfolio-courses")}`, {
    waitUntil: "domcontentloaded",
    timeout: 120_000,
  });
  await page.locator("input[name=username]").fill("paul@unit311central.com");
  await page.locator("input[name=password][type=password]").fill(PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 120_000 });
  await page.goto(`${ORIGIN}/dashboard?view=portfolio-courses`, { timeout: 120_000 });
  await page.waitForTimeout(3000);

  const row = page
    .getByRole("row")
    .filter({ hasText: /incident|escalat|severity|reporting/i })
    .last();
  await row.waitFor({ state: "visible", timeout: 60_000 });
  await row.getByRole("button", { name: /open course/i }).click();
  await page.waitForTimeout(2000);

  for (let i = 0; i < 14; i++) {
    const playVisible = await page
      .getByRole("button", { name: /^(play|replay)$/i })
      .first()
      .isVisible()
      .catch(() => false);
    if (playVisible) break;
    const next = page.getByRole("button", { name: /^next$/i });
    if (!(await next.isVisible().catch(() => false))) break;
    await next.click();
    await page.waitForTimeout(700);
  }

  const play = page.getByRole("button", { name: /^(play|replay)$/i }).first();
  await play.waitFor({ timeout: 60_000 });
  await play.click();
  await page.waitForTimeout(4500);
  const pause = page.getByRole("button", { name: /pause/i }).first();
  if (await pause.isVisible().catch(() => false)) await pause.click();
  await page.waitForTimeout(1000);
  const replay = page.getByRole("button", { name: /replay/i }).first();
  if (await replay.isVisible().catch(() => false)) await replay.click();
  else await play.click();
  await page.waitForTimeout(4000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "lms-player-incident-animation.png"), fullPage: true });

  const video = page.video();
  if (video) await video.saveAs(OUT);
  await context.close();
  await browser.close();
  console.log("Saved", OUT);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
