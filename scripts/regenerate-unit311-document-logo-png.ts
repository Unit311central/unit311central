/**
 * Regenerates public/images/unit311central-document.png for white-paper PDF embedding.
 * Run: node --require ./scripts/test-server-only-hook.cjs --import tsx scripts/regenerate-unit311-document-logo-png.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import sharp from "sharp";

import { rasterizeSvgToPngForPdfDocument } from "@/lib/workspace-document-logo-service";

async function darkPixelCount(png: Uint8Array): Promise<number> {
  const { data, info } = await sharp(Buffer.from(png)).raw().toBuffer({ resolveWithObject: true });
  let dark = 0;
  const maxY = Math.floor(info.height * 0.65);
  for (let y = 0; y < maxY; y += 1) {
    for (let x = 0; x < info.width; x += 4) {
      const i = (y * info.width + x) * info.channels;
      const r = data[i]!;
      const g = data[i + 1]!;
      const b = data[i + 2]!;
      if (r < 90 && g < 90 && b < 120) dark += 1;
    }
  }
  return dark;
}

async function main() {
  const svgBytes = readFileSync(join(process.cwd(), "public/images/unit311central.svg"));
  const png = rasterizeSvgToPngForPdfDocument(svgBytes, 1800);
  const dark = await darkPixelCount(png);
  if (dark < 200) {
    throw new Error(`Regenerated logo PNG lacks wordmark ink (dark=${dark}).`);
  }
  const out = join(process.cwd(), "public/images/unit311central-document.png");
  writeFileSync(out, png);
  console.log(`Wrote ${out} (${png.byteLength} bytes, dark pixels=${dark})`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
