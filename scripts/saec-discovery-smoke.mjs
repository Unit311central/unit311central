/**
 * Lightweight SAEC Discovery smoke test (local only).
 * Run: node scripts/saec-discovery-smoke.mjs
 */
import assert from "node:assert/strict";
import { chromium } from "playwright";

const BASE = process.env.SAEC_DISCOVERY_URL ?? "http://127.0.0.1:3000/saec-discovery";
const STORAGE_KEY = "saec-discovery-v3";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

try {
  await page.goto(BASE, { waitUntil: "networkidle" });

  await page.waitForSelector('text=Current Systems Discovery');
  await page.waitForSelector('button:has-text("Submit")');
  assert.equal(await page.locator('button:has-text("Save Draft")').count(), 0, "no Save Draft button");

  const navCount = await page.locator("nav[aria-label='Discovery sections'] button").count();
  assert.equal(navCount, 15, "expected 15 nav sections");

  assert.equal(await page.locator('text=Next').count(), 0, "no Next button");
  assert.equal(await page.locator('text=Back').count(), 0, "no Back button");

  const generalQ1 = page.locator("#general-top-annoyances");
  await generalQ1.fill("Slow monthly reports");
  await page.waitForFunction(() => {
    const labels = Array.from(document.querySelectorAll("header p"));
    return labels.some((node) => node.textContent?.includes("Draft saved"));
  }, { timeout: 5000 });

  const scrollY = await page.evaluate(() => ({
    doc: document.documentElement.scrollHeight > window.innerHeight,
    body: document.body.scrollHeight > window.innerHeight,
  }));
  assert.equal(scrollY.doc, false, "page should not vertically scroll");
  assert.equal(scrollY.body, false, "body should not vertically scroll");

  await page.getByRole("button", { name: "Client Management", exact: true }).click();
  await page.locator("#client-management-Client\\ Directory").fill("Excel");
  await page.locator("#client-management-comments").fill("Legacy CRM notes");
  await page.waitForFunction(() => {
    const labels = Array.from(document.querySelectorAll("header p"));
    return labels.some((node) => node.textContent?.includes("Draft saved"));
  }, { timeout: 5000 });
  await page.waitForFunction(() => {
    const raw = window.localStorage.getItem("saec-discovery-v3");
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return parsed["client-management"]?.responses?.["Client Directory"] === "Excel";
  });

  await page.getByRole("button", { name: "Reporting", exact: true }).click();
  await page.locator("#reporting-regular-reports").fill("Monthly P&L");
  await page.locator("#reporting-immediate-information").fill("Cash flow");

  await page.getByRole("button", { name: "General", exact: true }).click();
  await page.waitForSelector("#general-top-annoyances");
  assert.equal(await generalQ1.inputValue(), "Slow monthly reports");

  const stored = await page.evaluate(
    (key) => window.localStorage.getItem(key),
    STORAGE_KEY,
  );
  assert.ok(stored, "localStorage draft should exist");
  const parsed = JSON.parse(stored);
  assert.equal(parsed["client-management"]?.responses?.["Client Directory"], "Excel");

  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Client Management", exact: true }).click();
  assert.equal(
    await page.locator("#client-management-Client\\ Directory").inputValue(),
    "Excel",
  );

  console.log("ok  saec-discovery smoke passed");
} finally {
  await browser.close();
}
