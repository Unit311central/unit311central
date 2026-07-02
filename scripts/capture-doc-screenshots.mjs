import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = "https://barcelonadronecenter.vercel.app";
const OUT = path.join(process.cwd(), "docs", "screenshots");

const shots = [
  { name: "internal-home", url: `${BASE}/internaldashboard`, wait: 4000 },
  { name: "internal-clients", url: `${BASE}/internaldashboard?view=clients`, wait: 3500 },
  { name: "internal-crm", url: `${BASE}/internaldashboard?view=crm`, wait: 3500 },
  { name: "internal-logistics", url: `${BASE}/internaldashboard?view=logistics`, wait: 4500 },
  { name: "internal-office-locations", url: `${BASE}/internaldashboard?view=office-locations`, wait: 3000 },
  { name: "internal-file-explorer", url: `${BASE}/internaldashboard?view=files-internal`, wait: 3500 },
  { name: "operations-login", url: `${BASE}/`, wait: 2000 },
  { name: "client-login", url: `${BASE}/clientlogin`, wait: 2000 },
];

fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
});

for (const shot of shots) {
  const page = await context.newPage();
  try {
    await page.goto(shot.url, { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForTimeout(shot.wait);
    await page.screenshot({
      path: path.join(OUT, `${shot.name}-1440.png`),
      fullPage: false,
    });
    console.log(`Captured ${shot.name}`);
  } catch (error) {
    console.warn(`Failed ${shot.name}:`, error.message);
  } finally {
    await page.close();
  }
}

await browser.close();
console.log(`Screenshots saved to ${OUT}`);
