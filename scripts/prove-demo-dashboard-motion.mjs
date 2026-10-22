/**
 * Demo workspace dashboard motion smoke (API + DOM markers).
 *
 *   ORIGIN=https://demo.unit311central.com TEST_WORKSPACE_ADMIN_PASSWORD=… \
 *     node scripts/prove-demo-dashboard-motion.mjs
 */
import assert from "node:assert/strict";
import { chromium } from "playwright";

const ORIGIN = (process.env.ORIGIN ?? "https://demo.unit311central.com").replace(/\/$/, "");
const USERNAME = process.env.DEMO_PROSPECT_USERNAME ?? "demo@unit311central.com";
const PASSWORD =
  process.env.DEMO_PROSPECT_PASSWORD ??
  process.env.TEST_WORKSPACE_ADMIN_PASSWORD ??
  "Letmein2026$";

const VIEWS = [
  { view: "sales-management", label: "Sales" },
  { view: "fundraising-dashboard", label: "Fundraising" },
  { view: "operations-dashboard", label: "Operations" },
  { view: "hr-dashboard", label: "Human Resources" },
  { view: "marketing-dashboard", label: "Marketing" },
  { view: "marketing-events", label: "Events external" },
  { view: "marketing-event-management", label: "Events managed" },
  { view: "support-overview", label: "Support" },
  { view: "engineering-dashboard", label: "Engineering" },
];

async function login(page) {
  await page.goto(`${ORIGIN}/login?next=${encodeURIComponent("/dashboard?view=home")}`, {
    waitUntil: "domcontentloaded",
    timeout: 120_000,
  });
  await page.locator("input[name=username]").fill(USERNAME);
  await page.locator("input[name=password][type=password]").fill(PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 120_000 });
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await login(page);

for (const item of VIEWS) {
  await page.goto(`${ORIGIN}/dashboard?view=${encodeURIComponent(item.view)}`, {
    waitUntil: "domcontentloaded",
    timeout: 120_000,
  });
  await page.waitForTimeout(2500);
  const kpiMarkers = await page.locator("[data-demo-dashboard-kpi]").count();
  assert.ok(kpiMarkers >= 1, `${item.label}: expected KPI motion markers, got ${kpiMarkers}`);
  console.log(`OK ${item.label} (${item.view}) kpi markers=${kpiMarkers}`);
}

await browser.close();
console.log("prove-demo-dashboard-motion: all views OK");
