import { chromium } from "playwright";

const outPath = "C:/Users/Usuario/Desktop/newmockup.png";
const url = "http://127.0.0.1:3000/module-review/newmockup";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

await page.goto(url, { waitUntil: "networkidle", timeout: 120000 });
await page.waitForTimeout(1500);

const metrics = await page.evaluate(() => ({
  docHeight: document.documentElement.scrollHeight,
  viewHeight: window.innerHeight,
}));

await page.screenshot({ path: outPath, fullPage: false });
console.log(`Saved ${outPath}`);
console.log(
  `Viewport 1280×800 — doc ${metrics.docHeight}px vs viewport ${metrics.viewHeight}px (scroll: ${metrics.docHeight > metrics.viewHeight ? "yes" : "no"})`,
);

await browser.close();
