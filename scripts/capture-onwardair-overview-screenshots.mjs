/**
 * Capture OnwardAir dashboard screenshots for /overview RHS previews.
 * Crops out the LHS platform nav so the overview page can show content only.
 *
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
const VIEWPORT = { width: 1600, height: 1000 };
/** Match EnterprisePlatformSidebar lg width (320) + a little slack. */
const SIDEBAR_W = 328;

/**
 * One capture per live platform view id (filename = view id).
 * First page of each nav item the overview sidebar can open.
 */
const SHOTS = [
  { view: "home" },
  { view: "executive-assistant" },
  { view: "business-central-dashboard" },
  { view: "clients-dashboard" },
  { view: "clients" },
  { view: "crm" },
  { view: "crm-meetings" },
  { view: "client-onboarding" },
  { view: "representatives" },
  { view: "grants" },
  { view: "projects-dashboard" },
  { view: "projects-internal" },
  { view: "projects-external" },
  { view: "oa-competitor-intelligence" },
  { view: "oa-ecosystem-partners" },
  { view: "financials" },
  { view: "general-ledger" },
  { view: "accounts-receivable" },
  { view: "accounts-payable" },
  { view: "expenses" },
  { view: "wise" },
  { view: "financial-reports" },
  { view: "fundraising-dashboard" },
  { view: "fundraising-pipeline" },
  { view: "fundraising-meetings" },
  { view: "fundraising-pitch-decks" },
  { view: "fundraising-data-rooms" },
  { view: "fundraising-investors" },
  { view: "corporate-cap-table" },
  { view: "corporate-dashboard" },
  { view: "corporate-company-details" },
  { view: "corporate-bank-accounts" },
  { view: "corporate-advisers" },
  { view: "corporate-contracts" },
  { view: "corporate-board-directors" },
  { view: "board-dashboard" },
  { view: "board-meetings" },
  { view: "board-pack" },
  { view: "board-minutes" },
  { view: "corporate-risk-register" },
  { view: "board-members" },
  { view: "company-details" },
  { view: "office-locations" },
  { view: "oa-ip-overview" },
  { view: "oa-ip-dashboard" },
  { view: "oa-ip-register" },
  { view: "oa-ip-portfolio" },
  { view: "oa-ip-documents" },
  { view: "oa-ip-search" },
  { view: "oa-engineering-overview" },
  { view: "oa-programs-milestones" },
  { view: "oa-assurance-certification" },
  { view: "oa-engineering-risks" },
  { view: "oa-team-capacity" },
  { view: "oa-supply-dependencies" },
  { view: "oa-engineering-integrations" },
  { view: "operations-dashboard" },
  { view: "assets" },
  { view: "inventory" },
  { view: "inventory-management" },
  { view: "procurement" },
  { view: "logistics" },
  { view: "oa-marketing-dashboard" },
  { view: "social" },
  { view: "marketing-newsletter" },
  { view: "marketing-events" },
  { view: "marketing-event-management" },
  { view: "marketing-mailing-list" },
  { view: "technology-dashboard" },
  { view: "technology-devices" },
  { view: "technology-software" },
  { view: "technology-telecommunications" },
  { view: "technology-infrastructure" },
  { view: "technology-reports" },
  { view: "technology-settings" },
  { view: "devices" },
  { view: "software-saas" },
  { view: "hr-dashboard" },
  { view: "hr" },
  { view: "hr-org-chart" },
  { view: "hr-recruitment" },
  { view: "hr-leave" },
  { view: "hr-payroll" },
  { view: "hr-performance" },
  { view: "hr-reports" },
  { view: "employees" },
  { view: "org-chart" },
  { view: "recruitment" },
  { view: "payroll" },
  { view: "productivity-dashboard" },
  { view: "files-internal" },
  { view: "files-external" },
  { view: "files-client" },
  { view: "info-email" },
  { view: "email" },
  { view: "calendar" },
  { view: "messaging" },
  { view: "communications" },
  { view: "whiteboard" },
  { view: "support-overview" },
  { view: "support" },
  { view: "support-mine" },
  { view: "support-desk" },
  { view: "training-dashboard" },
  { view: "training" },
  { view: "training-external" },
  { view: "qms-training" },
  { view: "quality-management" },
  { view: "qms-document-control" },
  { view: "qms-capa" },
  { view: "qms-internal-audits" },
  { view: "qms-management-review" },
  { view: "qms-reports" },
  { view: "document-control" },
  { view: "capa" },
  { view: "internal-audits" },
  { view: "external-client-access" },
  { view: "users-external" },
  { view: "website-management" },
  { view: "integrations" },
  { view: "users" },
  { view: "profile" },
  { view: "settings" },
  { view: "billing" },
  { view: "appearance" },
  { view: "settings-profile" },
  { view: "settings-users" },
  { view: "settings-general" },
  { view: "testing" },
];

/** Legacy section aliases → copy from a captured view after the run. */
const LEGACY_ALIASES = {
  "business-central": "clients",
  intelligence: "oa-competitor-intelligence",
  fundraising: "fundraising-pipeline",
  board: "board-dashboard",
  engineering: "oa-engineering-overview",
  "project-management": "projects-dashboard",
  "ip-patents": "oa-ip-dashboard",
  hr: "employees",
  marketing: "oa-marketing-dashboard",
  corporate: "corporate-company-details",
  technology: "technology-devices",
  productivity: "productivity-dashboard",
  operations: "operations-dashboard",
  training: "training",
  qms: "quality-management",
  "client-access": "external-client-access",
  settings: "settings-general",
  "executive-assistant": "executive-assistant",
  home: "home",
  generic: "home",
};

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
  if (!setCookie.length) {
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

async function captureView(page, view) {
  const slug = view;
  const url = `${ORIGIN}/dashboard?view=${encodeURIComponent(view)}`;
  console.log(`→ ${slug}`);
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForLoadState("networkidle", { timeout: 45000 }).catch(() => null);
  await page.waitForTimeout(view === "home" || view === "executive-assistant" ? 9000 : 4500);
  for (let i = 0; i < 8; i += 1) {
    const pulsing = await page.locator(".animate-pulse").count().catch(() => 0);
    if (pulsing === 0) break;
    await page.waitForTimeout(1200);
  }
  await page.locator('button:has-text("Accept")').first().click({ timeout: 800 }).catch(() => null);

  const rawPath = path.join(OUT, `${slug}.raw.png`);
  const outPath = path.join(OUT, `${slug}.png`);
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
  const size = fs.statSync(outPath).size;
  console.log(`  saved ${slug}.png (${Math.round(size / 1024)} KB)`);
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: VIEWPORT,
  deviceScaleFactor: 2,
});
const page = await context.newPage();

try {
  await ensureSession(page, context);
  console.log(`Logged in. URL=${page.url()}`);

  for (const shot of SHOTS) {
    try {
      await captureView(page, shot.view);
    } catch (error) {
      console.warn(`  FAIL ${shot.view}: ${error instanceof Error ? error.message : error}`);
    }
  }

  for (const [alias, source] of Object.entries(LEGACY_ALIASES)) {
    const src = path.join(OUT, `${source}.png`);
    const dest = path.join(OUT, `${alias}.png`);
    if (!fs.existsSync(src)) continue;
    if (path.resolve(src) === path.resolve(dest)) continue;
    try {
      fs.copyFileSync(src, dest);
      console.log(`  alias ${alias}.png ← ${source}.png`);
    } catch (error) {
      console.warn(`  alias FAIL ${alias}: ${error instanceof Error ? error.message : error}`);
    }
  }
} finally {
  await browser.close();
}

console.log(`Done. Screenshots in ${OUT}`);
