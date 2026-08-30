/**
 * Capture SAEC Discovery General section screenshot.
 * Run: node scripts/saec-discovery-screenshot.mjs
 */
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { chromium } from "playwright";

const BASE = process.env.SAEC_DISCOVERY_URL ?? "http://127.0.0.1:3000/saec-discovery";
const OUTPUT = process.env.SAEC_SURVEY_JPG ?? "/home/ubuntu/Desktop/survey.jpg";

mkdirSync(dirname(OUTPUT), { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

try {
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForSelector('text=Current Systems Discovery');
  await page.screenshot({ path: OUTPUT, type: "jpeg", quality: 92, fullPage: false });
  console.log(`saved ${OUTPUT}`);
} finally {
  await browser.close();
}
