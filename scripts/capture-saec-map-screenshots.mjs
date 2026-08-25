/**
 * Capture SAEC installations map screenshots at laptop breakpoints.
 * Usage: SAEC_DEMO_PASSWORD='...' node scripts/capture-saec-map-screenshots.mjs
 */
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const ORIGIN = "https://saec.unit311central.com";
const USER = process.env.SAEC_DEMO_USERNAME ?? "admin@saec.biz";
const PASSWORD = process.env.SAEC_DEMO_PASSWORD ?? "";

const OUT_DIR = "/opt/cursor/artifacts";

async function login(context) {
  const response = await context.request.post(`${ORIGIN}/api/auth/login`, {
    data: {
      username: USER,
      password: PASSWORD,
      returnTo: ORIGIN,
      next: "/dashboard",
    },
  });
  if (!response.ok()) {
    throw new Error(`login failed: ${response.status()}`);
  }
}

async function openDashboard(page) {
  await page.goto(`${ORIGIN}/dashboard?view=saec-installations-dashboard`, {
    waitUntil: "domcontentloaded",
    timeout: 90000,
  });
  await page.waitForSelector("text=SAEC Installation Footprint", { timeout: 90000 });
  await page.waitForFunction(
    () => document.querySelectorAll("svg path[fill]").length >= 5,
    { timeout: 90000 },
  );
  await page.waitForTimeout(1500);
}

async function capture(label, width, height, action) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width, height } });
  await login(context);
  const page = await context.newPage();
  await openDashboard(page);
  if (action) await action(page);
  const path = `${OUT_DIR}/saec-map-${label}.png`;
  await page.screenshot({ path, fullPage: false });
  await browser.close();
  console.log("saved", path);
}

async function main() {
  if (!PASSWORD) throw new Error("SAEC_DEMO_PASSWORD required");
  await mkdir(OUT_DIR, { recursive: true });
  await capture("1366x768", 1366, 768);
  await capture("1440x900", 1440, 900);
  await capture("1366x768-escalators", 1366, 768, async (page) => {
    await page.locator("section").filter({ hasText: "Installations Dashboard" }).getByRole("button", { name: "Escalators" }).click();
    await page.waitForTimeout(1200);
  });
  await capture("1366x768-johannesburg", 1366, 768, async (page) => {
    await page.locator("g.cursor-pointer").filter({ hasText: "Johannesburg" }).click({ force: true });
    await page.waitForSelector("text=Engineers Assigned", { timeout: 30000 });
    await page.waitForTimeout(800);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
