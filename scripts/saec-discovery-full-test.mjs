/**
 * SAEC Discovery full field + viewport test (local only).
 * Run: node scripts/saec-discovery-full-test.mjs
 */
import assert from "node:assert/strict";
import { chromium } from "playwright";
import {
  SAEC_DISCOVERY_COMMENTS_KEY,
  SAEC_DISCOVERY_SECTIONS,
  SAEC_DISCOVERY_STORAGE_KEY,
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

function discoveryCardMainSelector() {
  return ".rounded-b-xl main";
}

function discoveryCardHeaderSelector() {
  return ".rounded-t-xl > header";
}

async function assertNoScroll(page) {
  const scroll = await page.evaluate((mainSelector) => {
    const main = document.querySelector(mainSelector);
    return {
      docY: document.documentElement.scrollHeight > window.innerHeight,
      docX: document.documentElement.scrollWidth > window.innerWidth,
      bodyY: document.body.scrollHeight > window.innerHeight,
      bodyX: document.body.scrollWidth > window.innerWidth,
      mainY: main ? main.scrollHeight > main.clientHeight : false,
      mainX: main ? main.scrollWidth > main.clientWidth : false,
    };
  }, discoveryCardMainSelector());
  assert.equal(scroll.docY, false, "document vertical scroll");
  assert.equal(scroll.docX, false, "document horizontal scroll");
  assert.equal(scroll.bodyY, false, "body vertical scroll");
  assert.equal(scroll.bodyX, false, "body horizontal scroll");
  assert.equal(scroll.mainY, false, "main panel vertical scroll");
  assert.equal(scroll.mainX, false, "main panel horizontal scroll");
}

async function assertGeneralQ6ExamplesVisible(page) {
  await page.getByRole("button", { name: "General", exact: true }).click();
  await page.waitForSelector("#general-desired-capabilities");
  const result = await page.evaluate((mainSelector) => {
    const label = document.querySelector("label[for='general-desired-capabilities']");
    const exampleRoot = label?.parentElement?.querySelector("ul");
    const examples = exampleRoot ? Array.from(exampleRoot.querySelectorAll("li")) : [];
    const main = document.querySelector(mainSelector);
    const panel = main?.querySelector(":scope > div:nth-child(2)");
    const panelRect = panel?.getBoundingClientRect();
    const clipped = examples.some((node) => {
      const rect = node.getBoundingClientRect();
      if (rect.height <= 0 || rect.width <= 0) return true;
      if (!panelRect) return false;
      return rect.bottom > panelRect.bottom + 1;
    });
    return {
      clipped,
      exampleCount: examples.length,
      lastVisible: examples.at(-1)?.checkVisibility?.() ?? false,
      mainScroll: main ? main.scrollHeight > main.clientHeight : false,
    };
  }, discoveryCardMainSelector());
  assert.equal(result.exampleCount, 7, "General Q6 must list all seven examples");
  assert.equal(result.clipped, false, "General Q6 examples must not be clipped");
  assert.equal(result.lastVisible, true, "General Q6 last example must be visible");
  assert.equal(result.mainScroll, false, "General content must fit without main panel scroll");
}

async function assertPlaceholders(page) {
  assert.equal(
    await page.locator('input[placeholder="Your answer (optional)"], textarea[placeholder="Your answer (optional)"]').count(),
    0,
    'no "Your answer (optional)" placeholders',
  );
  assert.ok(
    (await page.locator('input[placeholder="Your answer"], textarea[placeholder="Your answer"]').count()) > 0,
    '"Your answer" placeholder present',
  );
}

async function assertLogoCentered(page) {
  const metrics = await page.evaluate(() => {
    const header = document.querySelector(".rounded-t-xl > header");
    const img = document.querySelector('img[alt="SAEC"]');
    if (!header || !img) return { offset: 999, headerMid: 0, imgMid: 0 };
    const headerRect = header.getBoundingClientRect();
    const imgRect = img.getBoundingClientRect();
    const headerMid = headerRect.top + headerRect.height / 2;
    const imgMid = imgRect.top + imgRect.height / 2;
    return {
      offset: Math.abs(headerMid - imgMid),
      headerMid,
      imgMid,
    };
  });
  assert.ok(metrics.offset <= 12, `SAEC logo should align to main header band (offset ${metrics.offset}px)`);
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
      const rowRect = row?.getBoundingClientRect();
      const inputRect = input?.getBoundingClientRect();
      return {
        gridTemplateColumns: row ? getComputedStyle(row).gridTemplateColumns : "",
        inputWidth: inputRect ? Math.round(inputRect.width) : 0,
        rowWidth: rowRect ? Math.round(rowRect.width) : 0,
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
    assert.ok(entry.inputWidth > 280, `${entry.title} answer field should be wider than 220px (${entry.inputWidth}px)`);
    assert.ok(
      entry.inputWidth / Math.max(entry.rowWidth, 1) >= 0.38,
      `${entry.title} answer column should use ~40%+ of row width`,
    );
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
    await assertPlaceholders(page);
    await assertLogoCentered(page);

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
        await assertGeneralQ6ExamplesVisible(page);
      }

      await assertNoScroll(page);
    }

    await assertSoftwareLayoutConsistency(page);
    await assertReportingLayout(page);
    await assertNoScroll(page);

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
