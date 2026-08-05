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

async function save(page, view) {
  const raw = path.join(OUT, `${view}.raw.png`);
  const out = path.join(OUT, `${view}.png`);
  await page.screenshot({
    path: raw,
    clip: {
      x: SIDEBAR_W,
      y: 0,
      width: VIEWPORT.width - SIDEBAR_W,
      height: VIEWPORT.height,
    },
  });
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

// Testing — scroll video into view
await page.goto(`${ORIGIN}/dashboard?view=testing`, {
  waitUntil: "domcontentloaded",
  timeout: 90000,
});
await page.waitForSelector("text=Flight Video", { timeout: 60000 });
await page.waitForTimeout(2000);
await page.locator("text=Flight Video").first().scrollIntoViewIfNeeded();
await page.waitForTimeout(1500);
await page.locator("video").first().waitFor({ state: "visible", timeout: 30000 }).catch(() => null);
await page.waitForTimeout(2000);
await save(page, "testing");

// Telemetry — full page with map focused on selected drone
await page.goto(`${ORIGIN}/dashboard?view=telemetry`, {
  waitUntil: "domcontentloaded",
  timeout: 90000,
});
await page.waitForSelector("text=Telemetry Dashboard", { timeout: 60000 });
await page.waitForTimeout(4000);
await page.locator("tbody tr").first().click().catch(() => null);
await page.waitForTimeout(2500);
await page.locator("text=Selected Drone Position").first().scrollIntoViewIfNeeded().catch(() => null);
await page.waitForTimeout(1500);
// Capture from top of content so stats + map are visible
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(500);
await save(page, "telemetry");

await browser.close();
console.log("Done");
