/**
 * Capture real OnwardAir dashboard screenshots for /overview module previews.
 * Usage: node scripts/capture-onwardair-overview-screenshots.mjs
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ORIGIN = "https://onwardair.unit311central.com";
const USERNAME = "admin@onwardair.tech";
const PASSWORD = "Houston1999$";
const OUT = path.join(process.cwd(), "public", "images", "overview", "screenshots");

/** slug → dashboard view query */
const SHOTS = [
  { slug: "home", view: "home" },
  { slug: "executive-assistant", view: "executive-assistant" },
  { slug: "intelligence", view: "oa-competitor-intelligence" },
  { slug: "fundraising", view: "fundraising-pipeline" },
  { slug: "board", view: "board-dashboard" },
  { slug: "engineering", view: "oa-engineering-overview" },
  { slug: "project-management", view: "projects-dashboard" },
  { slug: "financials", view: "financials" },
  { slug: "business-central", view: "clients" },
  { slug: "ip-patents", view: "oa-ip-dashboard" },
  { slug: "hr", view: "hr-dashboard" },
  { slug: "marketing", view: "oa-marketing-dashboard" },
  { slug: "corporate", view: "company-details" },
  { slug: "technology", view: "devices" },
  { slug: "productivity", view: "email" },
  { slug: "operations", view: "assets" },
  { slug: "training", view: "training-dashboard" },
  { slug: "qms", view: "document-control" },
  { slug: "client-access", view: "external-client-access" },
  { slug: "settings", view: "settings-profile" },
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
    const name = pair.slice(0, eq).trim();
    const value = pair.slice(eq + 1).trim();
    return { name, value, domain: ".unit311central.com", path: "/" };
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
  if (!res.ok) {
    throw new Error(`Login failed ${res.status}: ${JSON.stringify(body).slice(0, 300)}`);
  }
  const setCookie = res.headers.getSetCookie?.() ?? [];
  // Node fetch may expose getSetCookie; fallback to raw header unavailable in undici sometimes.
  if (!setCookie.length) {
    // Playwright form login fallback handled by caller.
    return { cookies: [], redirectPath: body.redirectPath ?? "/dashboard" };
  }
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

  // Form login fallback
  await page.goto(`${ORIGIN}/login`, { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForTimeout(800);
  const email = page.locator('input[type="email"], input[name="username"], input[autocomplete="username"]').first();
  const password = page.locator('input[type="password"]').first();
  await email.fill(USERNAME);
  await password.fill(PASSWORD);
  await Promise.all([
    page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 90000 }).catch(() => null),
    page.locator('button[type="submit"]').first().click(),
  ]);
  await page.waitForTimeout(2000);
  if (page.url().includes("/login")) {
    throw new Error("Still on login after form submit");
  }
}

async function captureView(page, slug, view) {
  const url = `${ORIGIN}/dashboard?view=${encodeURIComponent(view)}`;
  console.log(`→ ${slug} (${view})`);
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForLoadState("networkidle", { timeout: 45000 }).catch(() => null);
  await page.waitForTimeout(slug === "home" ? 10000 : 6000);
  for (let i = 0; i < 8; i += 1) {
    const pulsing = await page.locator(".animate-pulse").count().catch(() => 0);
    if (pulsing === 0) break;
    await page.waitForTimeout(1500);
  }
  await page.locator('button:has-text("Accept")').first().click({ timeout: 800 }).catch(() => null);
  const rawPath = path.join(OUT, `${slug}.raw.png`);
  const outPath = path.join(OUT, `${slug}.png`);
  await page.screenshot({ path: rawPath, fullPage: false });
  await sharp(rawPath)
    .resize({ width: 1440, withoutEnlargement: true })
    .png({ compressionLevel: 9, palette: true })
    .toFile(outPath);
  fs.unlinkSync(rawPath);
  const size = fs.statSync(outPath).size;
  console.log(`  saved ${slug}.png (${Math.round(size / 1024)} KB)`);
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
});
const page = await context.newPage();

try {
  await ensureSession(page, context);
  console.log(`Logged in. URL=${page.url()}`);

  for (const shot of SHOTS) {
    try {
      await captureView(page, shot.slug, shot.view);
    } catch (error) {
      console.warn(`  FAIL ${shot.slug}: ${error instanceof Error ? error.message : error}`);
    }
  }

  // Keep generic as a copy of home for any unmapped modules
  const home = path.join(OUT, "home.png");
  const generic = path.join(OUT, "generic.png");
  if (fs.existsSync(home)) fs.copyFileSync(home, generic);
} finally {
  await browser.close();
}

console.log(`Done. Screenshots in ${OUT}`);
