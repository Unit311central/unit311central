import { chromium } from "playwright";

const USER = "overview@onwardair.tech";
const PASS = "Overview4141&";
const BASE = "https://onwardair.unit311central.com";

async function test(name, fn) {
  try {
    await fn();
    console.log("PASS:", name);
  } catch (error) {
    console.error("FAIL:", name, error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}

const browser = await chromium.launch({ headless: true, channel: "chrome" });

await test("fresh visit shows login only", async () => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(`${BASE}/overview`, { waitUntil: "networkidle", timeout: 60000 });
  const text = await page.innerText("body");
  if (!/Sign in to view|View overview|password/i.test(text)) throw new Error("no login UI");
  if (/Demonstration environment|45 MIN WORKING SESSION/i.test(text)) throw new Error("overview leaked");
  await ctx.close();
});

await test("session without entry gate still requires login", async () => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(`${BASE}/overview/login`, { waitUntil: "networkidle" });
  await page.locator('input[type="password"]').fill(PASS);
  await page.locator('input:not([type="password"])').first().fill(USER);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL("**/overview", { timeout: 30000 });
  const cookies = await ctx.cookies();
  const session = cookies.find((cookie) => cookie.name === "dc_platform_session");
  if (!session) throw new Error("no session after login");
  await ctx.clearCookies();
  await ctx.addCookies([session]);
  await page.goto(`${BASE}/overview`, { waitUntil: "networkidle", timeout: 60000 });
  const url = page.url();
  const text = await page.innerText("body");
  if (!url.includes("/login") && /Demonstration environment/i.test(text)) {
    throw new Error("bypassed with session-only cookie");
  }
  if (!/Sign in to view|password/i.test(text)) {
    throw new Error(`expected login form, got: ${text.slice(0, 120)}`);
  }
  await ctx.close();
});

await test("full login flow reaches overview", async () => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(`${BASE}/overview/login`, { waitUntil: "networkidle" });
  await page.locator('input[type="password"]').fill(PASS);
  await page.locator('input:not([type="password"])').first().fill(USER);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL("**/overview", { timeout: 30000 });
  await page.waitForTimeout(3000);
  const text = await page.innerText("body");
  if (!/Demonstration environment|45 MIN WORKING SESSION/i.test(text)) {
    throw new Error("overview not shown after login");
  }
  await ctx.close();
});

await browser.close();
