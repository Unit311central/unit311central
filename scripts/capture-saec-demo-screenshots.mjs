/**
 * Capture key SAEC demo screenshots for client presentation.
 */
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const ORIGIN = "https://saec.unit311central.com";
const USER = process.env.SAEC_DEMO_USERNAME ?? "admin@saec.biz";
const PASSWORD = process.env.SAEC_DEMO_PASSWORD ?? "";
const OUT = "/opt/cursor/artifacts";

const PAGES = [
  { name: "login", path: "/login", auth: false },
  { name: "home", path: "/dashboard?view=home", wait: "Units Under Management" },
  { name: "installations-map-elevators", path: "/dashboard?view=saec-installations-dashboard", wait: "SAEC Installation Footprint" },
  { name: "business-central", path: "/dashboard?view=business-central-dashboard", wait: "Business Central" },
  { name: "finances", path: "/dashboard?view=financials", wait: "Finances" },
];

async function login(context) {
  await context.request.post(`${ORIGIN}/api/auth/login`, {
    data: { username: USER, password: PASSWORD, returnTo: ORIGIN, next: "/dashboard" },
  });
}

async function capture(name, width, height) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width, height } });
  await login(context);
  const page = await context.newPage();
  for (const entry of PAGES) {
    if (entry.name === "login") {
      const loginPage = await browser.newPage({ viewport: { width, height } });
      await loginPage.goto(`${ORIGIN}/login`, { waitUntil: "domcontentloaded", timeout: 60000 });
      await loginPage.waitForTimeout(2000);
      await loginPage.screenshot({ path: `${OUT}/saec-demo-${name}-login.png` });
      await loginPage.close();
      continue;
    }
    await page.goto(`${ORIGIN}${entry.path}`, { waitUntil: "domcontentloaded", timeout: 90000 });
    if (entry.wait) await page.waitForSelector(`text=${entry.wait}`, { timeout: 60000 });
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `${OUT}/saec-demo-${name}-${entry.name}.png` });
  }
  // escalators toggle
  await page.goto(`${ORIGIN}/dashboard?view=saec-installations-dashboard`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("text=SAEC Installation Footprint", { timeout: 60000 });
  await page.locator("section").filter({ hasText: "Installations Dashboard" }).getByRole("button", { name: "Escalators" }).click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/saec-demo-${name}-installations-escalators.png` });
  // johannesburg drill-down
  await page.locator("section").filter({ hasText: "Installations Dashboard" }).getByRole("button", { name: "Elevators" }).click();
  await page.waitForTimeout(800);
  await page.locator("g.cursor-pointer").filter({ hasText: "Johannesburg" }).click({ force: true });
  await page.waitForSelector("text=Recent installations", { timeout: 30000 });
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/saec-demo-${name}-johannesburg-drilldown.png` });
  await browser.close();
  console.log("saved", name);
}

async function main() {
  if (!PASSWORD) throw new Error("SAEC_DEMO_PASSWORD required");
  await mkdir(OUT, { recursive: true });
  await capture("1366x768", 1366, 768);
  await capture("1440x900", 1440, 900);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
