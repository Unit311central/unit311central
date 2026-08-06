/**
 * Guardrail: client-approved /overview layout must stay stable.
 * Usage: npm run prove:overview-client [baseUrl]
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const PROD = "https://onwardair.unit311central.com";
const LOCAL = "http://127.0.0.1:3000";
const ORIGIN_ARG = process.argv[2]?.replace(/\/$/, "");
const USERNAME = "overview@onwardair.tech";
const PASSWORD = "Overview4141&";
const FINGERPRINT = "overview-client-v9-2026-08-06";

const VIEWPORTS = [
  { name: "laptop-13", width: 1280, height: 800 },
  { name: "desktop-23", width: 1920, height: 1080 },
];

function parseSetCookie(setCookieHeaders) {
  const list = Array.isArray(setCookieHeaders)
    ? setCookieHeaders
    : setCookieHeaders
      ? [setCookieHeaders]
      : [];
  return list.map((raw) => {
    const [pair] = raw.split(";");
    const eq = pair.indexOf("=");
    return {
      name: pair.slice(0, eq).trim(),
      value: pair.slice(eq + 1).trim(),
      domain: ".unit311central.com",
      path: "/",
    };
  });
}

async function resolveOrigin() {
  if (ORIGIN_ARG) return ORIGIN_ARG;
  for (const candidate of [LOCAL, PROD]) {
    try {
      const res = await fetch(candidate, { method: "HEAD", redirect: "manual" });
      if (res.status > 0) return candidate;
    } catch {
      /* try next */
    }
  }
  return PROD;
}

async function loginCookies(origin) {
  const res = await fetch(`${origin}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: USERNAME,
      password: PASSWORD,
      returnTo: origin,
      next: "/overview",
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Login failed ${res.status}: ${JSON.stringify(body).slice(0, 300)}`);
  const setCookie = res.headers.getSetCookie?.() ?? [];
  if (origin.includes("unit311central.com")) return parseSetCookie(setCookie);
  return setCookie.map((raw) => {
    const [pair] = raw.split(";");
    const eq = pair.indexOf("=");
    return { name: pair.slice(0, eq).trim(), value: pair.slice(eq + 1).trim(), url: origin };
  });
}

function assertFingerprintInSource() {
  const stylePath = path.join(process.cwd(), "src/lib/onwardair/overview-style.ts");
  const src = fs.readFileSync(stylePath, "utf8");
  if (!src.includes(FINGERPRINT)) {
    throw new Error(`Missing fingerprint ${FINGERPRINT} in overview-style.ts`);
  }
}

async function measureClientLayout(page) {
  return page.evaluate(() => {
    const left = document.querySelector(".oa-overview-left");
    const cards = left ? Array.from(left.querySelectorAll(".oa-left-card")) : [];
    const layout = document.querySelector(".oa-overview-layout");
    const leftRect = left?.getBoundingClientRect();
    const previewRect = document.querySelector(".oa-overview-preview")?.getBoundingClientRect();
    const editBanner = document.body.innerText.includes("Edit mode on");
    const tuner = document.querySelector('[aria-label="Overview style tuner"]');
    const cardOverflow = cards.map((el, i) => {
      const st = getComputedStyle(el);
      return {
        i,
        scroll: el.scrollHeight > el.clientHeight + 2,
        overflowY: st.overflowY,
      };
    });
    return {
      cardCount: cards.length,
      cardOverflow,
      editBanner,
      hasTuner: !!tuner,
      sideBySide: !!(leftRect && previewRect && Math.abs(leftRect.top - previewRect.top) < 40),
      highlightsVisible: cards.some((el) => el.innerText.includes("KEY HIGHLIGHTS")),
      agendaVisible: cards.some((el) => el.innerText.includes("45 MIN")),
    };
  });
}

async function waitForOverview(page) {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      await page.waitForSelector(".oa-overview-layout", { timeout: 45000 });
      return;
    } catch {
      if (attempt === 1) throw new Error(`overview layout not found: ${page.url()}`);
      await page.reload({ waitUntil: "domcontentloaded", timeout: 90000 });
    }
  }
}

async function main() {
  assertFingerprintInSource();
  const origin = await resolveOrigin();
  console.log(`prove:overview-client → ${origin}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  await context.addCookies(await loginCookies(origin));
  const page = await context.newPage();
  await page.goto(`${origin}/overview`, { waitUntil: "domcontentloaded", timeout: 90000 });
  await waitForOverview(page);

  const failures = [];

  for (const vp of VIEWPORTS) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.waitForTimeout(900);
    const m = await measureClientLayout(page);
    const issues = [];
    if (m.cardCount !== 3) issues.push(`left-cards=${m.cardCount}`);
    if (!m.highlightsVisible) issues.push("missing-highlights");
    if (!m.agendaVisible) issues.push("missing-agenda");
    if (!m.sideBySide) issues.push("not-side-by-side");
    if (m.editBanner) issues.push("edit-banner-visible");
    if (m.hasTuner) issues.push("tuner-visible");
    if (m.cardOverflow.some((c) => c.scroll)) issues.push("left-box-inner-scroll");
    const ok = issues.length === 0;
    console.log(`${vp.name} ${vp.width}x${vp.height}: ${ok ? "PASS" : "FAIL " + issues.join(", ")}`);
    if (!ok) failures.push({ vp: vp.name, issues });
  }

  // Optional: owner editor URL (not shared with clients)
  try {
    await page.goto(`${origin}/overview?tune=1`, { waitUntil: "domcontentloaded", timeout: 90000 });
    await waitForOverview(page);
    const tune = await page.evaluate(() => document.body.innerText.includes("Edit mode on"));
    console.log(`tune=1 editor: ${tune ? "PASS" : "SKIP (no banner)"}`);
  } catch {
    console.log("tune=1 editor: SKIP (auth gate — client URL unaffected)");
  }

  await browser.close();

  if (failures.length) {
    console.error("\nClient layout guard failed:", JSON.stringify(failures, null, 2));
    process.exitCode = 1;
  } else {
    console.log(`\nClient layout frozen (${FINGERPRINT}) — all checks passed.`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
