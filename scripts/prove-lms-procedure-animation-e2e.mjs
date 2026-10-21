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

  await page.addInitScript(() => {
    const stamp = Date.now();
    const origFetch = window.fetch.bind(window);
    window.fetch = async (input, init) => {
      const url = typeof input === "string" ? input : input instanceof Request ? input.url : "";
      if (url.includes("/api/lms/generate-from-document") && init?.body instanceof FormData) {
        init.body.append("title", `E2E Incident Procedure ${stamp}`);
      }
      return origFetch(input, init);
    };
  });

  await page.goto(
    `${ORIGIN}/login?next=${encodeURIComponent("/dashboard?view=portfolio-courses")}`,
    { waitUntil: "domcontentloaded", timeout: 120_000 },
  );
  await page.locator("input[name=username]").fill(USERNAME);
  await page.locator("input[name=password][type=password]").fill(PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();
  await Promise.race([
    page.waitForURL(/\/dashboard/, { timeout: 120_000 }),
    page.getByText(/Portfolio Courses/i).waitFor({ timeout: 120_000 }),
  ]);
  await page.waitForLoadState("domcontentloaded", { timeout: 60_000 }).catch(() => {});

  await page.goto(`${ORIGIN}/dashboard?view=portfolio-courses`, {
    waitUntil: "domcontentloaded",
    timeout: 120_000,
  });
  await page.waitForTimeout(3000);

  await page.screenshot({ path: `${ARTIFACT_DIR}/lms-e2e-01-portfolio-courses.png` });

  const uploadBtn = page.getByRole("button", { name: /upload pdf/i });
  await uploadBtn.waitFor({ state: "visible", timeout: 60_000 });
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles(PDF_PATH);

  await page
    .getByRole("heading", { name: /review before publishing/i })
    .waitFor({ timeout: 300_000 });
  await page.screenshot({ path: `${ARTIFACT_DIR}/lms-e2e-02-review-modal.png` });

  const reviewModal = page
    .locator("div.overflow-y-auto")
    .filter({ has: page.getByRole("heading", { name: /review before publishing/i }) })
    .first();
  await reviewModal.evaluate((el) => {
    el.scrollTop = el.scrollHeight;
  });
  const previewSection = page.getByText("Animation preview");
  await previewSection.waitFor({ timeout: 60_000 });
  await previewSection.scrollIntoViewIfNeeded();
  const playBtn = page.getByRole("button", { name: /^(play|replay)$/i }).first();
  await playBtn.click();
  await page.waitForTimeout(3500);
  await page.screenshot({ path: `${ARTIFACT_DIR}/lms-e2e-03-animation-preview-playing.png` });

  const bodyText = await page.locator("body").innerText();
  assert.match(bodyText, /incident|severity|escalat|register/i, "preview should reflect document-derived steps");

  await page.getByRole("button", { name: /publish course/i }).click();
  await page.getByText(/is published and listed below/i).waitFor({ timeout: 120_000 });

  const publishedSlug = await page.evaluate(async () => {
    const res = await fetch("/api/lms/courses?all=1&includeStats=1", { credentials: "include" });
    const data = await res.json();
    const matches = (data.courses ?? []).filter(
      (c) =>
        c.status === "published" &&
        /incident|escalat|severity|reporting/i.test(`${c.title} ${c.slug}`),
    );
    return matches.length ? matches[matches.length - 1].slug : null;
  });
  assert.ok(publishedSlug, "published course slug should be discoverable");

  const courseRow = page
    .getByRole("row")
    .filter({ hasText: /incident|escalat|severity|reporting/i })
    .last();
  await courseRow.waitFor({ state: "visible", timeout: 60_000 });
  await courseRow.getByRole("button", { name: /open course/i }).click();

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
  const playerPlay = page.getByRole("button", { name: /^(play|replay)$/i }).first();
  await playerPlay.waitFor({ timeout: 90_000 });
  await playerPlay.click();
  await page.waitForTimeout(4000);
  const pauseBtn = page.getByRole("button", { name: /pause/i }).first();
  if (await pauseBtn.isVisible().catch(() => false)) {
    await pauseBtn.click();
    await page.waitForTimeout(800);
  }
  const replayBtn = page.getByRole("button", { name: /replay/i }).first();
  if (await replayBtn.isVisible().catch(() => false)) {
    await replayBtn.click();
  } else {
    await playerPlay.click();
  }
  await page.waitForTimeout(3500);
  await page.screenshot({ path: `${ARTIFACT_DIR}/lms-e2e-04-lms-player-animation.png` });

  const assessment = await page.evaluate(async (slug) => {
    const drawRes = await fetch("/api/lms/assessment/draw", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseSlug: slug }),
    });
    const draw = await drawRes.json();
    if (!drawRes.ok) return { ok: false, step: "draw", draw };
    const answers = {};
    for (const q of draw.questions ?? []) {
      answers[q.id] = q.choices?.[0]?.id ?? "a";
    }
    const submitRes = await fetch("/api/lms/assessment/submit", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        courseSlug: slug,
        enrolmentId: draw.enrolmentId,
        questionIds: (draw.questions ?? []).map((q) => q.id),
        answers,
      }),
    });
    const submit = await submitRes.json();
    return {
      ok: submitRes.ok,
      step: submitRes.ok ? "done" : "submit",
      drawCount: draw.questions?.length ?? 0,
      submit,
    };
  }, publishedSlug);
  assert.ok(assessment.ok, `assessment flow failed: ${JSON.stringify(assessment)}`);
  assert.ok(assessment.drawCount >= 1, "assessment should draw questions");
  assert.ok(assessment.submit.attemptId, "attempt should be persisted");
  assert.equal(typeof assessment.submit.score, "number");

  const video = page.video();
  const dest = `${ARTIFACT_DIR}/lms-procedure-animation-e2e.webm`;
  if (video) {
    await Promise.race([
      video.saveAs(dest),
      new Promise((_, reject) => setTimeout(() => reject(new Error("video save timeout")), 45_000)),
    ]).then(
      () => console.log(`Saved recording: ${dest}`),
      () => console.warn("Skipped video save (timeout)"),
    );
  }
  await context.close();
  await browser.close();

  console.log("LMS procedure animation E2E: OK");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
