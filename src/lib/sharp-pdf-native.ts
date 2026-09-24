import "server-only";

import { createRequire } from "node:module";
import path from "node:path";

import { primeSharpLibvipsForLambda } from "@/lib/sharp-libvips-lambda-prime";

type SharpConstructor = typeof import("sharp").default;

let cached: SharpConstructor | null = null;

/** Load sharp from traced node_modules for PDF logo rasterization (avoids Turbopack sharp-* ESM external). */
export function loadSharpForPdf(): SharpConstructor {
  if (cached) return cached;
  primeSharpLibvipsForLambda();
  const require = createRequire(import.meta.url);
  const sharpPath = path.join(process.cwd(), ...["node_modules", "sharp"]);
  const mod = require(sharpPath) as { default?: SharpConstructor } & SharpConstructor;
  cached = mod.default ?? mod;
  return cached;
}
