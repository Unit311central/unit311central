/**
 * Shared Playwright helpers for Talanton LMS learner E2E.
 */
import assert from "node:assert/strict";
import { request as playwrightRequest } from "playwright";

export const DEFAULT_ORIGIN = "https://lms-preview.unit311central.com";
export const DEFAULT_USERNAME = "paul@unit311central.com";

export function getPassword() {
  return (
    process.env.LMS_E2E_PASSWORD ??
    process.env.DEMO_PROSPECT_PASSWORD ??
    process.env.TEST_WORKSPACE_ADMIN_PASSWORD ??
    ""
  );
}

export async function loginStorageState(origin, username = DEFAULT_USERNAME, password = getPassword()) {
  if (!password) throw new Error("Set TEST_WORKSPACE_ADMIN_PASSWORD or LMS_E2E_PASSWORD.");
  const api = await playwrightRequest.newContext({ baseURL: origin });
  const loginRes = await api.post("/api/auth/login", {
    data: {
      username,
      password,
      next: "/dashboard?view=portfolio-courses",
    },
  });
  if (!loginRes.ok()) {
    await api.dispose();
    throw new Error(`API login failed (${loginRes.status()}): ${await loginRes.text()}`);
  }
  const storageState = await api.storageState();
  await api.dispose();
  return storageState;
}

export async function fetchCourseTree(origin, storageState, slug) {
  const api = await playwrightRequest.newContext({ baseURL: origin, storageState });
  const res = await api.get(`/api/lms/courses/${encodeURIComponent(slug)}`);
  const data = await res.json();
  await api.dispose();
  if (!res.ok() || !data.course) {
    throw new Error(`Failed to load course ${slug}: ${JSON.stringify(data).slice(0, 300)}`);
  }
  return data.course;
}

export function flattenLessons(course) {
  return (course.modules ?? []).flatMap((m) =>
    m.lessons.map((l) => ({
      id: l.id,
      lessonType: l.lessonType,
      title: l.title,
      moduleTitle: m.title,
    })),
  );
}

export async function discoverLearnerFixtureSlug(origin, storageState) {
  const envSlug = process.env.LMS_E2E_FIXTURE_SLUG?.trim();
  if (envSlug) return envSlug;

  const api = await playwrightRequest.newContext({ baseURL: origin, storageState });
  const listRes = await api.get("/api/lms/courses?all=1");
  const list = await listRes.json();
  await api.dispose();
  const candidates = (list.courses ?? []).filter(
    (c) => c.status === "published" && /incident|e2e/i.test(`${c.title} ${c.slug}`),
  );
  for (const row of [...candidates].reverse()) {
    const tree = await fetchCourseTree(origin, storageState, row.slug);
    const flat = flattenLessons(tree);
    const anim = flat.some((l) => l.lessonType === "procedure_animation");
    const kc = flat.filter((l) => l.lessonType === "knowledge_check").length;
    if (anim && kc >= 2) return row.slug;
  }
  return null;
}

export function footerNext(page) {
  return page.locator("footer").getByRole("button", { name: /^next$/i });
}

export async function goToLessonIndex(page, targetIndex) {
  for (let i = 0; i < targetIndex; i++) {
    const next = footerNext(page);
    if (!(await next.isEnabled().catch(() => false))) break;
    await next.click();
    await page.waitForTimeout(650);
  }
}

export async function readStepIndicator(page) {
  const el = page.getByTestId("procedure-animation-step-indicator");
  await el.waitFor({ timeout: 60_000 });
  return (await el.textContent()) ?? "";
}

/**
 * Assert animation advances, and exercise pause / resume / replay.
 */
export async function assertProcedureAnimationPlayer(page, { animLessonId } = {}) {
  const scope = animLessonId
    ? page.locator(`#lesson-${animLessonId}`)
    : page.locator("section").filter({ has: page.getByTestId("procedure-animation-step-indicator") }).first();
  const stepIndicator = scope.getByTestId("procedure-animation-step-indicator");
  await stepIndicator.waitFor({ timeout: 60_000 });

  const step0 = (await stepIndicator.textContent()) ?? "";
  assert.match(step0, /Step \d+ of \d+/, `step indicator missing: ${step0}`);

  const pauseBtn = scope.getByRole("button", { name: /^pause$/i });
  const playBtn = scope.getByRole("button", { name: /^(play|replay)$/i });

  if (await pauseBtn.isVisible().catch(() => false)) {
    await pauseBtn.click();
    const frozen = await stepIndicator.textContent();
    await page.waitForTimeout(2200);
    const still = await stepIndicator.textContent();
    assert.equal(still, frozen, "step should not advance while paused");
    if (await playBtn.isVisible().catch(() => false)) await playBtn.click();
  }

  await page.waitForFunction(
    () => {
      const el = document.querySelector('[data-testid="procedure-animation-step-indicator"]');
      const text = el?.textContent ?? "";
      return /Final state/.test(text) || !/^Step 1 of /.test(text);
    },
    undefined,
    { timeout: 25_000 },
  );

  const progressed = (await stepIndicator.textContent()) ?? "";
  assert.ok(
    /Final state/.test(progressed) || !/^Step 1 of /.test(progressed),
    `animation must progress beyond step 1 (got: ${progressed})`,
  );

  const replay = scope.getByRole("button", { name: /^replay$/i });
  await replay.click();
  await page.waitForFunction(
    () => {
      const el = document.querySelector('[data-testid="procedure-animation-step-indicator"]');
      return /^Step 1 of /.test(el?.textContent ?? "");
    },
    undefined,
    { timeout: 15_000 },
  );
}

export async function answerInlineKnowledgeCheck(page, kcLessonId) {
  const section = page.locator(`#lesson-${kcLessonId}`);
  const prompt = section.getByTestId("knowledge-check-prompt");
  await prompt.waitFor({ timeout: 30_000 });
  const text = await prompt.textContent();
  assert.ok(text && text.length > 10, "knowledge check prompt must be visible");
  await section.getByTestId("knowledge-check-choice").first().click();
  await section.getByText(/correct|not quite/i).first().waitFor({ timeout: 15_000 });
}

export async function submitAssessmentAttempt(page, courseSlug) {
  return page.evaluate(async (slug) => {
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
      drawCount: draw.questions?.length ?? 0,
      submit,
    };
  }, courseSlug);
}
