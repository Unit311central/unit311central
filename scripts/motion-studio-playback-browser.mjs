/**
 * Browser-level Motion Studio playback smoke (development server).
 *
 * Usage:
 *   npm run dev   # separate terminal
 *   node scripts/motion-studio-playback-browser.mjs
 *
 * Optional: MOTION_STUDIO_LAB_URL=http://127.0.0.1:3000/dev/motion-studio-lab
 */
import assert from "node:assert/strict";
import { chromium } from "playwright";

const BASE =
  process.env.MOTION_STUDIO_LAB_URL ?? "http://127.0.0.1:3000/dev/motion-studio-lab";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

try {
  await page.goto(BASE, { waitUntil: "networkidle", timeout: 120_000 });
  await page.waitForSelector('[data-testid="motion-studio-player"]');

  const canvas = page.locator('[data-testid="motion-studio-canvas"]');
  await page.getByTestId("motion-studio-play-pause").click();

  const t0 = Number(await canvas.getAttribute("data-time-ms"));
  await page.waitForFunction(
    (sel) => {
      const node = document.querySelector(sel);
      if (!node) return false;
      return Number(node.getAttribute("data-time-ms")) > 400;
    },
    '[data-testid="motion-studio-canvas"]',
    { timeout: 15_000 },
  );
  const t1 = Number(await canvas.getAttribute("data-time-ms"));
  assert.ok(t1 > t0, "timeline should advance during playback");

  await page.getByTestId("motion-studio-play-pause").click();
  const frozen = Number(await canvas.getAttribute("data-time-ms"));
  await page.waitForTimeout(600);
  const still = Number(await canvas.getAttribute("data-time-ms"));
  assert.equal(still, frozen, "pause should freeze timeline");

  await page.getByTestId("motion-studio-restart").click();
  await page.waitForFunction(
    (sel) => {
      const node = document.querySelector(sel);
      return node && Number(node.getAttribute("data-time-ms")) < 200;
    },
    '[data-testid="motion-studio-canvas"]',
    { timeout: 5_000 },
  );
  assert.equal(await canvas.getAttribute("data-scene-id"), "contact");

  await page.getByTestId("motion-studio-lab-open-modal").click();
  await page.waitForSelector('[data-testid="motion-studio-modal"]');
  const modalCanvas = page.locator('[data-testid="motion-studio-modal"] [data-testid="motion-studio-canvas"]');
  await page.waitForFunction(
    () => {
      const node = document.querySelector('[data-testid="motion-studio-modal"] [data-testid="motion-studio-canvas"]');
      return node && node.getAttribute("data-playing") === "true";
    },
    { timeout: 10_000 },
  );
  await page.getByTestId("motion-studio-modal-close").click();
  await page.waitForSelector('[data-testid="motion-studio-modal"]', { state: "detached" });

  const opacityChanged = await page.evaluate(async () => {
    const canvasEl = document.querySelector('[data-testid="motion-studio-canvas"]');
    if (!canvasEl) return false;
    const readMinOpacity = () => {
      const nodes = canvasEl.querySelectorAll("[style]");
      let min = 1;
      for (const el of nodes) {
        const op = getComputedStyle(el).opacity;
        min = Math.min(min, Number(op));
      }
      return min;
    };
    const start = readMinOpacity();
    await new Promise((r) => setTimeout(r, 1200));
    const end = readMinOpacity();
    return end < start || end < 0.99;
  });
  assert.ok(opacityChanged, "expected visible opacity motion in canvas");

  console.log("ok  motion-studio-playback-browser passed");
} finally {
  await browser.close();
}
