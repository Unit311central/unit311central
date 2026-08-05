/**
 * Prove /overview reflows across laptop/Mac viewport sizes (Chromium + Firefox).
 * Usage: node scripts/prove-overview-responsive.mjs [baseUrl]
 * Default baseUrl: http://127.0.0.1:3000  (falls back to production if unreachable)
 */
import { chromium, firefox, webkit } from "playwright";
import fs from "node:fs";
import path from "node:path";

const OUT = path.join(process.cwd(), "tmp", "responsive-proof");
const PROD = "https://onwardair.unit311central.com";
const LOCAL = process.argv[2] || "http://127.0.0.1:3000";
const USERNAME = "overview@onwardair.tech";
const PASSWORD = "Overview4141&";

const VIEWPORTS = [
  { name: "macbook-air-13", width: 1280, height: 800, note: "MacBook Air 13 CSS" },
  { name: "windows-laptop", width: 1366, height: 768, note: "Common Windows laptop" },
  { name: "macbook-air-scaled", width: 1440, height: 900, note: "MacBook Air / Pro scaled" },
  { name: "macbook-pro-14", width: 1512, height: 982, note: "MacBook Pro 14 default" },
  { name: "full-hd", width: 1920, height: 1080, note: "External / desktop FHD" },
  { name: "narrow-laptop", width: 1100, height: 720, note: "Narrow laptop / split window" },
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

async function resolveOrigin() {
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
  if (!origin.includes("unit311central.com")) {
    // Local: try same credentials against prod host cookies won't apply; use local login if available.
    try {
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
      const setCookie = res.headers.getSetCookie?.() ?? [];
      return {
        cookies: setCookie.map((raw) => {
          const [pair] = raw.split(";");
          const eq = pair.indexOf("=");
          return {
            name: pair.slice(0, eq).trim(),
            value: pair.slice(eq + 1).trim(),
            url: origin,
          };
        }),
        ok: res.ok,
        body,
      };
    } catch (err) {
      return { cookies: [], ok: false, body: String(err) };
    }
  }
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
  return { cookies: parseSetCookie(setCookie), ok: true, body };
}

async function measure(page) {
  return page.evaluate(() => {
    const root = document.querySelector(".oa-overview");
    const layout = document.querySelector(".oa-overview-layout");
    const left = document.querySelector(".oa-overview-left");
    const preview = document.querySelector(".oa-overview-preview");
    const nav = document.querySelector('[data-ai-target="platform-nav"]');
    const scale = root ? getComputedStyle(root).getPropertyValue("--oa-scale").trim() : "";
    const layoutStyle = layout ? getComputedStyle(layout) : null;
    const overflowX = document.documentElement.scrollWidth > window.innerWidth + 1;
    const rootRect = root?.getBoundingClientRect();
    const leftRect = left?.getBoundingClientRect();
    const previewRect = preview?.getBoundingClientRect();
    const navRect = nav?.getBoundingClientRect();
    const clipped =
      !!root &&
      (root.scrollHeight > root.clientHeight + 24) &&
      getComputedStyle(root).overflow.includes("hidden");
    return {
      viewport: { w: window.innerWidth, h: window.innerHeight },
      scale,
      columns: layoutStyle?.gridTemplateColumns || "",
      rows: layoutStyle?.gridTemplateRows || "",
      overflowX,
      clipped,
      leftW: leftRect ? Math.round(leftRect.width) : 0,
      previewW: previewRect ? Math.round(previewRect.width) : 0,
      navW: navRect ? Math.round(navRect.width) : 0,
      previewH: previewRect ? Math.round(previewRect.height) : 0,
      rootH: rootRect ? Math.round(rootRect.height) : 0,
      sideBySide: !!(leftRect && previewRect && Math.abs(leftRect.top - previewRect.top) < 40),
      stacked: !!(leftRect && previewRect && previewRect.top > leftRect.bottom - 8),
    };
  });
}

function passFail(m, vp) {
  const issues = [];
  if (m.overflowX) issues.push("horizontal-overflow");
  if (m.previewW < 280) issues.push(`preview-too-narrow(${m.previewW})`);
  if (m.navW > 0 && m.navW > 280 && vp.width <= 1440) issues.push(`nav-too-wide(${m.navW})`);
  if (vp.width >= 1100 && !m.sideBySide && !m.stacked) issues.push("layout-unknown");
  if (vp.width >= 1280 && !m.sideBySide) issues.push("expected-side-by-side");
  if (vp.width < 1100 && !m.stacked) issues.push("expected-stacked");
  if (m.previewH < 200) issues.push(`preview-too-short(${m.previewH})`);
  return { ok: issues.length === 0, issues };
}

async function runBrowser(browserType, label, origin) {
  const browser = await browserType.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  const login = await loginCookies(origin);
  if (login.cookies?.length) await context.addCookies(login.cookies);

  const results = [];
  for (const vp of VIEWPORTS) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto(`${origin}/overview`, { waitUntil: "domcontentloaded", timeout: 90000 });
    await page.waitForTimeout(1500);
    const url = page.url();
    if (/login/i.test(url)) {
      throw new Error(`Still on login after auth: ${url}`);
    }
    await page.waitForSelector(".oa-overview-layout", { timeout: 60000 });
    await page.waitForTimeout(900);
    const m = await measure(page);
    const verdict = passFail(m, vp);
    const shot = path.join(OUT, `${label}-${vp.name}.png`);
    await page.screenshot({ path: shot, fullPage: false });
    results.push({ browser: label, ...vp, ...m, ...verdict, shot });
    console.log(
      `${label} ${vp.name} ${vp.width}x${vp.height} scale=${m.scale} nav=${m.navW} preview=${m.previewW}x${m.previewH} ${m.sideBySide ? "side-by-side" : m.stacked ? "stacked" : "?"} ${verdict.ok ? "PASS" : "FAIL " + verdict.issues.join(",")}`,
    );
  }

  // Live resize proof: start wide, shrink, grow — same page session.
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto(`${origin}/overview`, { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForSelector(".oa-overview-layout", { timeout: 60000 });
  const resizeSteps = [
    { width: 1920, height: 1080 },
    { width: 1440, height: 900 },
    { width: 1280, height: 800 },
    { width: 1100, height: 720 },
    { width: 1512, height: 982 },
  ];
  for (const step of resizeSteps) {
    await page.setViewportSize(step);
    await page.waitForTimeout(450);
    const m = await measure(page);
    const shot = path.join(OUT, `${label}-resize-${step.width}x${step.height}.png`);
    await page.screenshot({ path: shot, fullPage: false });
    const verdict = passFail(m, { width: step.width, height: step.height });
    results.push({
      browser: label,
      name: `resize-${step.width}x${step.height}`,
      note: "live window resize",
      ...step,
      ...m,
      ...verdict,
      shot,
    });
    console.log(
      `${label} RESIZE ${step.width}x${step.height} scale=${m.scale} nav=${m.navW} preview=${m.previewW} ${m.sideBySide ? "side-by-side" : m.stacked ? "stacked" : "?"} ${verdict.ok ? "PASS" : "FAIL " + verdict.issues.join(",")}`,
    );
  }

  await browser.close();
  return results;
}

const origin = await resolveOrigin();
console.log(`Testing origin: ${origin}`);
console.log(`Screenshots → ${OUT}`);

const all = [];
all.push(...(await runBrowser(chromium, "chromium", origin)));
try {
  all.push(...(await runBrowser(firefox, "firefox", origin)));
} catch (err) {
  console.warn("Firefox skipped:", err?.message || err);
}
try {
  all.push(...(await runBrowser(webkit, "webkit", origin)));
} catch (err) {
  console.warn("WebKit skipped:", err?.message || err);
}

const summaryPath = path.join(OUT, "summary.json");
fs.writeFileSync(summaryPath, JSON.stringify(all, null, 2));
const fails = all.filter((r) => !r.ok);
console.log(`\n${all.length - fails.length}/${all.length} checks passed`);
if (fails.length) {
  console.log("Failures:");
  for (const f of fails) console.log(` - ${f.browser} ${f.name}: ${f.issues.join(", ")}`);
  process.exitCode = 1;
} else {
  console.log("All viewport + live-resize checks passed.");
}
console.log(`Summary: ${summaryPath}`);
