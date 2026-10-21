/**
 * Talanton production LMS smoke: PDF → animation → publish → player → assessment → archive cleanup.
 *
 *   ORIGIN=https://talantonimpact.unit311central.com TEST_WORKSPACE_ADMIN_PASSWORD=… \
 *     node scripts/prove-lms-procedure-animation-prod-smoke.mjs
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { chromium, request as playwrightRequest } from "playwright";

const ORIGIN = (process.env.ORIGIN ?? "https://talantonimpact.unit311central.com").replace(
  /\/$/,
  "",
);
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
const SMOKE_MARKER = "PROD smoke disposable";

async function loginStorageState() {
  const api = await playwrightRequest.newContext({ baseURL: ORIGIN });
  const loginRes = await api.post("/api/auth/login", {
    data: {
      username: USERNAME,
      password: PASSWORD,
      next: "/dashboard?view=portfolio-courses",
    },
  });
  const loginBody = await loginRes.json().catch(() => ({}));
  if (!loginRes.ok()) {
    await api.dispose();
    throw new Error(`API login failed (${loginRes.status()}): ${JSON.stringify(loginBody)}`);
  }
  const storageState = await api.storageState();
  await api.dispose();
  if (!storageState.cookies?.length) {
    throw new Error("API login succeeded but returned no session cookies");
  }
  return { loginBody, storageState };
}

async function waitForTalantonSession(page) {
  for (let attempt = 0; attempt < 90; attempt++) {
    const who = await page.evaluate(async () => {
      const res = await fetch("/api/auth/whoami", { credentials: "include", cache: "no-store" });
      const body = await res.json().catch(() => ({}));
      return {
        status: res.status,
        workspaceSlug: String(body.workspaceSlug ?? body.workspace?.slug ?? "").toLowerCase(),
        username: String(body.username ?? "").toLowerCase(),
        userType: body.userType,
      };
    });
    if (
      who.status === 200 &&
      who.workspaceSlug === "talantonimpact" &&
      who.username === USERNAME.toLowerCase()
    ) {
      return who;
    }
    await page.waitForTimeout(1000);
  }
  throw new Error("Timed out waiting for talantonimpact whoami session");
}

async function catalogueSnapshot(page, excludeTitleIncludes) {
  return page.evaluate(async (exclude) => {
    const res = await fetch("/api/lms/courses?all=1&includeStats=1", {
      credentials: "include",
      cache: "no-store",
    });
    const data = await res.json();
    if (!res.ok) {
      return { ok: false, status: res.status, error: data };
    }
    const courses = (data.courses ?? []).filter(
      (c) => !String(c.title ?? "").includes(exclude),
    );
    const fingerprint = courses
      .map((c) => `${c.slug}|${c.status}|${c.title}`)
      .sort()
      .join("\n");
    const certsRes = await fetch("/api/lms/certificates", {
      credentials: "include",
      cache: "no-store",
    });
    const certsBody = await certsRes.json().catch(() => ({}));
    const certNumbers = (certsBody.certificates ?? [])
      .map((c) => String(c.certificateNumber ?? c.number ?? ""))
      .filter(Boolean)
      .sort();
    const enrolRes = await fetch("/api/lms/enrolments", {
      credentials: "include",
      cache: "no-store",
    });
    const enrolBody = await enrolRes.json().catch(() => ({}));
    const enrolmentIds = (enrolBody.enrolments ?? [])
      .map((e) => String(e.id ?? ""))
      .filter(Boolean)
      .sort();
    return {
      ok: true,
      courseCount: courses.length,
      fingerprint,
      certificateCount: certNumbers.length,
      certificateFingerprint: certNumbers.join(","),
      enrolmentCount: enrolmentIds.length,
      enrolmentFingerprint: enrolmentIds.join(","),
    };
  }, excludeTitleIncludes);
}

async function main() {
  if (!PASSWORD) {
    throw new Error("Set TEST_WORKSPACE_ADMIN_PASSWORD or LMS_E2E_PASSWORD.");
  }
  if (!fs.existsSync(PDF_PATH)) {
    throw new Error(`Missing PDF at ${PDF_PATH}`);
  }

  const smokeTitle = `${SMOKE_MARKER} ${Date.now()}`;
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

  const { loginBody, storageState } = await loginStorageState();

  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  const context = await browser.newContext({
    storageState,
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir: ARTIFACT_DIR, size: { width: 1280, height: 720 } },
  });
  const page = await context.newPage();

  console.log(`Production LMS smoke: ${ORIGIN}`);
  console.log(`Smoke course title: ${smokeTitle}`);

  await page.addInitScript((title) => {
    const origFetch = window.fetch.bind(window);
    window.fetch = async (input, init) => {
      const url = typeof input === "string" ? input : input instanceof Request ? input.url : "";
      if (url.includes("/api/lms/generate-from-document") && init?.body instanceof FormData) {
        init.body.append("title", title);
      }
      return origFetch(input, init);
    };
  }, smokeTitle);

  console.log("API login redirect:", loginBody.redirectPath ?? loginBody.appliedReturnTo);
  await page.goto(`${ORIGIN}/dashboard?view=portfolio-courses`, {
    waitUntil: "domcontentloaded",
    timeout: 120_000,
  });
  const session = await waitForTalantonSession(page);
  console.log("Session:", JSON.stringify(session));

  const baseline = await catalogueSnapshot(page, SMOKE_MARKER);
  assert.ok(baseline.ok, `baseline catalogue failed: ${JSON.stringify(baseline)}`);
  fs.writeFileSync(
    `${ARTIFACT_DIR}/lms-prod-smoke-baseline.json`,
    JSON.stringify(baseline, null, 2),
  );
  console.log(`Baseline catalogue: ${baseline.courseCount} courses (excl. smoke)`);

  await page.goto(`${ORIGIN}/dashboard?view=portfolio-courses`, {
    waitUntil: "domcontentloaded",
    timeout: 120_000,
  });
  await page.waitForTimeout(3000);

  const uploadBtn = page.getByRole("button", { name: /upload pdf/i });
  await uploadBtn.waitFor({ state: "visible", timeout: 60_000 });
  await page.locator('input[type="file"]').setInputFiles(PDF_PATH);

  await page
    .getByRole("heading", { name: /review before publishing/i })
    .waitFor({ timeout: 300_000 });
  await page.screenshot({ path: `${ARTIFACT_DIR}/lms-prod-smoke-01-review.png` });

  const previewSection = page.getByText("Animation preview");
  await previewSection.waitFor({ timeout: 60_000 });
  await previewSection.scrollIntoViewIfNeeded();
  await page.getByRole("button", { name: /^(play|replay)$/i }).first().click();
  await page.waitForTimeout(3500);
  await page.screenshot({ path: `${ARTIFACT_DIR}/lms-prod-smoke-02-animation.png` });

  await page.getByRole("button", { name: /publish course/i }).click();
  await page.getByText(/is published and listed below/i).waitFor({ timeout: 120_000 });

  const publishedSlug = await page.evaluate(async (title) => {
    const res = await fetch("/api/lms/courses?all=1&includeStats=1", { credentials: "include" });
    const data = await res.json();
    const matches = (data.courses ?? []).filter(
      (c) => c.status === "published" && String(c.title ?? "") === title,
    );
    return matches.length ? matches[matches.length - 1].slug : null;
  }, smokeTitle);
  assert.ok(publishedSlug, "published smoke course slug not found");

  const courseRow = page.getByRole("row").filter({ hasText: smokeTitle }).last();
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
  await page.screenshot({ path: `${ARTIFACT_DIR}/lms-prod-smoke-03-player.png` });

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
  assert.ok(assessment.ok, `assessment failed: ${JSON.stringify(assessment)}`);
  assert.ok(assessment.drawCount >= 1);
  assert.ok(assessment.submit.attemptId);

  await page.goto(`${ORIGIN}/dashboard?view=portfolio-courses`, {
    waitUntil: "domcontentloaded",
    timeout: 120_000,
  });
  await page.waitForTimeout(3000);
  const deleteRow = page.getByRole("row").filter({ hasText: smokeTitle }).last();
  await deleteRow.waitFor({ state: "visible", timeout: 60_000 });
  await deleteRow.getByRole("button", { name: /^delete$/i }).click();
  await page.getByRole("alertdialog").waitFor({ timeout: 15_000 });
  await page.getByRole("button", { name: /remove from catalogue/i }).click();
  await page
    .getByText(/removed from the catalogue\. Learner compliance records were kept/i)
    .waitFor({ timeout: 60_000 });

  const archived = await page.evaluate(async (slug) => {
    const res = await fetch(`/api/lms/courses/${encodeURIComponent(slug)}`, {
      credentials: "include",
    });
    const body = await res.json();
    return { ok: res.ok, status: body.course?.status };
  }, publishedSlug);
  assert.equal(archived.status, "archived", JSON.stringify(archived));

  const after = await catalogueSnapshot(page, SMOKE_MARKER);
  assert.ok(after.ok, JSON.stringify(after));
  assert.equal(after.fingerprint, baseline.fingerprint, "catalogue fingerprint must match baseline");
  assert.equal(
    after.certificateFingerprint,
    baseline.certificateFingerprint,
    "existing certificate set must be unchanged",
  );
  assert.equal(
    after.enrolmentFingerprint,
    baseline.enrolmentFingerprint,
    "existing enrolment set for user must be unchanged after archive",
  );

  fs.writeFileSync(
    `${ARTIFACT_DIR}/lms-prod-smoke-result.json`,
    JSON.stringify(
      {
        origin: ORIGIN,
        smokeTitle,
        publishedSlug,
        assessment,
        archived,
        baselineCourseCount: baseline.courseCount,
        afterCourseCount: after.courseCount,
      },
      null,
      2,
    ),
  );

  const video = page.video();
  const dest = `${ARTIFACT_DIR}/lms-prod-smoke.webm`;
  if (video) {
    await Promise.race([
      video.saveAs(dest),
      new Promise((_, reject) => setTimeout(() => reject(new Error("video timeout")), 45_000)),
    ]).then(
      () => console.log(`Saved ${dest}`),
      () => console.warn("Skipped video save"),
    );
  }

  await context.close();
  await browser.close();
  console.log("prove-lms-procedure-animation-prod-smoke: OK");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
