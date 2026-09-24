#!/usr/bin/env node
/**
 * After `npm run build`, assert list + compose-context API traces exclude
 * sharp, resvg, pdf-lib, and jspdf.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const NEXT = path.join(ROOT, ".next", "server", "app", "api", "financials", "sales-quotes");

const ROUTES = [
  path.join(NEXT, "route.js.nft.json"),
  path.join(NEXT, "compose-context", "route.js.nft.json"),
];

const FORBIDDEN = [
  /node_modules[/\\]sharp[/\\]/,
  /node_modules[/\\]@img[/\\]sharp/,
  /node_modules[/\\]@resvg[/\\]/,
  /node_modules[/\\]pdf-lib[/\\]/,
  /node_modules[/\\]jspdf[/\\]/,
  /node_modules[/\\]sharp-/,
];

function loadFiles(nftPath) {
  assert.ok(fs.existsSync(nftPath), `missing ${nftPath} — run npm run build first`);
  const json = JSON.parse(fs.readFileSync(nftPath, "utf8"));
  return json.files ?? [];
}

for (const nftPath of ROUTES) {
  const files = loadFiles(nftPath);
  const hits = [];
  for (const file of files) {
    for (const pattern of FORBIDDEN) {
      if (pattern.test(file)) {
        hits.push(file);
      }
    }
  }
  const rel = path.relative(ROOT, nftPath);
  assert.equal(
    hits.length,
    0,
    `${rel} must not trace PDF/sharp deps; found:\n${hits.slice(0, 20).join("\n")}`,
  );
  console.log(`ok  ${rel} (${files.length} traced files, 0 forbidden)`);
}

console.log("ok  prove-sales-quotes-api-routes-no-sharp");
