import { chromium } from "playwright";

const outPath = "C:/Users/Usuario/Desktop/newmockup.png";
const url = "http://127.0.0.1:3000/module-review/newmockup";

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  deviceScaleFactor: 1,
});
const page = await context.newPage();

await page.goto(url, { waitUntil: "networkidle", timeout: 120000 });
await page.waitForSelector("[data-module-review-mockup-page]", { state: "visible", timeout: 60000 });
await page.waitForSelector("[data-module-review-mockup]", { state: "visible", timeout: 60000 });
await page.waitForTimeout(2500);

const metrics = await page.evaluate(() => ({
  docHeight: document.documentElement.scrollHeight,
  viewHeight: window.innerHeight,
  hasTitle: document.body.innerText.includes("UNIT311 CENTRAL MODULE REVIEW"),
}));

if (!metrics.hasTitle) {
  throw new Error("Mockup page did not render expected content.");
}

await page.screenshot({ path: outPath, fullPage: true });

console.log(`Saved ${outPath}`);
console.log(
  `doc ${metrics.docHeight}px viewport ${metrics.viewHeight}px scroll=${metrics.docHeight > metrics.viewHeight}`,
);

await browser.close();
