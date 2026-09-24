#!/usr/bin/env node
/**
 * After `npm run build`, assert the quotes [id] PDF lambda trace includes libvips.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const nftPath = path.join(
  process.cwd(),
  ".next",
  "server",
  "app",
  "api",
  "financials",
  "quotes",
  "[id]",
  "route.js.nft.json",
);

assert.ok(fs.existsSync(nftPath), `missing ${nftPath} — run npm run build first`);

const files = JSON.parse(fs.readFileSync(nftPath, "utf8")).files ?? [];

const required = [
  /sharp-libvips-linux-x64\/lib\/libvips-cpp\.so\.8\.18\.3$/,
  /sharp-linux-x64.*\.node$/,
  /node_modules\/sharp\//,
  /sharp-vendor\/@img\/sharp-libvips-linux-x64\/lib\/libvips-cpp\.so\.8\.18\.3$/,
];

const missing = required.filter((re) => !files.some((f) => re.test(f.replace(/\\/g, "/"))));
assert.equal(
  missing.length,
  0,
  `PDF lambda nft missing native sharp/libvips files. Have ${files.length} traced files.`,
);

console.log(`ok  prove-sales-quote-pdf-lambda-libvips (${files.length} files, libvips-cpp.so present)`);
