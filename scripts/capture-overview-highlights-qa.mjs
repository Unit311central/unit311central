/**
 * QA screenshots — OnwardAir /overview KEY HIGHLIGHTS box at multiple viewport sizes.
 * Usage: node scripts/capture-overview-highlights-qa.mjs [baseUrl]
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const PROD = "https://onwardair.unit311central.com";
const LOCAL = "http://127.0.0.1:3000";
const ORIGIN_ARG = process.argv[2]?.replace(/\/$/, "");
const OUT_SUFFIX = process.argv[3] || "";
const USERNAME = "overview@onwardair.tech";
const PASSWORD = "Overview4141&";
const OUT_DIR = path.join(
  process.cwd(),
  "docs",
  "qa",
  `onwardair-overview-highlights${OUT_SUFFIX ? `-${OUT_SUFFIX}` : ""}`,
);

const VIEWPORTS = [
  { name: "laptop-13", width: 1280, height: 800, note: "13\" laptop — baseline (should look good)" },
  { name: "laptop-15", width: 1440, height: 900, note: "15\" laptop" },
  { name: "desktop-1080p", width: 1920, height: 1080, note: "24\" 1080p — highlights gap issue reported here" },
  { name: "desktop-1440p", width: 2560, height: 1440, note: "27\" 1440p — tall left column" },
  { name: "desktop-ultrawide", width: 3440, height: 1440, note: "Ultrawide" },
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

async function waitForOverview(page) {
  await page.waitForSelector(".oa-overview-layout", { timeout: 60000 });
  await page.waitForSelector(".oa-highlights-list", { timeout: 30000 });
}

async function measureHighlights(page) {
  return page.evaluate(() => {
    const list = document.querySelector(".oa-highlights-list");
    const rows = list ? Array.from(list.querySelectorAll(".oa-highlight-row")) : [];
    const tops = rows.map((row) => row.getBoundingClientRect().top);
    const gaps = tops.slice(1).map((top, i) => Math.round(top - tops[i]));
    const card = list?.closest(".oa-left-card");
    const cardRect = card?.getBoundingClientRect();
    const listRect = list?.getBoundingClientRect();
    const lastRow = rows[rows.length - 1]?.getBoundingClientRect();
    const trailingSpace =
      cardRect && lastRow ? Math.round(cardRect.bottom - lastRow.bottom) : null;
    return {
      itemCount: rows.length,
      gapsPx: gaps,
      listHeightPx: listRect ? Math.round(listRect.height) : null,
      cardHeightPx: cardRect ? Math.round(cardRect.height) : null,
      trailingSpacePx: trailingSpace,
      justifyContent: list ? getComputedStyle(list).justifyContent : null,
    };
  });
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const origin = await resolveOrigin();
  console.log(`Capturing overview highlights QA → ${origin}`);
  console.log(`Output: ${OUT_DIR}\n`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  try {
    await context.addCookies(await loginCookies(origin));
  } catch (loginError) {
    if (!origin.includes("127.0.0.1") && !origin.includes("localhost")) throw loginError;
    console.warn("Local login skipped (preview bypass may allow /overview without auth)");
  }
  const page = await context.newPage();
  await page.goto(`${origin}/overview`, { waitUntil: "domcontentloaded", timeout: 90000 });
  await waitForOverview(page);

  const report = [];

  for (const vp of VIEWPORTS) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.waitForTimeout(1200);

    const metrics = await measureHighlights(page);
    const base = `${vp.name}-${vp.width}x${vp.height}`;

    await page.screenshot({
      path: path.join(OUT_DIR, `${base}-full.png`),
      fullPage: false,
    });

    const highlightsCard = page.locator(".oa-left-card").filter({ hasText: "KEY HIGHLIGHTS" });
    if ((await highlightsCard.count()) > 0) {
      await highlightsCard.first().screenshot({
        path: path.join(OUT_DIR, `${base}-highlights-box.png`),
      });
    }

    const line = {
      viewport: vp.name,
      size: `${vp.width}x${vp.height}`,
      note: vp.note,
      ...metrics,
    };
    report.push(line);
    console.log(
      `${vp.name} (${vp.width}x${vp.height}): ${metrics.itemCount} items, gaps=${metrics.gapsPx?.join(",")}px, trailing=${metrics.trailingSpacePx}px, justify=${metrics.justifyContent}`,
    );
  }

  fs.writeFileSync(path.join(OUT_DIR, "metrics.json"), JSON.stringify(report, null, 2));
  fs.writeFileSync(
    path.join(OUT_DIR, "README.md"),
    `# OnwardAir overview — KEY HIGHLIGHTS QA

Captured from \`${origin}\` on ${new Date().toISOString().slice(0, 10)}.

| Viewport | File prefix | Notes |
|----------|-------------|-------|
${VIEWPORTS.map((vp) => `| ${vp.name} (${vp.width}×${vp.height}) | \`${vp.name}-${vp.width}x${vp.height}-*\` | ${vp.note} |`).join("\n")}

Each row has:
- \`*-full.png\` — full viewport
- \`*-highlights-box.png\` — cropped KEY HIGHLIGHTS card only

See \`metrics.json\` for measured gaps between highlight rows.
`,
  );

  await browser.close();
  console.log(`\nDone. ${report.length} viewports saved to ${OUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
