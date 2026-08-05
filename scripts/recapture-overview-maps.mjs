import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ORIGIN = "https://onwardair.unit311central.com";
const OUT = path.join(process.cwd(), "public", "images", "overview", "screenshots");
const VIEWPORT = { width: 1600, height: 1000 };
const SIDEBAR_W = 328;

async function login(context, page) {
  const res = await fetch(`${ORIGIN}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: "admin@onwardair.tech",
      password: "Houston1999$",
      returnTo: ORIGIN,
      next: "/dashboard",
    }),
  });
  const setCookie = res.headers.getSetCookie?.() ?? [];
  await context.addCookies(
    setCookie.map((raw) => {
      const [pair] = raw.split(";");
      const eq = pair.indexOf("=");
      return {
        name: pair.slice(0, eq).trim(),
        value: pair.slice(eq + 1).trim(),
        domain: ".unit311central.com",
        path: "/",
      };
    }),
  );
  await page.goto(`${ORIGIN}/dashboard?view=home`, {
    waitUntil: "domcontentloaded",
    timeout: 90000,
  });
}

async function save(page, view, clip) {
  const raw = path.join(OUT, `${view}.raw.png`);
  const out = path.join(OUT, `${view}.png`);
  await page.screenshot({ path: raw, clip });
  await sharp(raw)
    .resize({ width: 1440, withoutEnlargement: true })
    .png({ compressionLevel: 9, palette: true, effort: 10, quality: 80 })
    .toFile(out);
  fs.unlinkSync(raw);
  console.log("saved", view, `${Math.round(fs.statSync(out).size / 1024)}KB`);
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 2 });
const page = await context.newPage();
await login(context, page);

// Recruitment list (no slide-over)
await page.goto(`${ORIGIN}/dashboard?view=hr-recruitment`, {
  waitUntil: "domcontentloaded",
  timeout: 90000,
});
await page.waitForSelector("text=Vacancies", { timeout: 60000 });
await page.waitForTimeout(2500);
// Close candidate panel if open
const closePanel = page.locator('button[aria-label="Close panel"]');
if (await closePanel.count()) {
  await closePanel.first().click({ force: true }).catch(() => null);
  await page.waitForTimeout(400);
}
await page.keyboard.press("Escape").catch(() => null);
await page.waitForTimeout(400);
await save(page, "hr-recruitment", {
  x: SIDEBAR_W,
  y: 0,
  width: VIEWPORT.width - SIDEBAR_W,
  height: VIEWPORT.height,
});

// Testing — full content column with map dominating lower half
await page.goto(`${ORIGIN}/dashboard?view=testing`, {
  waitUntil: "domcontentloaded",
  timeout: 90000,
});
await page.waitForSelector("text=Simulator Controls", { timeout: 60000 });
await page.locator('button:has-text("Start Spain Drone")').first().click().catch(() => null);
await page.waitForTimeout(5000);
await page.locator("text=Flight Path Map").first().scrollIntoViewIfNeeded();
await page.waitForTimeout(2000);
await page.locator(".leaflet-container").first().waitFor({ state: "visible", timeout: 30000 });
// Capture from just above Live Telemetry through the map
const live = await page.locator("text=Live Telemetry").first().boundingBox();
const map = await page.locator(".leaflet-container").first().boundingBox();
if (live && map) {
  const top = Math.max(0, live.y - 16);
  const bottom = Math.min(VIEWPORT.height, map.y + map.height + 16);
  await save(page, "testing", {
    x: SIDEBAR_W,
    y: top,
    width: VIEWPORT.width - SIDEBAR_W,
    height: Math.max(400, bottom - top),
  });
} else {
  await save(page, "testing", {
    x: SIDEBAR_W,
    y: 200,
    width: VIEWPORT.width - SIDEBAR_W,
    height: 780,
  });
}

await browser.close();
console.log("Done");
