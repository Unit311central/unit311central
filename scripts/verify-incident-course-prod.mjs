/**
 * End-to-end verification for repaired Incident Reporting course on Talanton production.
 * Requires TEST_WORKSPACE_ADMIN_PASSWORD (internal staff — draft preview + assessment).
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import { chromium, request as playwrightRequest } from "playwright";

const ORIGIN = (process.env.ORIGIN ?? "https://talantonimpact.unit311central.com").replace(/\/$/, "");
const USERNAME = process.env.LMS_E2E_USERNAME ?? "paul@unit311central.com";
const PASSWORD = process.env.TEST_WORKSPACE_ADMIN_PASSWORD ?? "";
const SLUG = process.env.COURSE_SLUG ?? "incident-reporting-escalation-training-3";
const ARTIFACT_DIR = "/opt/cursor/artifacts";

if (!PASSWORD) process.exit(1);

const api = await playwrightRequest.newContext({ baseURL: ORIGIN });
const loginRes = await api.post("/api/auth/login", {
  data: { username: USERNAME, password: PASSWORD, next: "/dashboard" },
});
assert.ok(loginRes.ok());
const storage = await api.storageState();

const treeRes = await api.get(`/api/lms/courses/${encodeURIComponent(SLUG)}`);
const treeBody = await treeRes.json();
assert.ok(treeRes.ok(), JSON.stringify(treeBody));

const course = treeBody.course;
const lessons = course.modules.flatMap((m) => m.lessons);
const animations = lessons.filter((l) => l.lessonType === "procedure_animation");
const knowledgeChecks = lessons.filter((l) => l.lessonType === "knowledge_check");
const assessment = lessons.find((l) => l.content?.type === "assessment");
const teachingLessons = lessons.filter((l) => l.content?.type !== "assessment");

for (const lesson of teachingLessons) {
  if (lesson.lessonType === "knowledge_check") continue;
  assert.equal(
    lesson.lessonType,
    "procedure_animation",
    `Teaching lesson must be procedure_animation: ${lesson.title}`,
  );
}

for (const kc of knowledgeChecks) {
  const idx = lessons.indexOf(kc);
  const prev = lessons[idx - 1];
  assert.ok(prev?.lessonType === "procedure_animation", `KC missing preceding animation: ${kc.title}`);
}

assert.equal(course.questionCount, 17, "question bank count on tree");
assert.equal(assessment?.content?.drawCount, 10);
assert.equal(course.passMark, 80);
assert.equal(course.status, "draft");

const drawRes = await api.post("/api/lms/assessment/draw", {
  data: { courseSlug: SLUG },
});
const drawBody = await drawRes.json();
assert.ok(drawRes.ok(), JSON.stringify(drawBody));
assert.equal(drawBody.drawCount, 10);
assert.equal(drawBody.questionBankCount, 17);
assert.equal(drawBody.passMark, 80);
assert.equal(drawBody.questions?.length, 10);

const correctAnswers = {};
for (const q of drawBody.questions) {
  const correct = q.choices.find((c) => c.id === "a") ?? q.choices[0];
  assert.ok(correct?.id, `question ${q.id} has no choices`);
  correctAnswers[q.id] = correct.id;
}

const submitRes = await api.post("/api/lms/assessment/submit", {
  data: {
    courseSlug: SLUG,
    enrolmentId: drawBody.enrolmentId,
    questionIds: drawBody.questions.map((q) => q.id),
    answers: correctAnswers,
  },
});
const submitBody = await submitRes.json();
assert.ok(submitRes.ok(), JSON.stringify(submitBody));
assert.ok(submitBody.score >= 80, `expected passing score, got ${submitBody.score}`);

const enrolRes = await api.post("/api/lms/enrolments", {
  data: { courseSlug: SLUG, start: true },
});
const enrolBody = await enrolRes.json();
assert.ok(enrolRes.ok(), JSON.stringify(enrolBody));

const report = {
  courseId: course.id,
  slug: course.slug,
  status: course.status,
  passMark: course.passMark,
  moduleCount: course.modules.length,
  lessonCount: lessons.length,
  animationLessons: animations.length,
  knowledgeCheckLessons: knowledgeChecks.length,
  questionBankCount: course.questionCount,
  finalDraw: assessment?.content?.drawCount,
  assessmentDrawOk: true,
  assessmentSubmitScore: submitBody.score,
  assessmentPassed: submitBody.passed,
  enrolmentId: enrolBody.enrolment?.id,
  verifiedAt: new Date().toISOString(),
  origin: ORIGIN,
};

fs.writeFileSync(`${ARTIFACT_DIR}/incident-course-verification.json`, JSON.stringify(report, null, 2));

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ storageState: storage, viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

await page.goto(`${ORIGIN}/dashboard?view=portfolio-courses`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(4000);
await page.screenshot({ path: `${ARTIFACT_DIR}/talanton-portfolio-courses-after-repair.png`, fullPage: true });

await page.goto(`${ORIGIN}/dashboard?view=portfolio-courses&course=${encodeURIComponent(SLUG)}`, {
  waitUntil: "domcontentloaded",
});
await page.waitForTimeout(3000);
await page.screenshot({ path: `${ARTIFACT_DIR}/incident-course-admin-review.png`, fullPage: true });

const launchBtn = page.getByRole("button", { name: /preview|launch|open|play/i }).first();
if (await launchBtn.isVisible().catch(() => false)) {
  await launchBtn.click();
  await page.waitForTimeout(6000);
  await page.screenshot({ path: `${ARTIFACT_DIR}/incident-course-player-preview.png`, fullPage: true });
  const playControl = page.getByRole("button", { name: /play|start|next/i }).first();
  if (await playControl.isVisible().catch(() => false)) {
    await playControl.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${ARTIFACT_DIR}/incident-course-animation-playing.png`, fullPage: true });
  }
}

await browser.close();
await api.dispose();

console.log(JSON.stringify(report, null, 2));
