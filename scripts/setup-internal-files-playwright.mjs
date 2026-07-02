import { readFileSync } from "node:fs";
import { join } from "node:path";

import { chromium } from "playwright";

const migrationSql = readFileSync(
  join(process.cwd(), "supabase/migrations/002_create_internal_files.sql"),
  "utf8",
);

const chromeUserData = "C:\\Users\\Usuario\\AppData\\Local\\Google\\Chrome\\User Data";

/** @type {import('playwright').BrowserContext} */
let context;
let browser;

try {
  context = await chromium.launchPersistentContext(chromeUserData, {
    channel: "chrome",
    headless: false,
    slowMo: 40,
    args: ["--profile-directory=Default"],
  });
} catch {
  browser = await chromium.launch({ headless: false, slowMo: 40 });
  context = await browser.newContext();
}

const page = context.pages()[0] ?? (await context.newPage());

try {
  await page.goto("https://supabase.com/dashboard/projects", {
    waitUntil: "domcontentloaded",
    timeout: 120_000,
  });

  const loginDeadline = Date.now() + 180_000;
  while (Date.now() < loginDeadline) {
    const url = page.url();
    if (!url.includes("/sign-in") && !url.includes("/login")) {
      break;
    }
    console.log("Waiting for Supabase login... sign in in the browser window.");
    await page.waitForTimeout(5000);
  }

  const projectLink = page.locator('a[href*="/project/"]').first();
  await projectLink.waitFor({ timeout: 180_000 });
  await projectLink.click();

  await page.waitForURL(/\/project\/[^/]+/, { timeout: 60_000 });

  const projectUrl = page.url().replace(/\/$/, "");
  await page.goto(`${projectUrl}/sql/new`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForTimeout(4000);

  const editor = page.locator(".monaco-editor textarea").first();
  await editor.waitFor({ timeout: 60_000 });
  await editor.click();
  await page.keyboard.press("Control+A");
  await page.keyboard.insertText(migrationSql);

  const runButton = page.getByRole("button", { name: /^run$/i }).first();
  await runButton.click();

  await page.waitForTimeout(8000);

  const bodyText = await page.locator("body").innerText();
  if (/success|completed|no rows/i.test(bodyText)) {
    console.log("Migration ran successfully in Supabase SQL editor.");
  } else {
    console.log("Migration submitted. Verify success in the Supabase SQL editor panel.");
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await page.waitForTimeout(3000);
  await context.close();
  if (browser) {
    await browser.close();
  }
}
