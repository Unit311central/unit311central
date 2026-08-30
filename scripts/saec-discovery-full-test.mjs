/**
 * SAEC Discovery full field + viewport test (local only).
 * Run: node scripts/saec-discovery-full-test.mjs
 */
import assert from "node:assert/strict";
import { chromium } from "playwright";
import {
  SAEC_DISCOVERY_COMMENTS_KEY,
  SAEC_DISCOVERY_SECTIONS,
  responseKeysForSection,
} from "../src/lib/saec-discovery/config.ts";

const BASE = process.env.SAEC_DISCOVERY_URL ?? "http://127.0.0.1:3000/saec-discovery";
const STORAGE_KEY = "saec-discovery-v3";
const VIEWPORTS = [
  { width: 1280, height: 720, name: "1280x720" },
  { width: 1366, height: 768, name: "1366x768" },
  { width: 1440, height: 900, name: "1440x900" },
];

function fieldSelector(sectionId, key) {
  if (key === SAEC_DISCOVERY_COMMENTS_KEY) {
    return `[id="${sectionId}-comments"]`;
  }
  const section = SAEC_DISCOVERY_SECTIONS.find((entry) => entry.id === sectionId);
  if (section?.kind === "general" || section?.kind === "reporting") {
    return `#${sectionId}-${key}`;
  }
  const attr = `${sectionId}-${key}`.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return `[id="${attr}"]`;
}

async function assertNoScroll(page) {
  const scroll = await page.evaluate(() => {
    const main = document.querySelector("main");
    return {
      docY: document.documentElement.scrollHeight > window.innerHeight,
      docX: document.documentElement.scrollWidth > window.innerWidth,
      bodyY: document.body.scrollHeight > window.innerHeight,
      bodyX: document.body.scrollWidth > window.innerWidth,
      mainY: main ? main.scrollHeight > main.clientHeight : false,
      mainX: main ? main.scrollWidth > main.clientWidth : false,
    };
  });
  assert.equal(scroll.docY, false, "document vertical scroll");
  assert.equal(scroll.docX, false, "document horizontal scroll");
  assert.equal(scroll.bodyY, false, "body vertical scroll");
  assert.equal(scroll.bodyX, false, "body horizontal scroll");
  assert.equal(scroll.mainY, false, "main panel vertical scroll");
  assert.equal(scroll.mainX, false, "main panel horizontal scroll");
}

async function typeInField(page, selector, value) {
  const field = page.locator(selector);
  await field.waitFor({ state: "visible" });
  await field.click();
  await field.fill(value);
  assert.equal(await field.inputValue(), value, `field ${selector} accepts input`);
  await field.fill("");
  assert.equal(await field.inputValue(), "", `field ${selector} can be cleared`);
  await field.fill(value);
  assert.equal(await field.inputValue(), value, `field ${selector} can be edited`);
}

const browser = await chromium.launch({ headless: true });

try {
  for (const viewport of VIEWPORTS) {
    const page = await browser.newPage({ viewport });
    await page.goto(BASE, { waitUntil: "networkidle" });
    await page.waitForSelector("text=Current Systems Discovery");

    assert.equal(await page.locator('text=Next').count(), 0, "no Next button");
    assert.equal(await page.locator('text=Back').count(), 0, "no Back button");
    assert.equal(await page.locator('img[alt="OmniTransit"]').count(), 0, "no OmniTransit logo");
    assert.equal(await page.locator('img[alt="SAEC"]').count(), 1, "SAEC logo present");
    assert.equal(
      await page.locator('text=I know these are a lot of questions').count(),
      0,
      "footer message removed",
    );
    assert.equal(
      await page.locator('text=Previously submitted on').count(),
      0,
      "submitted timestamp hidden from client",
    );

    for (const section of SAEC_DISCOVERY_SECTIONS) {
      await page.getByRole("button", { name: section.title, exact: true }).click();
      await page.waitForSelector("main");

      const keys = responseKeysForSection(section);
      for (const key of keys) {
        const selector = fieldSelector(section.id, key);
        await typeInField(page, selector, `${section.title} ${key} test`);
      }

      await page.locator('main button').filter({ hasText: /^Save$/ }).click();
      await page.waitForFunction(
        (args) => {
          const raw = window.localStorage.getItem(args.storageKey);
          if (!raw) return false;
          const parsed = JSON.parse(raw);
          const responses = parsed[args.sectionId]?.responses ?? {};
          return Object.values(responses).some((value) => typeof value === "string" && value.includes("test"));
        },
        { storageKey: STORAGE_KEY, sectionId: section.id },
      );

      await assertNoScroll(page);
    }

    await page.locator('button:has-text("Save Draft")').click();
    await page.waitForSelector('[role="status"]:has-text("Draft saved")');

    page.once("dialog", (dialog) => dialog.accept());
    await page.locator('button:has-text("Reset Draft")').click();
    await page.waitForSelector('[role="status"]:has-text("Draft cleared")');
    await page.reload({ waitUntil: "networkidle" });
    await page.getByRole("button", { name: "General", exact: true }).click();
    assert.equal(await page.locator("#general-top-annoyances").inputValue(), "", "reset clears draft");

    await page.locator("#general-top-annoyances").fill("post-reset draft");
    await page.locator('button:has-text("Save Draft")').click();
    await page.waitForSelector('[role="status"]:has-text("Draft saved")');

    await page.reload({ waitUntil: "networkidle" });
    await page.getByRole("button", { name: "General", exact: true }).click();
    const q1 = page.locator("#general-top-annoyances");
    assert.equal(await q1.inputValue(), "post-reset draft", "reload restores draft after reset cycle");

    if (viewport.name === "1440x900") {
      await page.screenshot({
        path: "/home/ubuntu/Desktop/survey.jpg",
        type: "jpeg",
        quality: 92,
        fullPage: false,
      });
    }

    await page.close();
    console.log(`ok  viewport ${viewport.name}`);
  }

  console.log("ok  saec-discovery full test passed");
} finally {
  await browser.close();
}
