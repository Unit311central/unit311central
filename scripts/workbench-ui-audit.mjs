/**
 * Screenshot audit for Real-Time Video workbench tabs.
 * Run: node scripts/workbench-ui-audit.mjs
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const ARTIFACTS = "/opt/cursor/artifacts";
const BASE = process.env.WORKBENCH_BASE_URL ?? "http://internal.localhost:3000";
const URL = `${BASE}/?view=realtime-video-pipeline`;

const TABS = [
  "Overview",
  "Master Pipeline",
  "Flight Scenarios",
  "Mission Profiles",
  "Video & Bandwidth",
  "Cost Calculator",
  "Latency & Success",
  "Living Architectures",
  "Assumptions",
  "Test Runs",
  "Failure & Resilience",
  "Architecture Options",
];

fs.mkdirSync(ARTIFACTS, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1600, height: 900 },
  ignoreHTTPSErrors: true,
});
const page = await context.newPage();

const results = [];
await page.goto(URL, { waitUntil: "networkidle", timeout: 120_000 });
await page.screenshot({ path: path.join(ARTIFACTS, "workbench-initial-load.png"), fullPage: true });

const bodyText = await page.textContent("body");
const onLogin = bodyText?.toLowerCase().includes("sign in") || bodyText?.toLowerCase().includes("log in");

if (onLogin) {
  results.push({ status: "blocked", note: "Login required — cannot audit authenticated UI in headless run" });
  fs.writeFileSync(path.join(ARTIFACTS, "workbench-ui-audit.json"), JSON.stringify(results, null, 2));
  console.log("Login blocked UI audit");
  await browser.close();
  process.exit(0);
}

const navVisible = await page.getByText("Engineering Workbench").isVisible().catch(() => false);
results.push({ check: "Engineering Workbench nav", pass: navVisible });

if (navVisible) {
  await page.screenshot({ path: path.join(ARTIFACTS, "workbench-nav-12-tabs.png"), fullPage: false });
  for (const label of TABS) {
    const btn = page.getByRole("button", { name: label });
    const visible = await btn.isVisible().catch(() => false);
    if (visible) {
      await btn.click();
      await page.waitForTimeout(800);
      const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      await page.screenshot({
        path: path.join(ARTIFACTS, `workbench-tab-${slug}.png`),
        fullPage: true,
      });
      results.push({ tab: label, pass: true });
    } else {
      results.push({ tab: label, pass: false, note: "Tab button not visible" });
    }
  }
}

fs.writeFileSync(path.join(ARTIFACTS, "workbench-ui-audit.json"), JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
await browser.close();
