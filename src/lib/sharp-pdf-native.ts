import "server-only";

import { createRequire } from "node:module";

import { primeSharpLibvipsForLambda } from "@/lib/sharp-libvips-lambda-prime";

type SharpConstructor = typeof import("sharp").default;

let cached: SharpConstructor | null = null;

/** Turbopack must not rewrite this to the sharp-* ESM external (see build output). */
const loadSharpModule = new Function(
  "require",
  'return require("sharp");',
) as (require: NodeRequire) => { default?: SharpConstructor } & SharpConstructor;

/** Load sharp from traced node_modules for PDF logo rasterization. */
export function loadSharpForPdf(): SharpConstructor {
  if (cached) return cached;
  primeSharpLibvipsForLambda();
  const require = createRequire(import.meta.url);
  const mod = loadSharpModule(require);
  cached = mod.default ?? mod;
  return cached;
}
