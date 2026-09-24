#!/usr/bin/env node
/**
 * Turbopack NFT traces often omit libvips-cpp.so even with outputFileTracingIncludes.
 * Merge required sharp/resvg native assets into the quotes [id] lambda trace.
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const globOrig = require("next/dist/compiled/glob");

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TRACE_REL = ".next/server/app/api/financials/quotes/[id]/route.js.nft.json";

const INCLUDE_GLOBS = [
  "node_modules/@img/sharp-libvips-linux-x64/lib/libvips-cpp.so.*",
  "node_modules/@img/sharp-libvips-linux-x64/lib/glib-2.0/**",
  "node_modules/@img/sharp-linux-x64/**",
  "node_modules/sharp/package.json",
  "node_modules/sharp/dist/**",
  "node_modules/@resvg/resvg-js-linux-x64-gnu/**",
];

function glob(pattern) {
  return new Promise((resolve, reject) => {
    globOrig(pattern, { cwd: projectRoot, nodir: true, dot: true }, (err, files) => {
      if (err) reject(err);
      else resolve(files);
    });
  });
}

async function main() {
  const tracePath = path.join(projectRoot, TRACE_REL);
  if (!fs.existsSync(tracePath)) {
    console.error(`missing ${TRACE_REL} — run next build first`);
    process.exit(1);
  }

  const pageDir = path.dirname(tracePath);
  const traceContent = JSON.parse(fs.readFileSync(tracePath, "utf8"));
  const combined = new Set(traceContent.files ?? []);

  for (const pattern of INCLUDE_GLOBS) {
    const matches = await glob(pattern);
    for (const file of matches) {
      const rel = path.relative(pageDir, path.join(projectRoot, file)).replace(/\\/g, "/");
      combined.add(rel);
    }
  }

  const sorted = [...combined].sort();
  fs.writeFileSync(tracePath, JSON.stringify({ version: traceContent.version ?? 1, files: sorted }));

  const hasLibvips = sorted.some((f) => /libvips-cpp\.so\./.test(f));
  if (!hasLibvips) {
    console.error("patch failed: libvips-cpp.so still missing from trace");
    process.exit(1);
  }
  console.log(`ok  patch-sales-quote-pdf-native-trace (${sorted.length} files, libvips-cpp.so included)`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
