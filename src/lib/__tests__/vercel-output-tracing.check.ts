/**
 * Vercel output tracing regression — public static assets must not be duplicated
 * into every serverless function trace (causes ENOSPC during deploy).
 *
 * Run after `npm run build`:
 *   node --import tsx src/lib/__tests__/vercel-output-tracing.check.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function walkNftFiles(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkNftFiles(full, out);
    else if (entry.name.endsWith(".nft.json")) out.push(full);
  }
  return out;
}

const serverDir = path.join(process.cwd(), ".next/server");
assert.ok(fs.existsSync(serverDir), "run npm run build before vercel-output-tracing.check.ts");

let publicRefs = 0;
let videoRefs = 0;
let aggregateTracedBytes = 0;

for (const nftPath of walkNftFiles(path.join(serverDir, "app"))) {
  const nft = JSON.parse(fs.readFileSync(nftPath, "utf8")) as { files?: string[] };
  const base = path.dirname(nftPath);
  for (const relative of nft.files ?? []) {
    const absolute = path.resolve(base, relative);
    if (!relative.includes("/public/")) continue;
    publicRefs += 1;
    if (relative.includes("/public/videos/")) videoRefs += 1;
    try {
      aggregateTracedBytes += fs.statSync(absolute).size;
    } catch {
      // Resolved paths can be missing locally when excludes apply — that is fine.
    }
  }
}

assert.equal(videoRefs, 0, "public/videos must not be traced into serverless functions");
assert.ok(
  publicRefs < 500,
  `expected minimal public/ tracing after includes, got ${publicRefs} references`,
);

console.log(
  `vercel-output-tracing.check.ts — public refs=${publicRefs}, video refs=${videoRefs}, traced public MB=${(aggregateTracedBytes / 1024 / 1024).toFixed(1)}`,
);
