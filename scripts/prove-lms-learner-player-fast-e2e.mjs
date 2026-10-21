/**
 * Test A — Fast learner-player E2E (no PDF upload).
 *
 *   ORIGIN=https://lms-preview.unit311central.com node scripts/prove-lms-learner-player-fast-e2e.mjs
 */
import assert from "node:assert/strict";
import { chromium } from "playwright";

import {
  assertProcedureAnimationPlayer,
  answerInlineKnowledgeCheck,
  DEFAULT_ORIGIN,
  discoverLearnerFixtureSlug,
  fetchCourseTree,
  flattenLessons,
  goToLessonIndex,
  loginStorageState,
  submitAssessmentAttempt,
} from "./lms-e2e-helpers.mjs";

const ORIGIN = (process.env.ORIGIN ?? DEFAULT_ORIGIN).replace(/\/$/, "");

async function main() {
  const storageState = await loginStorageState(ORIGIN);
  const slug = await discoverLearnerFixtureSlug(ORIGIN, storageState);
  assert.ok(
    slug,
    "No published fixture course with procedure_animation + knowledge_check on this host. Run PDF E2E first or set LMS_E2E_FIXTURE_SLUG.",
  );

  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  const page = await (
    await browser.newContext({ storageState, viewport: { width: 1440, height: 900 } })
  ).newPage();

  console.log(`Fast learner E2E: ${ORIGIN} course=${slug}`);

  await page.goto(`${ORIGIN}/dashboard?view=portfolio-courses`, {
    waitUntil: "domcontentloaded",
    timeout: 120_000,
  });
  await page.waitForTimeout(2000);

  const course = await fetchCourseTree(ORIGIN, storageState, slug);
  const flatLessons = flattenLessons(course);
  const animIndex = flatLessons.findIndex((l) => l.lessonType === "procedure_animation");
  const firstKcIndex = flatLessons.findIndex((l) => l.lessonType === "knowledge_check");
  assert.ok(animIndex >= 0 && firstKcIndex >= 0, "fixture course missing required lesson types");

  const titleSnippet = course.title.split(/\s+/).slice(0, 3).join(" ");
  await page
    .getByRole("row")
    .filter({ hasText: titleSnippet })
    .last()
    .getByRole("button", { name: /open course/i })
    .click();

  await page.waitForTimeout(1500);
  await goToLessonIndex(page, animIndex);
  await assertProcedureAnimationPlayer(page, {
    animLessonId: flatLessons[animIndex].id,
  });

  const stepsToKc = firstKcIndex - animIndex;
  await goToLessonIndex(page, Math.max(0, stepsToKc));
  await answerInlineKnowledgeCheck(page, flatLessons[firstKcIndex].id);

  const assessment = await submitAssessmentAttempt(page, slug);
  assert.ok(assessment.ok, JSON.stringify(assessment));
  assert.ok(assessment.drawCount >= 1);
  assert.ok(assessment.submit.attemptId);

  await browser.close();
  console.log("prove-lms-learner-player-fast-e2e: OK");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
