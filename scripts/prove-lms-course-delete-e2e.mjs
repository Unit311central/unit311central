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
  assert.equal(cross, 404, "unknown slug should 404 not cross-tenant leak");

  const createRes = await page.evaluate(async () => {
    const res = await fetch("/api/lms/courses", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: `E2E delete draft ${Date.now()}`,
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
  assert.equal(gone, 403, "draft course should not be visible after delete (or 404)");

  await browser.close();
  console.log("prove-lms-course-delete-e2e: OK");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
