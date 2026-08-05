/**
 * Recapture overview screenshots called out as wrong (map views, breadcrumbs, RHS).
 * Run AFTER the breadcrumb/WhatsApp deploy is live on production.
 *
 * Usage: node scripts/recapture-overview-broken-screenshots.mjs
 * (this file is a focused override — prefer updating the main script SHOTS list)
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
  "corporate-company-details",
  "office-locations",
  "corporate-bank-accounts",
  "corporate-advisers",
  "corporate-contracts",
  "technology-devices",
  "hr-recruitment",
  "communications",
  "whiteboard",
  "logistics",
  "testing",
  "telemetry",
  "whatsapp-integration",
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

async function dismissOverlays(page) {
  await page.locator('button:has-text("Accept")').first().click({ timeout: 800 }).catch(() => null);
  await page.locator('button:has-text("Not now")').first().click({ timeout: 1500 }).catch(() => null);
  await page.keyboard.press("Escape").catch(() => null);
}

async function prepareView(page, view) {
  if (view === "logistics") {
    // Wizard blocks the map — skip into the dashboard map view.
    for (let i = 0; i < 3; i += 1) {
      const notNow = page.locator('button:has-text("Not now"), a:has-text("Not now")').first();
      if (await notNow.isVisible().catch(() => false)) {
        await notNow.click();
        await page.waitForTimeout(1200);
      }
    }
    await page.waitForTimeout(2000);
  }

  if (view === "hr-recruitment") {
    // Close any candidate slide-over so the list/board is visible.
    await page.keyboard.press("Escape").catch(() => null);
    await page.locator('button[aria-label="Close"], button:has-text("Close")').first().click({ timeout: 800 }).catch(() => null);
    await page.waitForTimeout(500);
  }

  if (view === "testing") {
    // Prefer a live Spain drone + scroll map into frame.
    const startSpain = page.locator('button:has-text("Start Spain Drone")').first();
    if (await startSpain.isVisible().catch(() => false)) {
      await startSpain.click().catch(() => null);
      await page.waitForTimeout(3500);
    }
    const map = page.locator('text=Flight Path Map').first();
    if (await map.isVisible().catch(() => false)) {
      await map.scrollIntoViewIfNeeded().catch(() => null);
      await page.waitForTimeout(1500);
    }
  }

  if (view === "telemetry") {
    await page.waitForTimeout(2500);
    const map = page.locator(".leaflet-container, text=Flight Path, text=Live map").first();
    if (await map.isVisible().catch(() => false)) {
      await map.scrollIntoViewIfNeeded().catch(() => null);
    }
  }
}

async function captureView(page, view) {
  const url = `${ORIGIN}/dashboard?view=${encodeURIComponent(view)}`;
  console.log(`→ ${view}`);
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForLoadState("networkidle", { timeout: 45000 }).catch(() => null);
  await page.waitForTimeout(
    view.startsWith("corporate-") ||
      view === "office-locations" ||
      view === "company-details" ||
      view === "logistics" ||
      view === "testing" ||
      view === "telemetry"
      ? 7000
      : 5000,
  );
  for (let i = 0; i < 10; i += 1) {
    const pulsing = await page.locator(".animate-pulse").count().catch(() => 0);
    if (pulsing === 0) break;
    await page.waitForTimeout(1000);
  }
  await dismissOverlays(page);
  await prepareView(page, view);

  const rawPath = path.join(OUT, `${view}.raw.png`);
  const outPath = path.join(OUT, `${view}.png`);

  let clip = {
    x: SIDEBAR_W,
    y: 0,
    width: VIEWPORT.width - SIDEBAR_W,
    height: VIEWPORT.height,
  };

  // Testing: bias the clip toward the map (lower portion of the content column).
  if (view === "testing") {
    clip = {
      x: SIDEBAR_W,
      y: 120,
      width: VIEWPORT.width - SIDEBAR_W,
      height: VIEWPORT.height - 120,
    };
  }

  await page.screenshot({ path: rawPath, clip });
  await sharp(rawPath)
    .resize({ width: 1440, withoutEnlargement: true })
    .png({ compressionLevel: 9, palette: true, effort: 10, quality: 80 })
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
  const companySrc = path.join(OUT, "corporate-company-details.png");
  if (fs.existsSync(companySrc)) {
    fs.copyFileSync(companySrc, path.join(OUT, "company-details.png"));
  }
} finally {
  await browser.close();
}
console.log("Done.");
