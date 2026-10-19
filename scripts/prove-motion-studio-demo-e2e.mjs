/**
 * Motion Studio Content Studio E2E (Playwright).
 *
 * Usage:
 *   ORIGIN=https://demo.unit311central.com node scripts/prove-motion-studio-demo-e2e.mjs
 *
 * Optional: read Vercel preview from /tmp/preview-url.txt if ORIGIN unset.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import { chromium } from "playwright";

const PROMPT =
  "Create a 30-second animated walkthrough explaining how Unit311Central manages a sales opportunity, from initial contact through deal closure.";

const USERNAME = process.env.DEMO_PROSPECT_USERNAME ?? "demo@unit311central.com";
const PASSWORD = process.env.DEMO_PROSPECT_PASSWORD ?? "Letmein2026$";

function resolveOrigin() {
  if (process.env.ORIGIN) return process.env.ORIGIN.replace(/\/$/, "");
  if (fs.existsSync("/tmp/preview-url.txt")) {
    return fs.readFileSync("/tmp/preview-url.txt", "utf8").trim();
  }
  return "https://demo.unit311central.com";
}

const ORIGIN = resolveOrigin();
const ARTIFACT_DIR = "/opt/cursor/artifacts";

async function main() {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir: ARTIFACT_DIR, size: { width: 1280, height: 720 } },
  });
  const page = await context.newPage();

  console.log(`E2E origin: ${ORIGIN}`);

  await page.goto(
    `${ORIGIN}/login?next=${encodeURIComponent("/dashboard?view=content-studio")}`,
    { waitUntil: "domcontentloaded", timeout: 120_000 },
  );
  await page.locator("input[name=username]").fill(USERNAME);
  await page.locator("input[name=password][type=password]").fill(PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 90_000 });
  await page.waitForLoadState("networkidle", { timeout: 90_000 }).catch(() => {});

  if (!page.url().includes("content-studio")) {
    await page.goto(`${ORIGIN}/dashboard?view=content-studio`, {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    await page.waitForLoadState("networkidle", { timeout: 60_000 }).catch(() => {});
  }

  await page.screenshot({ path: `${ARTIFACT_DIR}/demo-motion-studio-01-content-studio.png` });

  const eaButton = page
    .locator('[data-ai-target="ai-assistant"]')
    .filter({ has: page.locator(":visible") })
    .first();
  if ((await eaButton.count()) === 0) {
    await page.getByRole("button", { name: /open .* assistant/i }).first().click();
  } else {
    await eaButton.click();
  }
  await page.waitForTimeout(1500);

  const textarea = page.locator('textarea, input[type="text"]').filter({ hasNot: page.locator("[name=username]") }).last();
  await textarea.fill(PROMPT);
  await page.getByRole("button", { name: /send message|send/i }).last().click();

  await page.waitForFunction(
    () =>
      document.querySelector('[data-testid="motion-studio-modal"]') ||
      document.querySelector('[data-testid="motion-studio-player"]') ||
      document.querySelector('[data-testid="motion-studio-preview-inline"]') ||
      Array.from(document.querySelectorAll("button")).some((b) => /open animation/i.test(b.textContent || "")) ||
      document.querySelector('[role="region"][aria-label="Animation canvas"]') ||
      document.querySelector('[role="region"][aria-label="Animation preview"]'),
    { timeout: 180_000 },
  );

  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${ARTIFACT_DIR}/demo-motion-studio-02-ea-response.png` });

  const modal = page.locator('[data-testid="motion-studio-modal"]');
  if ((await modal.count()) === 0) {
    const reopen = page.getByRole("button", { name: /open animation/i });
    if ((await reopen.count()) > 0) {
      await reopen.first().click();
      await modal.waitFor({ state: "visible", timeout: 15_000 });
    }
  }

  if ((await modal.count()) === 0) {
    const legacyPreview = page.locator('[role="region"][aria-label="Animation preview"]');
    if ((await legacyPreview.count()) > 0) {
      throw new Error(
        "Production still serves legacy embedded Motion Studio card (PR #70 modal not deployed yet).",
      );
    }
  }

  assert.ok((await modal.count()) > 0, "Motion Studio modal should open after generation");

  const canvas = modal.locator('[data-testid="motion-studio-canvas"]');
  await page.waitForFunction(
    () => {
      const node = document.querySelector('[data-testid="motion-studio-modal"] [data-testid="motion-studio-canvas"]');
      return node && node.getAttribute("data-playing") === "true";
    },
    { timeout: 20_000 },
  );

  const t0 = Number(await canvas.getAttribute("data-time-ms"));
  await page.waitForTimeout(2000);
  const t1 = Number(await canvas.getAttribute("data-time-ms"));
  assert.ok(t1 > t0 + 300, "modal timeline should advance during auto-play");

  await page.screenshot({ path: `${ARTIFACT_DIR}/demo-motion-studio-03-modal-playing.png` });

  await modal.getByTestId("motion-studio-play-pause").click();
  await page.waitForFunction(
    () => {
      const node = document.querySelector(
        '[data-testid="motion-studio-modal"] [data-testid="motion-studio-canvas"]',
      );
      return node && node.getAttribute("data-playing") === "false";
    },
    { timeout: 5_000 },
  );
  await page.waitForTimeout(1200);
  assert.equal(await canvas.getAttribute("data-playing"), "false", "pause should stop playback");

  await modal.getByTestId("motion-studio-restart").click();
  await page.waitForFunction(
    () => {
      const node = document.querySelector(
        '[data-testid="motion-studio-modal"] [data-testid="motion-studio-canvas"]',
      );
      return node && Number(node.getAttribute("data-time-ms")) < 250;
    },
    { timeout: 5_000 },
  );

  await modal.getByTestId("motion-studio-modal-close").click();
  await modal.waitFor({ state: "detached", timeout: 10_000 });
  await page.screenshot({ path: `${ARTIFACT_DIR}/demo-motion-studio-04-after-close.png` });

  await page.locator('[data-testid="motion-studio-modal"]').waitFor({ state: "detached" });
  await page.getByRole("button", { name: /open animation/i }).first().click({ force: true });
  await modal.waitFor({ state: "visible", timeout: 15_000 });

  const videoPath = await page.video().path();
  await context.close();
  await browser.close();
  fs.renameSync(videoPath, `${ARTIFACT_DIR}/demo-motion-studio-e2e.webm`);

  console.log("ok  prove-motion-studio-demo-e2e passed");
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
