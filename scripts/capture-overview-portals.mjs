import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ORIGIN = "https://onwardair.unit311central.com";
const OUT = path.join(process.cwd(), "public", "images", "overview", "screenshots");

async function login(page, loginPath, user, pass) {
  await page.goto(`${ORIGIN}${loginPath}`, { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForTimeout(800);
  await page.locator('input[type="email"], input[autocomplete="username"]').first().fill(user);
  await page.locator('input[type="password"]').first().fill(pass);
  await Promise.all([
    page.waitForURL((u) => !u.pathname.includes("/login"), { timeout: 90000 }).catch(() => null),
    page.locator('button[type="submit"]').first().click(),
  ]);
  await page.waitForTimeout(2500);
}

async function shot(page, slug) {
  await page.waitForTimeout(5000);
  for (let i = 0; i < 6; i += 1) {
    const n = await page.locator(".animate-pulse").count().catch(() => 0);
    if (!n) break;
    await page.waitForTimeout(1200);
  }
  const raw = path.join(OUT, `${slug}.raw.png`);
  const out = path.join(OUT, `${slug}.png`);
  await page.screenshot({ path: raw, fullPage: false });
  await sharp(raw)
    .resize({ width: 1440, withoutEnlargement: true })
    .png({ compressionLevel: 9, palette: true })
    .toFile(out);
  fs.unlinkSync(raw);
  console.log("ok", slug, Math.round(fs.statSync(out).size / 1024) + "KB", page.url());
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
});
const page = await context.newPage();

await login(page, "/board/login", "board@onwardair.tech", "boardportal2040$");
await page.goto(`${ORIGIN}/board`, { waitUntil: "domcontentloaded", timeout: 90000 });
await shot(page, "board-portal");

await context.clearCookies();
await login(
  page,
  "/coastalfreightpartners.com/login",
  "demo@coastalfreightpartners.com",
  "Coastalfreight1$",
);
await page.goto(`${ORIGIN}/coastalfreightpartners.com`, {
  waitUntil: "domcontentloaded",
  timeout: 90000,
});
await shot(page, "client-portal");

await browser.close();
