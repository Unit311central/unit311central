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

await page.goto(`${ORIGIN}/dashboard?view=telemetry`, {
  waitUntil: "domcontentloaded",
  timeout: 90000,
});
await page.waitForSelector("text=Live Telemetry Table", { timeout: 60000 });
await page.waitForSelector("tbody tr", { timeout: 60000 });
// Wait for map/tiles so layout height settles, then scroll the main pane.
await page.waitForTimeout(5000);

const scrolled = await page.evaluate(() => {
  const heading = Array.from(document.querySelectorAll("h3")).find((el) =>
    el.textContent?.includes("Live Telemetry Table"),
  );
  const section = heading?.closest("section");
  if (!section) return { ok: false, reason: "no section" };

  const main =
    document.querySelector('[data-ai-target="page-main"]') ||
    Array.from(document.querySelectorAll("div")).find((el) => {
      const st = getComputedStyle(el);
      return /(auto|scroll)/.test(st.overflowY) && el.scrollHeight > el.clientHeight + 40;
    });

  if (!main) {
    section.scrollIntoView({ block: "start", behavior: "instant" });
    return { ok: true, mode: "scrollIntoView-only" };
  }

  const mainRect = main.getBoundingClientRect();
  const sectionRect = section.getBoundingClientRect();
  // Pull table card to the top of the main pane (map fully off-screen).
  const nextTop = main.scrollTop + (sectionRect.top - mainRect.top) - 8;
  main.scrollTop = Math.max(0, nextTop);
  // If a sliver of map remains, nudge further.
  const after = section.getBoundingClientRect().top - mainRect.top;
  if (after > 24) {
    main.scrollTop += after - 8;
  }
  return {
    ok: true,
    mode: "main-scroll",
    scrollTop: main.scrollTop,
    scrollHeight: main.scrollHeight,
    clientHeight: main.clientHeight,
    sectionTopInMain: section.getBoundingClientRect().top - main.getBoundingClientRect().top,
  };
});
console.log("scroll", scrolled);
await page.waitForTimeout(1000);

// Crop the screenshot to the table card only if map still peeks in.
const tableBox = await page.locator("h3", { hasText: "Live Telemetry Table" }).first().evaluate((heading) => {
  const section = heading.closest("section");
  if (!section) return null;
  const r = section.getBoundingClientRect();
  return { x: r.x, y: r.y, width: r.width, height: r.height };
});
console.log("tableBox", tableBox);

if (tableBox && tableBox.height > 200) {
  const raw = path.join(OUT, "telemetry.raw.png");
  const out = path.join(OUT, "telemetry.png");
  const clipY = Math.max(0, tableBox.y - 8);
  const clipH = Math.min(VIEWPORT.height - clipY, Math.max(tableBox.height + 16, 720));
  await page.screenshot({
    path: raw,
    clip: {
      x: Math.max(SIDEBAR_W, Math.floor(tableBox.x)),
      y: Math.floor(clipY),
      width: Math.min(VIEWPORT.width - SIDEBAR_W, Math.ceil(tableBox.width)),
      height: Math.floor(clipH),
    },
  });
  await sharp(raw)
    .resize({ width: 1440, withoutEnlargement: true })
    .png({ compressionLevel: 9, palette: true, effort: 10, quality: 80 })
    .toFile(out);
  fs.unlinkSync(raw);
  console.log("saved telemetry (table-clip)", `${Math.round(fs.statSync(out).size / 1024)}KB`);
} else {
  await save(page, "telemetry");
}
await browser.close();
console.log("Done");
