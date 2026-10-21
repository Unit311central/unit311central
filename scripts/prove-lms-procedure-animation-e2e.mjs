/**
 * Test B — PDF-to-course E2E (upload, review, publish, learner player).
 *
 *   ORIGIN=https://lms-preview.unit311central.com node scripts/prove-lms-procedure-animation-e2e.mjs
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

import {
  assertProcedureAnimationPlayer,
  answerInlineKnowledgeCheck,
  DEFAULT_ORIGIN,
  flattenLessons,
  goToLessonIndex,
  loginStorageState,
  submitAssessmentAttempt,
} from "./lms-e2e-helpers.mjs";

const ORIGIN = (process.env.ORIGIN ?? DEFAULT_ORIGIN).replace(/\/$/, "");
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
  const storageState = await loginStorageState(ORIGIN, USERNAME, PASSWORD);

  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  const context = await browser.newContext({
    storageState,
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir: ARTIFACT_DIR, size: { width: 1280, height: 720 } },
  });
  const page = await context.newPage();
  const uniqueTitle = `E2E ${Date.now()}`;

  console.log(`PDF course E2E: ${ORIGIN} title=${uniqueTitle}`);

  await page.addInitScript((title) => {
    const origFetch = window.fetch.bind(window);
    window.fetch = async (input, init) => {
      const url = typeof input === "string" ? input : input instanceof Request ? input.url : "";
      if (url.includes("/api/lms/generate-from-document") && init?.body instanceof FormData) {
        init.body.append("title", title);
      }
      return origFetch(input, init);
    };
  }, uniqueTitle);

  await page.goto(`${ORIGIN}/dashboard?view=portfolio-courses`, {
    waitUntil: "domcontentloaded",
    timeout: 120_000,
  });
  await page.waitForTimeout(2000);

  const fileInput = page.locator('input[type="file"]');
  await fileInput.waitFor({ state: "attached", timeout: 60_000 });

  const generationResponse = page.waitForResponse(
    (res) =>
      res.url().includes("/api/lms/generate-from-document") &&
      res.request().method() === "POST",
    { timeout: 420_000 },
  );
  await fileInput.setInputFiles(PDF_PATH);
  const genRes = await generationResponse;
  const genBody = await genRes.json().catch(() => ({}));
  if (!genRes.ok()) {
    const errText = await page.locator("text=/Course generation failed|not configured|too short/i").first().textContent().catch(() => "");
    throw new Error(
      `generate-from-document failed (${genRes.status()}): ${JSON.stringify(genBody).slice(0, 400)} UI: ${errText}`,
    );
  }
  assert.ok(genBody.course?.slug, "generation must return course slug");

  await page
    .getByRole("heading", { name: /review before publishing/i })
    .waitFor({ timeout: 60_000 });

  const flatFromApi = flattenLessons(genBody.course);
  assert.ok(
    flatFromApi.some((l) => l.lessonType === "procedure_animation"),
    "generated tree must include procedure_animation",
  );
  assert.ok(
    flatFromApi.filter((l) => l.lessonType === "knowledge_check").length >= 2,
    "generated tree must include knowledge_check lessons",
  );
  const questionStems = (genBody.draft?.questions ?? []).map((q) => q.stem ?? q.question ?? "");
  assert.ok(
    questionStems.some((s) => /incident|escalat|severity|procedure|document/i.test(String(s))),
    "assessment bank questions must relate to uploaded document",
  );

  await page.getByRole("button", { name: /publish course/i }).click();
  await page.getByText(/is published and listed below/i).waitFor({ timeout: 120_000 });

  const publishedSlug = genBody.course.slug;
  const courseRow = page.getByRole("row").filter({ hasText: uniqueTitle }).last();
  await courseRow.waitFor({ state: "visible", timeout: 60_000 });
  await courseRow.getByRole("button", { name: /open course/i }).click();

  await page.waitForTimeout(1500);
  const flatLessons = flatFromApi;
  const animIndex = flatLessons.findIndex((l) => l.lessonType === "procedure_animation");
  const firstKcIndex = flatLessons.findIndex((l) => l.lessonType === "knowledge_check");

  await goToLessonIndex(page, animIndex);
  await assertProcedureAnimationPlayer(page, { animLessonId: flatLessons[animIndex].id });

  await goToLessonIndex(page, Math.max(0, firstKcIndex - animIndex));
  await answerInlineKnowledgeCheck(page, flatLessons[firstKcIndex].id);

  const assessment = await submitAssessmentAttempt(page, publishedSlug);
  assert.ok(assessment.ok, `assessment flow failed: ${JSON.stringify(assessment)}`);
  assert.ok(assessment.drawCount >= 1);
  assert.ok(assessment.submit.attemptId);

  await context.close();
  await browser.close();
  console.log("prove-lms-procedure-animation-e2e (PDF): OK");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
