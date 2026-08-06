/**
 * Prove /overview mobile layout on Android + Apple phone sizes.
 * Usage: node scripts/prove-overview-mobile.mjs
 */
import { chromium, webkit } from "playwright";
import fs from "node:fs";
import path from "node:path";

const ORIGIN = "https://onwardair.unit311central.com";
const OUT = path.join(process.cwd(), "tmp", "responsive-proof", "mobile");
const USERNAME = "overview@onwardair.tech";
const PASSWORD = "Overview4141&";

const DEVICES = [
  {
    name: "iphone-14",
    browser: "webkit",
    viewport: { width: 390, height: 844 },
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    note: "iPhone 14 / Safari",
  },
  {
    name: "iphone-se",
    browser: "webkit",
    viewport: { width: 375, height: 667 },
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    note: "iPhone SE / Safari",
  },
  {
    name: "pixel-7",
    browser: "chromium",
    viewport: { width: 412, height: 915 },
    userAgent:
      "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    note: "Pixel 7 / Chrome",
  },
  {
    name: "galaxy-s21",
    browser: "chromium",
    viewport: { width: 360, height: 800 },
    userAgent:
      "Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    note: "Galaxy S21 / Chrome",
  },
  {
    name: "ipad-mini",
    browser: "webkit",
    viewport: { width: 768, height: 1024 },
    userAgent:
      "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    note: "iPad mini portrait",
  },
];

fs.mkdirSync(OUT, { recursive: true });

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

async function loginCookies() {
  const res = await fetch(`${ORIGIN}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: USERNAME,
      password: PASSWORD,
      returnTo: ORIGIN,
      next: "/overview",
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Login failed ${res.status}: ${JSON.stringify(body).slice(0, 200)}`);
  return parseSetCookie(res.headers.getSetCookie?.() ?? []);
}

async function measure(page) {
  return page.evaluate(() => {
    const root = document.querySelector(".oa-overview");
    const left = document.querySelector(".oa-overview-left");
    const preview = document.querySelector(".oa-overview-preview");
    const nav = document.querySelector('[data-ai-target="platform-nav"]');
    const stage = document.querySelector(".oa-preview-stage");
    const leftCards = document.querySelectorAll(".oa-overview-left .oa-left-card");
    const cardScrollbars = Array.from(leftCards).filter((card) => {
      const body = card.querySelector(".oa-left-card-body");
      const el = body ?? card;
      return el.scrollHeight > el.clientHeight + 2;
    }).length;
    const headline = document.querySelector(".oa-overview-tagline-beside p");
    const headlineClipped =
      !!headline &&
      headline.scrollHeight > headline.clientHeight + 2;
    const navRect = nav?.getBoundingClientRect();
    const leftRect = left?.getBoundingClientRect();
    const previewRect = preview?.getBoundingClientRect();
    const stageRect = stage?.getBoundingClientRect();
    const navVisible = !!(
      navRect &&
      navRect.width > 40 &&
      navRect.height > 40 &&
      navRect.right > 8 &&
      navRect.left < window.innerWidth - 8
    );
    const overflowX = document.documentElement.scrollWidth > window.innerWidth + 2;
    const stacked =
      !!(leftRect && previewRect && previewRect.top >= leftRect.bottom - 12) ||
      !!(navRect && stageRect && stageRect.top >= navRect.bottom - 12);
    return {
      viewport: { w: window.innerWidth, h: window.innerHeight },
      scale: root ? getComputedStyle(root).getPropertyValue("--oa-scale").trim() : "",
      overflowX,
      scrollW: document.documentElement.scrollWidth,
      navVisible,
      navW: Math.round(navRect?.width || 0),
      navH: Math.round(navRect?.height || 0),
      leftH: Math.round(leftRect?.height || 0),
      previewH: Math.round(previewRect?.height || 0),
      stageH: Math.round(stageRect?.height || 0),
      leftContentSignals: left?.querySelectorAll(".oa-left-card").length ?? 0,
      cardScrollbars,
      headlineClipped,
      stacked,
      previewFlexDir: preview ? getComputedStyle(preview).flexDirection : "",
    };
  });
}

function verdict(m) {
  const issues = [];
  if (m.overflowX) issues.push(`horizontal-overflow(${m.scrollW}>${m.viewport.w})`);
  if (!m.navVisible) issues.push("nav-not-visible");
  if (m.navH < 80) issues.push(`nav-too-short(${m.navH})`);
  if (m.leftH < 120) issues.push(`left-too-short(${m.leftH})`);
  if (m.stageH < 180) issues.push(`stage-too-short(${m.stageH})`);
  if (m.viewport.w <= 1099 && m.previewFlexDir !== "column") issues.push(`preview-not-column(${m.previewFlexDir})`);
  if (m.viewport.w <= 1099 && !m.stacked) issues.push("expected-stacked");
  if (m.leftContentSignals < 3) issues.push("left-cards-likely-clipped");
  if (m.cardScrollbars > 0) issues.push(`left-card-scrollbars(${m.cardScrollbars})`);
  if (m.headlineClipped) issues.push("headline-clipped");
  return { ok: issues.length === 0, issues };
}

const cookies = await loginCookies();
const results = [];

for (const device of DEVICES) {
  const launcher = device.browser === "webkit" ? webkit : chromium;
  const browser = await launcher.launch({ headless: true });
  const context = await browser.newContext({
    viewport: device.viewport,
    userAgent: device.userAgent,
    isMobile: device.viewport.width < 768,
    hasTouch: true,
  });
  await context.addCookies(cookies);
  const page = await context.newPage();
  await page.goto(`${ORIGIN}/overview`, { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForSelector(".oa-overview-layout", { timeout: 60000 });
  await page.waitForTimeout(1200);
  const m = await measure(page);
  const v = verdict(m);
  const shot = path.join(OUT, `${device.name}.png`);
  await page.screenshot({ path: shot, fullPage: true });
  results.push({ ...device, ...m, ...v, shot });
  console.log(
    `${device.name} ${device.viewport.width}x${device.viewport.height} nav=${m.navVisible ? `${m.navW}x${m.navH}` : "HIDDEN"} left=${m.leftH} stage=${m.stageH} ${m.previewFlexDir} ${v.ok ? "PASS" : "FAIL " + v.issues.join(",")}`,
  );
  await browser.close();
}

const summaryPath = path.join(OUT, "summary.json");
fs.writeFileSync(summaryPath, JSON.stringify(results, null, 2));
const fails = results.filter((r) => !r.ok);
console.log(`\n${results.length - fails.length}/${results.length} mobile checks passed`);
if (fails.length) {
  for (const f of fails) console.log(` - ${f.name}: ${f.issues.join(", ")}`);
  process.exitCode = 1;
} else {
  console.log("All Android + Apple mobile checks passed.");
}
console.log(`Summary: ${summaryPath}`);
