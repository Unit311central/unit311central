/**
 * LMS course delete smoke test (Playwright + API).
 * ORIGIN=https://lms-preview.unit311central.com TEST_WORKSPACE_ADMIN_PASSWORD=… node scripts/prove-lms-course-delete-e2e.mjs
 */
import assert from "node:assert/strict";
import { chromium } from "playwright";

const ORIGIN = (process.env.ORIGIN ?? "https://lms-preview.unit311central.com").replace(/\/$/, "");
const PASSWORD = process.env.TEST_WORKSPACE_ADMIN_PASSWORD ?? "";

async function login(page) {
  await page.goto(`${ORIGIN}/login?next=${encodeURIComponent("/dashboard?view=portfolio-courses")}`, {
    timeout: 120_000,
  });
  await page.locator("input[name=username]").fill("paul@unit311central.com");
  await page.locator("input[name=password][type=password]").fill(PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 120_000 });
}

async function main() {
  if (!PASSWORD) throw new Error("TEST_WORKSPACE_ADMIN_PASSWORD required");

  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  const page = await browser.newPage();
  await login(page);

  const cross = await page.evaluate(async () => {
    const res = await fetch("/api/lms/courses/nonexistent-slug-delete-test", {
      method: "DELETE",
      credentials: "include",
    });
    return res.status;
  });
  assert.ok(
    [403, 404, 405].includes(cross),
    `DELETE on missing course should not succeed; got ${cross}`,
  );

  const createRes = await page.evaluate(async () => {
    const res = await fetch("/api/lms/courses", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: `E2E delete draft ${Date.now()}`,
        description: "E2E draft delete smoke test",
        status: "draft",
        modules: [
          {
            title: "Module 1",
            lessons: [
              {
                title: "Intro",
                lessonType: "rich_text",
                content: { type: "rich_text", blocks: [{ kind: "paragraph", text: "Test" }] },
              },
            ],
          },
        ],
      }),
    });
    const data = await res.json();
    return { ok: res.ok, slug: data.course?.slug, status: data.course?.status };
  });
  assert.ok(createRes.ok && createRes.slug, "draft course create failed");
  assert.equal(createRes.status, "draft");

  await page.goto(`${ORIGIN}/dashboard?view=portfolio-courses`, { timeout: 120_000 });
  await page.waitForTimeout(3000);

  const row = page.getByRole("row").filter({ hasText: /E2E delete draft/ }).last();
  await row.waitFor({ state: "visible", timeout: 60_000 });
  await row.getByRole("button", { name: /^delete$/i }).click();
  await page.getByRole("alertdialog").waitFor({ timeout: 10_000 });
  await page.getByRole("button", { name: /delete course/i }).click();
  await page.getByText(/was permanently deleted/i).waitFor({ timeout: 60_000 });

  const gone = await page.evaluate(async (slug) => {
    const res = await fetch(`/api/lms/courses/${encodeURIComponent(slug)}`, {
      credentials: "include",
    });
    return res.status;
  }, createRes.slug);
  assert.ok([403, 404].includes(gone), `deleted course should be gone; GET status ${gone}`);

  const publishFlow = await page.evaluate(async () => {
    const stamp = Date.now();
    const create = await fetch("/api/lms/courses", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: `E2E archive published ${stamp}`,
        description: "E2E published archive smoke test",
        status: "draft",
        modules: [
          {
            title: "Module 1",
            lessons: [
              {
                title: "Intro",
                lessonType: "rich_text",
                content: { type: "rich_text", blocks: [{ kind: "paragraph", text: "Test" }] },
              },
            ],
          },
        ],
      }),
    });
    const created = await create.json();
    const slug = created.course?.slug;
    if (!create.ok || !slug) {
      return { ok: false, step: "create", detail: created };
    }
    const pub = await fetch(`/api/lms/courses/${encodeURIComponent(slug)}/publish`, {
      method: "POST",
      credentials: "include",
    });
    const pubBody = await pub.json();
    if (!pub.ok) {
      return { ok: false, step: "publish", detail: pubBody };
    }
    const del = await fetch(`/api/lms/courses/${encodeURIComponent(slug)}`, {
      method: "DELETE",
      credentials: "include",
    });
    const delBody = await del.json();
    if (!del.ok) {
      return { ok: false, step: "delete", detail: delBody };
    }
    const list = await fetch("/api/lms/courses?all=1&includeStats=1", { credentials: "include" });
    const listBody = await list.json();
    const inList = (listBody.courses ?? []).some((c) => c.slug === slug);
    const get = await fetch(`/api/lms/courses/${encodeURIComponent(slug)}`, {
      credentials: "include",
    });
    const getBody = await get.json();
    return {
      ok: true,
      slug,
      mode: delBody.mode,
      archived: delBody.archived,
      inStaffList: inList,
      getStatus: getBody.course?.status,
      getOk: get.ok,
    };
  });

  assert.ok(publishFlow.ok, `published archive flow failed: ${JSON.stringify(publishFlow)}`);
  assert.equal(publishFlow.mode, "archived");
  assert.equal(publishFlow.archived, true);
  assert.equal(publishFlow.inStaffList, false);
  assert.equal(publishFlow.getStatus, "archived");
  assert.ok(publishFlow.getOk, "archived course should remain retrievable for staff audit");

  await browser.close();
  console.log("prove-lms-course-delete-e2e: OK");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
