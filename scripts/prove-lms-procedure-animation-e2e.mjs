/**
 * Talanton LMS procedure animation E2E (Playwright).
 *
 *   ORIGIN=https://lms-preview.unit311central.com node scripts/prove-lms-procedure-animation-e2e.mjs
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const ORIGIN = (process.env.ORIGIN ?? "https://lms-preview.unit311central.com").replace(/\/$/, "");
const USERNAME =
  process.env.LMS_E2E_USERNAME ??
  process.env.DEMO_PROSPECT_USERNAME ??
  "paul@unit311central.com";
const PASSWORD =
  process.env.LMS_E2E_PASSWORD ??
  process.env.DEMO_PROSPECT_PASSWORD ??
  process.env.TEST_WORKSPACE_ADMIN_PASSWORD ??
  "";
const ARTIFACT_DIR = "/opt/cursor/artifacts";
const PDF_PATH = path.join(
  ARTIFACT_DIR,
  "Talanton_Sample_Compliance_Procedure_Incident_Reporting.pdf",
);

async function main() {
  if (!PASSWORD) {
    throw new Error("Set LMS_E2E_PASSWORD or TEST_WORKSPACE_ADMIN_PASSWORD for preview login.");
  }
  if (!fs.existsSync(PDF_PATH)) {
    throw new Error(`Missing PDF fixture at ${PDF_PATH} — run scripts/generate-lms-test-pdf.mjs`);
  }

  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir: ARTIFACT_DIR, size: { width: 1280, height: 720 } },
  });
  const page = await context.newPage();

  console.log(`LMS E2E origin: ${ORIGIN}`);

  await page.goto(
    `${ORIGIN}/login?next=${encodeURIComponent("/dashboard?view=portfolio-courses")}`,
    { waitUntil: "domcontentloaded", timeout: 120_000 },
  );
  await page.locator("input[name=username]").fill(USERNAME);
  await page.locator("input[name=password][type=password]").fill(PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 120_000 });
  await page.waitForLoadState("networkidle", { timeout: 120_000 }).catch(() => {});

  await page.goto(`${ORIGIN}/dashboard?view=portfolio-courses`, {
    waitUntil: "domcontentloaded",
    timeout: 120_000,
  });
  await page.waitForLoadState("networkidle", { timeout: 120_000 }).catch(() => {});

  await page.screenshot({ path: `${ARTIFACT_DIR}/lms-e2e-01-portfolio-courses.png` });

  const uploadBtn = page.getByRole("button", { name: /upload pdf/i });
  await uploadBtn.waitFor({ state: "visible", timeout: 60_000 });
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles(PDF_PATH);

  await page.getByText(/review before publishing|ai built a complete course/i).waitFor({
    timeout: 180_000,
  });
  await page.screenshot({ path: `${ARTIFACT_DIR}/lms-e2e-02-review-modal.png` });

  const previewSection = page.getByText("Animation preview");
  await previewSection.waitFor({ timeout: 30_000 });
  const playBtn = page.getByRole("button", { name: /^play$/i }).first();
  await playBtn.click();
  await page.waitForTimeout(3500);
  await page.screenshot({ path: `${ARTIFACT_DIR}/lms-e2e-03-animation-preview-playing.png` });

  const bodyText = await page.locator("body").innerText();
  assert.match(bodyText, /incident|severity|escalat|register/i, "preview should reflect document-derived steps");

  await page.getByRole("button", { name: /publish course/i }).click();
  await page.waitForTimeout(4000);

  const launchBtn = page.getByRole("button", { name: /launch|resume/i }).first();
  if (await launchBtn.isVisible().catch(() => false)) {
    await launchBtn.click();
  } else {
    await page.goto(`${ORIGIN}/dashboard?view=training`, { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: /launch|resume/i }).first().click();
  }

  await page.waitForTimeout(3000);
  const playerPlay = page.getByRole("button", { name: /^play$/i }).first();
  await playerPlay.waitFor({ timeout: 90_000 });
  await playerPlay.click();
  await page.waitForTimeout(4000);
  await page.getByRole("button", { name: /pause/i }).first().click();
  await page.waitForTimeout(800);
  await page.getByRole("button", { name: /replay/i }).first().click();
  await page.waitForTimeout(3000);
  await page.screenshot({ path: `${ARTIFACT_DIR}/lms-e2e-04-lms-player-animation.png` });

  const video = await page.video();
  await context.close();
  await browser.close();
  if (video) {
    const dest = `${ARTIFACT_DIR}/lms-procedure-animation-e2e.mp4`;
    await video.saveAs(dest);
    console.log(`Saved recording: ${dest}`);
  }

  console.log("LMS procedure animation E2E: OK");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
