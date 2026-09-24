#!/usr/bin/env node
/**
 * Turbopack NFT traces often omit libvips-cpp.so even with outputFileTracingIncludes.
 * Materialize sharp externals (no symlinks), vendor libvips under .next/server, merge nft.
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const globOrig = require("next/dist/compiled/glob");

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TRACE_REL = ".next/server/app/api/financials/quotes/[id]/route.js.nft.json";
const VENDOR_ROOT = path.join(projectRoot, ".next/server/sharp-vendor");
const VENDOR_IMG = path.join(VENDOR_ROOT, "@img");

const INCLUDE_GLOBS = [
  "public/images/unit311central-document.png",
  "public/images/unit311central.svg",
  "node_modules/@img/sharp-libvips-linux-x64/lib/libvips-cpp.so.*",
  "node_modules/@img/sharp-libvips-linux-x64/lib/glib-2.0/**",
  "node_modules/@img/sharp-linux-x64/**",
  "node_modules/sharp/package.json",
  "node_modules/sharp/dist/**",
  "node_modules/@resvg/resvg-js-linux-x64-gnu/**",
  "node_modules/@img/colour/**",
];

/** Runtime sources accidentally traced into the lambda; keep compiled output + node_modules only. */
function shouldKeepTracedFile(rel) {
  const norm = rel.replace(/\\/g, "/");
  if (norm.includes("/public/images/unit311central")) return true;
  if (norm.includes("/node_modules/")) return true;
  if (norm.includes("/server/chunks/")) return true;
  if (norm.includes("/server/sharp-vendor/")) return true;
  if (norm.includes("/.next/node_modules/")) return true;
  if (/\/server\/app\//.test(norm)) return true;
  if (norm.includes("/server/sharp-vendor/")) return true;
  // Turbopack external sharp package lives under .next/node_modules (materialized below).
  if (/\/\.next\/node_modules\//.test(norm)) return true;
  if (norm.includes("sharp-") && norm.includes("/node_modules/")) return true;

  if (norm.includes("/src/")) return false;
  if (norm.includes("/scripts/")) return false;
  if (norm.includes("/supabase/")) return false;
  if (norm.includes("/diagrams/")) return false;
  if (norm.includes("/mobile/")) return false;
  if (norm.includes("/docs/") && !norm.includes("node_modules")) return false;

  if (/(\/|^)(AGENTS|ARCHITECTURE|README|CLAUDE|CONTRIBUTING|DEPLOYMENT)\.md$/i.test(norm)) return false;
  if (norm.endsWith("/next.config.ts") || norm.endsWith("/vercel.json")) return false;
  if (norm.endsWith("/package.json") && !norm.includes("node_modules")) return false;
  if (norm.endsWith("/package-lock.json")) return false;
  if (norm.endsWith("/tsconfig.json")) return false;
  if (norm.endsWith("/eslint.config.mjs")) return false;
  if (norm.endsWith("/postcss.config.mjs")) return false;
  if (norm.endsWith("Architecture_Report.pdf")) return false;

  return true;
}

function glob(pattern) {
  return new Promise((resolve, reject) => {
    globOrig(pattern, { cwd: projectRoot, nodir: true, dot: true }, (err, files) => {
      if (err) reject(err);
      else resolve(files);
    });
  });
}

function copyDir(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.cpSync(src, dest, { recursive: true, dereference: true });
}

function writeExternalSharpPackage(externalPath, externalName, sourceDir) {
  fs.rmSync(externalPath, { recursive: true, force: true });
  copyDir(sourceDir, externalPath);
  const pkgPath = path.join(externalPath, "package.json");
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    pkg.name = externalName;
    fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
  }
}

function materializeNextSharpExternals() {
  const nextNm = path.join(projectRoot, ".next/node_modules");
  const serverNm = path.join(projectRoot, ".next/server/node_modules");
  const chunksNm = path.join(projectRoot, ".next/server/chunks/node_modules");
  if (!fs.existsSync(nextNm)) return;

  for (const externalName of fs.readdirSync(nextNm)) {
    if (!externalName.startsWith("sharp-")) continue;
    const externalPath = path.join(nextNm, externalName);
    let stat;
    try {
      stat = fs.lstatSync(externalPath);
    } catch {
      continue;
    }

    const sourceDir = stat.isSymbolicLink() ? fs.realpathSync(externalPath) : externalPath;
    writeExternalSharpPackage(externalPath, externalName, sourceDir);

    for (const destRoot of [serverNm, chunksNm]) {
      fs.mkdirSync(destRoot, { recursive: true });
      writeExternalSharpPackage(path.join(destRoot, externalName), externalName, sourceDir);
    }
  }
}

function collectMaterializedSharpExternalNftPaths(pageDir) {
  const roots = [
    path.join(projectRoot, ".next/node_modules"),
    path.join(projectRoot, ".next/server/node_modules"),
    path.join(projectRoot, ".next/server/chunks/node_modules"),
  ];
  const out = [];

  for (const root of roots) {
    if (!fs.existsSync(root)) continue;
    for (const name of fs.readdirSync(root)) {
      if (!name.startsWith("sharp-")) continue;
      const absRoot = path.join(root, name);
      const walk = (absDir) => {
        for (const ent of fs.readdirSync(absDir, { withFileTypes: true })) {
          const abs = path.join(absDir, ent.name);
          if (ent.isDirectory()) walk(abs);
          else out.push(path.relative(pageDir, abs).replace(/\\/g, "/"));
        }
      };
      walk(absRoot);
    }
  }
  return out;
}

function vendorSharpNativeUnderServer() {
  const libvipsSrc = path.join(projectRoot, "node_modules/@img/sharp-libvips-linux-x64");
  const sharpLinuxSrc = path.join(projectRoot, "node_modules/@img/sharp-linux-x64");
  if (!fs.existsSync(libvipsSrc) || !fs.existsSync(sharpLinuxSrc)) {
    console.error("patch failed: @img/sharp-libvips-linux-x64 or sharp-linux-x64 missing — run npm install --include=optional");
    process.exit(1);
  }

  fs.rmSync(VENDOR_ROOT, { recursive: true, force: true });
  fs.mkdirSync(VENDOR_IMG, { recursive: true });
  copyDir(libvipsSrc, path.join(VENDOR_IMG, "sharp-libvips-linux-x64"));
  copyDir(sharpLinuxSrc, path.join(VENDOR_IMG, "sharp-linux-x64"));

  const libvipsSo = path.join(libvipsSrc, "lib/libvips-cpp.so.8.18.3");
  const mirrorTargets = [
    path.join(sharpLinuxSrc, "lib/libvips-cpp.so.8.18.3"),
    path.join(VENDOR_IMG, "sharp-linux-x64/lib/libvips-cpp.so.8.18.3"),
  ];
  for (const dest of mirrorTargets) {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(libvipsSo, dest);
  }
}

function collectVendorNftPaths(pageDir) {
  const out = [];
  function walk(absDir, relFromVendor) {
    for (const ent of fs.readdirSync(absDir, { withFileTypes: true })) {
      const abs = path.join(absDir, ent.name);
      const relVendor = path.join(relFromVendor, ent.name).replace(/\\/g, "/");
      if (ent.isDirectory()) walk(abs, relVendor);
      else {
        const relToPage = path.relative(pageDir, abs).replace(/\\/g, "/");
        out.push(relToPage);
      }
    }
  }
  walk(VENDOR_ROOT, "");
  return out;
}

async function main() {
  materializeNextSharpExternals();
  vendorSharpNativeUnderServer();

  const tracePath = path.join(projectRoot, TRACE_REL);
  if (!fs.existsSync(tracePath)) {
    console.error(`missing ${TRACE_REL} — run next build first`);
    process.exit(1);
  }

  const pageDir = path.dirname(tracePath);
  const traceContent = JSON.parse(fs.readFileSync(tracePath, "utf8"));
  const combined = new Set((traceContent.files ?? []).filter(shouldKeepTracedFile));

  for (const pattern of INCLUDE_GLOBS) {
    const matches = await glob(pattern);
    for (const file of matches) {
      const rel = path.relative(pageDir, path.join(projectRoot, file)).replace(/\\/g, "/");
      combined.add(rel);
    }
  }

  for (const rel of collectVendorNftPaths(pageDir)) combined.add(rel);
  for (const rel of collectMaterializedSharpExternalNftPaths(pageDir)) combined.add(rel);

  const sorted = [...combined].sort();
  fs.writeFileSync(tracePath, JSON.stringify({ version: traceContent.version ?? 1, files: sorted }));

  const hasLibvips = sorted.some((f) => /libvips-cpp\.so\./.test(f));
  if (!hasLibvips) {
    console.error("patch failed: libvips-cpp.so still missing from trace");
    process.exit(1);
  }
  console.log(
    `ok  patch-sales-quote-pdf-native-trace (${sorted.length} files, libvips-cpp.so included)`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
