/**
 * Capture Sales Management Phase 1 UI on local Demo and build review PDF.
 * Requires local dev with ENABLE_DEMO_LOGIN=true and demo.localhost:3000.
 */
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

import { chromium } from "playwright";
import { jsPDF } from "jspdf";

const PORT = process.env.PORT ?? "3000";
const API_ORIGIN = `http://127.0.0.1:${PORT}`;
const BROWSER_ORIGIN = `http://demo.localhost:${PORT}`;
const DEMO_HOST = "demo.localhost";
const OUT_DIR = join(process.cwd(), "tmp", "sales-management-phase1-review");
const PDF_OUT = join(homedir(), "Desktop", "Sales-Management-Phase-1-Review.pdf");
const VIEWPORT = { width: 1440, height: 900 };

async function loginForBrowser(context) {
  const res = await fetch(`${API_ORIGIN}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Host: DEMO_HOST },
    body: JSON.stringify({
      username: "client",
      password: "client",
      returnTo: BROWSER_ORIGIN,
      next: "/dashboard",
    }),
  });
  if (!res.ok) throw new Error(`Demo login failed: ${res.status}`);
  const cookies = (res.headers.getSetCookie?.() ?? [])
    .map((raw) => {
      const [pair] = raw.split(";");
      const eq = pair.indexOf("=");
      return {
        name: pair.slice(0, eq).trim(),
        value: pair.slice(eq + 1).trim(),
        domain: DEMO_HOST,
        path: "/",
      };
    })
    .filter(Boolean);
  if (!cookies.length) throw new Error("Demo login returned no cookies");
  await context.addCookies(cookies);
}

async function waitForSalesShell(page) {
  await page.waitForSelector('[aria-label="Sales Management sections"]', { timeout: 120000 });
}

async function waitForSelectedTab(page, tabLabel) {
  await page.waitForFunction(
    (label) => {
      const selected = document.querySelector('[aria-label="Sales Management sections"] [role="tab"][aria-selected="true"]');
      return selected?.textContent?.trim() === label;
    },
    tabLabel,
    { timeout: 30000 },
  );
}

async function waitForTabReady(page, shot) {
  const panel = page.locator('[role="tabpanel"]').first();
  await panel.waitFor({ state: "visible", timeout: 30000 });

  if (shot.tab === "dashboard") {
    await page.waitForFunction(
      () => {
        const panelText = document.querySelector('[role="tabpanel"]')?.textContent ?? "";
        if (panelText.includes("Loading sales dashboard")) return false;
        if (!/open pipeline value/i.test(panelText)) return false;
        const pie = document.querySelector('[role="tabpanel"] .recharts-pie');
        const empty = panelText.includes("No CRM leads in this workspace");
        return Boolean(pie || empty);
      },
      { timeout: 90000 },
    );
    return;
  }

  if (shot.tab === "prospects") {
    await page.waitForFunction(
      () => {
        const text = document.querySelector('[role="tabpanel"]')?.textContent ?? "";
        return text.includes("Prospects") && !text.includes("Loading leads");
      },
      { timeout: 60000 },
    );
    return;
  }

  if (shot.tab === "discovery") {
    await page.waitForFunction(
      () => {
        const text = document.querySelector('[role="tabpanel"]')?.textContent ?? "";
        return /meeting/i.test(text) && !/Loading sales dashboard/i.test(text);
      },
      { timeout: 60000 },
    );
    return;
  }

  if (shot.tab === "opportunities" && !shot.extra) {
    await page.waitForFunction(
      () => {
        const text = document.querySelector('[role="tabpanel"]')?.textContent ?? "";
        return text.includes("Qualified and active deals") && !text.includes("Loading leads");
      },
      { timeout: 60000 },
    );
    return;
  }

  if (shot.extra?.includes("panel=quotes")) {
    await page.waitForFunction(
      () => {
        const text = document.querySelector('[role="tabpanel"]')?.textContent ?? "";
        return /sales quotes/i.test(text) && /open quotes/i.test(text) && !/loading/i.test(text);
      },
      { timeout: 60000 },
    );
    return;
  }

  if (shot.tab === "pipeline") {
    await page.waitForFunction(
      () => {
        const text = document.querySelector('[role="tabpanel"]')?.textContent ?? "";
        return text.includes("Pipeline funnel") && !text.includes("Loading");
      },
      { timeout: 60000 },
    );
  }
}

async function gotoTab(page, shot) {
  const url = `${BROWSER_ORIGIN}/dashboard?view=sales-management&tab=${shot.tab}${shot.extra ?? ""}`;
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 120000 });
  await waitForSalesShell(page);
  await waitForSelectedTab(page, shot.tabLabel);
  if (!page.url().includes(`tab=${shot.tab}`)) {
    throw new Error(`URL lost tab param for ${shot.tabLabel}: ${page.url()}`);
  }
  await waitForTabReady(page, shot);
  await page.waitForTimeout(400);
}

async function capture() {
  mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: VIEWPORT });
  await loginForBrowser(context);
  const page = await context.newPage();

  const shots = [
    {
      tab: "dashboard",
      tabLabel: "Dashboard",
      title: "1. Sales Dashboard",
      caption: "Live KPIs and charts from CRM leads, quotes, and discovery meetings.",
    },
    {
      tab: "prospects",
      tabLabel: "Prospects",
      title: "2. Prospects",
      caption: "Cold/Warm CRM leads — same crm_leads register, filtered view.",
    },
    {
      tab: "discovery",
      tabLabel: "Discovery",
      title: "3. Discovery",
      caption: "Re-homed discovery meetings workspace.",
    },
    {
      tab: "opportunities",
      tabLabel: "Opportunities",
      title: "4. Opportunities (deals)",
      caption: "Qualified/active CRM opportunities with full deal workspace.",
    },
    {
      tab: "opportunities",
      tabLabel: "Opportunities",
      extra: "&panel=quotes",
      title: "5. Sales Quotes",
      caption: "Re-homed sales quotes linked to CRM and Financials.",
    },
    {
      tab: "pipeline",
      tabLabel: "Pipeline",
      title: "6. Pipeline",
      caption: "Analytical pipeline funnel and kanban over existing CRM data.",
    },
  ];

  const files = [];
  for (const [index, shot] of shots.entries()) {
    await gotoTab(page, shot);
    const path = join(OUT_DIR, `${String(index + 1).padStart(2, "0")}-${shot.tab}${shot.extra ? "-quotes" : ""}.png`);
    await page.locator('[role="tabpanel"]').first().screenshot({ path });
    files.push({ ...shot, file: path });
  }

  await browser.close();
  return files;
}

function buildPdf(shots) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageW = 297;
  const pageH = 210;
  const margin = 12;
  const contentW = pageW - margin * 2;
  let first = true;
  for (const shot of shots) {
    if (!first) doc.addPage();
    first = false;
    doc.setFillColor(8, 20, 36);
    doc.rect(0, 0, pageW, pageH, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.text(shot.title, margin, 14);
    doc.setFontSize(9);
    doc.setTextColor(170, 180, 195);
    const lines = doc.splitTextToSize(shot.caption, contentW);
    doc.text(lines, margin, 21);
    const imgTop = 28 + lines.length * 4;
    const maxImgH = pageH - imgTop - margin;
    const dataUrl = `data:image/png;base64,${readFileSync(shot.file).toString("base64")}`;
    const props = doc.getImageProperties(dataUrl);
    let imgW = contentW;
    let imgH = imgW / (props.width / props.height);
    if (imgH > maxImgH) {
      imgH = maxImgH;
      imgW = imgH * (props.width / props.height);
    }
    doc.addImage(dataUrl, "PNG", margin + (contentW - imgW) / 2, imgTop, imgW, imgH, undefined, "FAST");
  }
  doc.save(PDF_OUT);
}

if (!existsSync(join(process.cwd(), "node_modules", "playwright"))) {
  console.error("Playwright required");
  process.exit(1);
}

const shots = await capture();
buildPdf(shots);
console.log(`PDF saved: ${PDF_OUT}`);
