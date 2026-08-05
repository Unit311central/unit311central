/**
 * Recapture only overview screenshots that were wrong aliases or missing.
 * Usage: node scripts/recapture-overview-broken-screenshots.mjs
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ORIGIN = "https://onwardair.unit311central.com";
const USERNAME = "admin@onwardair.tech";
const PASSWORD = "Houston1999$";
const OUT = path.join(process.cwd(), "public", "images", "overview", "screenshots");
const VIEWPORT = { width: 1600, height: 1000 };
const SIDEBAR_W = 328;

const SHOTS = [
  // Corporate — previous files were identical to home.png / partners
  "corporate-dashboard",
  "corporate-company-details",
  "corporate-bank-accounts",
  "corporate-advisers",
  "corporate-contracts",
  "corporate-board-directors",
  "company-details",
  "office-locations",
  // IP — documents/search were portfolio/register copies
  "oa-ip-documents",
  "oa-ip-search",
  "oa-ip-portfolio",
  "oa-ip-register",
  // Marketing siblings
  "marketing-event-management",
  "marketing-mailing-list",
  "marketing-events",
  "oa-marketing-dashboard",
  // Engineering siblings
  "oa-team-capacity",
  "oa-supply-dependencies",
  "oa-engineering-integrations",
  "oa-engineering-overview",
  // Tech / HR / QMS / Support / Productivity / Settings
  "technology-dashboard",
  "technology-devices",
  "technology-software",
  "technology-telecommunications",
  "technology-infrastructure",
  "technology-reports",
  "technology-settings",
  "hr-dashboard",
  "hr",
  "hr-org-chart",
  "hr-recruitment",
  "hr-leave",
  "hr-payroll",
  "hr-performance",
  "hr-reports",
  "productivity-dashboard",
  "files-internal",
  "files-external",
  "info-email",
  "support-overview",
  "support",
  "support-mine",
  "training",
  "training-external",
  "qms-training",
  "quality-management",
  "qms-document-control",
  "qms-capa",
  "qms-internal-audits",
  "qms-management-review",
  "qms-reports",
  "logistics",
  "inventory-management",
  "operations-dashboard",
  "website-management",
  "integrations",
  "users",
  "users-external",
  "profile",
  "settings",
  "billing",
  "appearance",
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
      next: "/dashboard",
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Login failed ${res.status}: ${JSON.stringify(body).slice(0, 300)}`);
  const setCookie = res.headers.getSetCookie?.() ?? [];
  return {
    cookies: parseSetCookie(setCookie),
    redirectPath: body.redirectPath ?? "/dashboard",
  };
}

async function ensureSession(page, context) {
  const { cookies } = await loginCookies();
  if (cookies.length) {
    await context.addCookies(cookies);
    await page.goto(`${ORIGIN}/dashboard?view=home`, {
      waitUntil: "domcontentloaded",
      timeout: 90000,
    });
    if (!page.url().includes("/login")) return;
  }
  await page.goto(`${ORIGIN}/login`, { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForTimeout(800);
  await page.locator('input[type="email"], input[name="username"], input[autocomplete="username"]').first().fill(USERNAME);
  await page.locator('input[type="password"]').first().fill(PASSWORD);
  await Promise.all([
    page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 90000 }).catch(() => null),
    page.locator('button[type="submit"]').first().click(),
  ]);
  await page.waitForTimeout(2000);
  if (page.url().includes("/login")) throw new Error("Still on login");
}

async function captureView(page, view) {
  const url = `${ORIGIN}/dashboard?view=${encodeURIComponent(view)}`;
  console.log(`→ ${view}`);
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForLoadState("networkidle", { timeout: 45000 }).catch(() => null);
  // Corporate leaf views rewrite to corporate-information?tab=… — wait for that.
  await page.waitForTimeout(view.startsWith("corporate-") || view === "company-details" ? 7000 : 5000);
  for (let i = 0; i < 10; i += 1) {
    const pulsing = await page.locator(".animate-pulse").count().catch(() => 0);
    if (pulsing === 0) break;
    await page.waitForTimeout(1000);
  }
  await page.locator('button:has-text("Accept")').first().click({ timeout: 800 }).catch(() => null);

  const rawPath = path.join(OUT, `${view}.raw.png`);
  const outPath = path.join(OUT, `${view}.png`);
  await page.screenshot({
    path: rawPath,
    clip: {
      x: SIDEBAR_W,
      y: 0,
      width: VIEWPORT.width - SIDEBAR_W,
      height: VIEWPORT.height,
    },
  });
  await sharp(rawPath)
    .resize({ width: 1920, withoutEnlargement: true })
    .png({ compressionLevel: 8, palette: false, effort: 7 })
    .toFile(outPath);
  fs.unlinkSync(rawPath);
  console.log(`  saved ${view}.png (${Math.round(fs.statSync(outPath).size / 1024)} KB) url=${page.url()}`);
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 2 });
const page = await context.newPage();

try {
  await ensureSession(page, context);
  console.log(`Logged in. URL=${page.url()}`);
  for (const view of SHOTS) {
    try {
      await captureView(page, view);
    } catch (error) {
      console.warn(`  FAIL ${view}: ${error instanceof Error ? error.message : error}`);
    }
  }
  // Keep company-details.png in sync with the real company details page.
  const src = path.join(OUT, "corporate-company-details.png");
  const dest = path.join(OUT, "company-details.png");
  if (fs.existsSync(src)) fs.copyFileSync(src, dest);
  const corp = path.join(OUT, "corporate.png");
  if (fs.existsSync(src)) fs.copyFileSync(src, corp);
} finally {
  await browser.close();
}
console.log("Done.");
