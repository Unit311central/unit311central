import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";

const docs = path.join(process.cwd(), "docs");
const svgPath = path.join(docs, "unit311-services-diagram.svg");
const outJpeg = path.join(docs, "unit311-services-diagram.jpg");

const svg = fs.readFileSync(svgPath, "utf8");
const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
  html, body { margin:0; padding:0; background:#020617; }
  body { width:1200px; height:900px; overflow:hidden; }
</style></head>
<body>${svg}</body></html>`;

const htmlPath = path.join(docs, "_render-services-diagram.html");
fs.writeFileSync(htmlPath, html);

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1200, height: 900 },
  deviceScaleFactor: 2,
});

await page.goto(pathToFileURL(htmlPath).href, { waitUntil: "load" });
await page.waitForTimeout(500);

await page.screenshot({
  path: outJpeg,
  type: "jpeg",
  quality: 92,
  fullPage: false,
});

await browser.close();
fs.unlinkSync(htmlPath);

console.log(`JPEG saved: ${outJpeg}`);
