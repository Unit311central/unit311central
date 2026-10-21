/**
 * Repair Talanton "Incident Reporting & Escalation Training" on production via staff API.
 * Uses the canonical incident-reporting PDF (same as LMS smoke tests), not the text fixture.
 *
 *   node scripts/generate-lms-test-pdf.mjs
 *   TEST_WORKSPACE_ADMIN_PASSWORD=… node scripts/repair-talanton-incident-reporting-prod.mjs
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { request as playwrightRequest } from "playwright";

const ORIGIN = (process.env.ORIGIN ?? "https://talantonimpact.unit311central.com").replace(/\/$/, "");
const USERNAME = process.env.LMS_E2E_USERNAME ?? "paul@unit311central.com";
const PASSWORD =
  process.env.LMS_E2E_PASSWORD ??
  process.env.TEST_WORKSPACE_ADMIN_PASSWORD ??
  "";
const PDF_PATH =
  process.env.INCIDENT_REPORTING_PDF ??
  "/opt/cursor/artifacts/Talanton_Sample_Compliance_Procedure_Incident_Reporting.pdf";
const TITLE_PATTERN = /incident reporting.*escalation/i;

if (!PASSWORD) {
  console.error("Set TEST_WORKSPACE_ADMIN_PASSWORD or LMS_E2E_PASSWORD");
  process.exit(1);
}
if (!fs.existsSync(PDF_PATH)) {
  console.error(`Missing PDF at ${PDF_PATH}. Run: node scripts/generate-lms-test-pdf.mjs`);
  process.exit(1);
}

const api = await playwrightRequest.newContext({ baseURL: ORIGIN });
const loginRes = await api.post("/api/auth/login", {
  data: {
    username: USERNAME,
    password: PASSWORD,
    next: "/dashboard?view=portfolio-courses",
  },
});
assert.ok(loginRes.ok(), `login failed: ${loginRes.status()}`);

const listRes = await api.get("/api/lms/courses?all=1&includeStats=1");
const listBody = await listRes.json();
assert.ok(listRes.ok(), JSON.stringify(listBody));
const course = (listBody.courses ?? []).find((c) => TITLE_PATTERN.test(String(c.title)));
if (!course) {
  console.error("Incident Reporting course not found in catalogue");
  process.exit(1);
}

const beforeId = course.id;
const beforeSlug = course.slug;
const beforeStatus = course.status;

const form = new FormData();
const pdfBytes = fs.readFileSync(PDF_PATH);
form.append("file", new Blob([pdfBytes], { type: "application/pdf" }), path.basename(PDF_PATH));
form.append("forceFiveModules", "1");

const repairRes = await api.post(
  `/api/lms/courses/${encodeURIComponent(beforeSlug)}/repair-from-document`,
  {
    multipart: form,
    timeout: 180_000,
  },
);
const repairBody = await repairRes.json();
if (!repairRes.ok()) {
  console.error("Repair failed:", repairRes.status(), repairBody);
  process.exit(1);
}

assert.equal(repairBody.preserved?.courseId, beforeId);
assert.equal(repairBody.preserved?.slug, beforeSlug);
assert.equal(repairBody.preserved?.status, beforeStatus);

const treeRes = await api.get(`/api/lms/courses/${encodeURIComponent(beforeSlug)}`);
const treeBody = await treeRes.json();
assert.ok(treeRes.ok());

const modules = treeBody.course?.modules ?? [];
const lessons = modules.flatMap((m) => m.lessons ?? []);
const animations = lessons.filter((l) => l.lessonType === "procedure_animation");
const assessment = lessons.find((l) => l.content?.type === "assessment");

console.log(
  JSON.stringify(
    {
      courseId: beforeId,
      slug: beforeSlug,
      status: beforeStatus,
      moduleCount: modules.length,
      lessonCount: lessons.length,
      animationLessons: animations.length,
      questionBankCount: repairBody.stats?.questionBankCount,
      finalDraw: assessment?.content?.drawCount,
      passMark: treeBody.course?.passMark,
    },
    null,
    2,
  ),
);

await api.dispose();
