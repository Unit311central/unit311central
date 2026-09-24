import "server-only";

import fs from "node:fs";
import path from "node:path";

const LIBVIPS_SO = "libvips-cpp.so.8.18.3";

let primed = false;

/** Ensure dlopen can find libvips when the PDF lambda runs on Vercel (RPATH + trace layout). */
export function primeSharpLibvipsForLambda(): void {
  if (primed) return;
  primed = true;

  const libDirs: string[] = [];
  for (const candidate of [
    path.join(process.cwd(), "node_modules/@img/sharp-libvips-linux-x64/lib"),
    path.join(process.cwd(), ".next/server/sharp-vendor/@img/sharp-libvips-linux-x64/lib"),
  ]) {
    if (fs.existsSync(path.join(candidate, LIBVIPS_SO))) libDirs.push(candidate);
  }

  if (!libDirs.length) return;

  const parts = new Set((process.env.LD_LIBRARY_PATH ?? "").split(":").filter(Boolean));
  for (const dir of libDirs) parts.add(dir);
  process.env.LD_LIBRARY_PATH = [...parts].join(":");
}
