/**
 * Verify repaired Incident Reporting course on Talanton production (draft).
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
const assessment = lessons.find((l) => l.content?.type === "assessment");

const report = {
  courseId: course.id,
  slug: course.slug,
  status: course.status,
  passMark: course.passMark,
  moduleCount: course.modules.length,
  lessonCount: lessons.length,
  animationLessons: animations.length,
  finalDraw: assessment?.content?.drawCount,
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

// Open player if a Preview/Launch control exists
const preview = page.getByRole("button", { name: /preview|launch|open course/i }).first();
if (await preview.isVisible().catch(() => false)) {
  await preview.click();
  await page.waitForTimeout(5000);
  await page.screenshot({ path: `${ARTIFACT_DIR}/incident-course-player-preview.png`, fullPage: true });
}

await browser.close();
await api.dispose();

console.log(JSON.stringify(report, null, 2));
