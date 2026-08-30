/**
 * SAEC Discovery full field + viewport test (local only).
 * Run: node scripts/saec-discovery-full-test.mjs
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import {
  SAEC_DISCOVERY_COMMENTS_KEY,
  SAEC_DISCOVERY_OPTIONAL_PLACEHOLDER,
  SAEC_DISCOVERY_SECTIONS,
  SAEC_DISCOVERY_STORAGE_KEY,
  responseKeysForSection,
} from "../src/lib/saec-discovery/config.ts";

const BASE = process.env.SAEC_DISCOVERY_URL ?? "http://127.0.0.1:3000/saec-discovery";
const ARTIFACT_DIR = process.env.SAEC_DISCOVERY_ARTIFACT_DIR ?? "/opt/cursor/artifacts";
const STORAGE_KEY = "saec-discovery-v3";
const VIEWPORTS = [
  { width: 1280, height: 720, name: "1280x720" },
  { width: 1366, height: 768, name: "1366x768" },
  { width: 1440, height: 900, name: "1440x900" },
];

fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

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

async function assertNoHorizontalOverflow(page) {
  const scroll = await page.evaluate(() => ({
    docX: document.documentElement.scrollWidth > window.innerWidth,
    bodyX: document.body.scrollWidth > window.innerWidth,
  }));
  assert.equal(scroll.docX, false, "document horizontal scroll");
  assert.equal(scroll.bodyX, false, "body horizontal scroll");
}

async function assertNoPanelOverflow(page) {
  const scroll = await page.evaluate(() => {
    const main = document.querySelector("main");
    return {
      mainX: main ? main.scrollWidth > main.clientWidth : false,
    };
  });
  assert.equal(scroll.mainX, false, "main panel horizontal scroll");
}

async function assertGeneralQ6ExamplesReadable(page) {
  await page.getByRole("button", { name: "General", exact: true }).click();
  await page.waitForSelector("#general-desired-capabilities");

  const result = await page.evaluate(() => {
    const label = document.querySelector("label[for='general-desired-capabilities']");
    const exampleRoot = label?.parentElement?.querySelector("ul");
    const examples = exampleRoot ? Array.from(exampleRoot.querySelectorAll("li")) : [];
    const gridCols = exampleRoot ? getComputedStyle(exampleRoot).gridTemplateColumns : "";
    const colCount = gridCols.split(" ").filter(Boolean).length;
    const unreadable = examples.some((node) => {
      const rect = node.getBoundingClientRect();
      const fontSize = Number.parseFloat(getComputedStyle(node).fontSize);
      return rect.height <= 0 || rect.width <= 0 || fontSize < 11.5;
    });
    return {
      exampleCount: examples.length,
      colCount,
      unreadable,
      texts: examples.map((node) => node.textContent?.trim() ?? ""),
    };
  });

  assert.equal(result.exampleCount, 7, "General Q6 must list all seven examples");
  assert.equal(result.colCount, 2, "General Q6 examples must use two columns");
  assert.equal(result.unreadable, false, "General Q6 examples must be readable");
  assert.ok(
    result.texts.every((text) => text.length > 8),
    "General Q6 example text must not be truncated to empty",
  );
}

async function assertPlaceholderAndComments(page) {
  const field = page.locator("#general-top-annoyances");
  assert.equal(await field.getAttribute("placeholder"), SAEC_DISCOVERY_OPTIONAL_PLACEHOLDER);
  await page.getByRole("button", { name: "Client Management", exact: true }).click();
  const comments = page.locator("label[for='client-management-comments']");
  assert.equal((await comments.textContent())?.trim(), "Any other comments");
}

async function assertSoftwareLayoutConsistency(page) {
  const sections = ["Operations", "Project Management", "Engineering", "Training", "QMS"];
  const layouts = [];
  for (const title of sections) {
    await page.getByRole("button", { name: title, exact: true }).click();
    const layout = await page.evaluate(() => {
      const input = document.querySelector("main input[type='text']:not([id$='-comments'])");
      const row = input?.closest(".grid");
      const label = row?.querySelector("label");
      const comments = document.querySelector("main label[for$='-comments']");
      return {
        gridTemplateColumns: row ? getComputedStyle(row).gridTemplateColumns : "",
        inputHeight: input ? Math.round(input.getBoundingClientRect().height) : 0,
        labelSize: label ? getComputedStyle(label).fontSize : "",
        commentsLabel: comments?.textContent?.trim() ?? "",
        commentsUppercase: comments
          ? getComputedStyle(comments).textTransform === "uppercase"
          : true,
      };
    });
    layouts.push({ title, ...layout });
  }
  const first = layouts[0];
  for (const entry of layouts) {
    assert.equal(entry.gridTemplateColumns, first.gridTemplateColumns, `${entry.title} grid mismatch`);
    assert.equal(entry.inputHeight, first.inputHeight, `${entry.title} input height mismatch`);
    assert.equal(entry.labelSize, first.labelSize, `${entry.title} label size mismatch`);
    assert.equal(entry.commentsLabel, "Any other comments", `${entry.title} comments label`);
    assert.equal(entry.commentsUppercase, false, `${entry.title} comments label must not be uppercase`);
  }
}

async function assertReportingLayout(page) {
  await page.getByRole("button", { name: "Reporting", exact: true }).click();
  const result = await page.evaluate(() => {
    const questions = Array.from(document.querySelectorAll("main label:not([for$='-comments'])"));
    const textareas = Array.from(document.querySelectorAll("main textarea:not([id$='-comments'])"));
    const comments = document.querySelector("label[for='reporting-comments']");
    const clipped = textareas.some((node) => {
      const rect = node.getBoundingClientRect();
      return rect.height < 60;
    });
    return {
      questionCount: questions.length,
      textareaCount: textareas.length,
      commentsLabel: comments?.textContent?.trim() ?? "",
      twoColumnGrid: Boolean(document.querySelector("main .lg\\:grid-cols-2")),
      clipped,
    };
  });
  assert.equal(result.questionCount, 6, "Reporting must show six questions");
  assert.equal(result.textareaCount, 6, "Reporting must show six answer fields");
  assert.equal(result.commentsLabel, "Any other comments");
  assert.equal(result.twoColumnGrid, false, "Reporting must not use two-column grid");
  assert.equal(result.clipped, false, "Reporting answer fields must not be compressed");
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

    await assertPlaceholderAndComments(page);
    await assertGeneralQ6ExamplesReadable(page);

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, `saec-discovery-logo-${viewport.name}.png`),
      clip: { x: 0, y: 0, width: 240, height: 120 },
    });

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, `saec-discovery-general-${viewport.name}.png`),
      fullPage: false,
    });

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
          const state = parsed?.state ?? parsed;
          const responses = state[args.sectionId]?.responses ?? {};
          return Object.values(responses).some((value) => typeof value === "string" && value.includes("test"));
        },
        { storageKey: STORAGE_KEY, sectionId: section.id },
      );

      if (section.id === "general") {
        await assertGeneralQ6ExamplesReadable(page);
      }

      await assertNoHorizontalOverflow(page);
      if (section.kind !== "general") {
        await assertNoPanelOverflow(page);
      }
    }

    await assertSoftwareLayoutConsistency(page);
    await assertReportingLayout(page);
    await assertNoHorizontalOverflow(page);

    await page.locator('button:has-text("Save Draft")').click();
    await page.waitForSelector('[role="status"]:has-text("Draft saved")');

    page.once("dialog", (dialog) => dialog.accept());
    await page.locator('button:has-text("RESET")').click();
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

    await page.close();
    console.log(`ok  viewport ${viewport.name}`);
  }

  console.log("ok  saec-discovery full test passed");
} finally {
  await browser.close();
}
