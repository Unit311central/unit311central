import "server-only";

import { readFile } from "node:fs/promises";
import { join } from "node:path";

import sharp from "sharp";

/**
 * Flatten a PNG logo onto a white background and return a JPEG data URL
 * suitable for jsPDF addImage (avoids transparent PNG checkerboard artefacts).
 */
export async function flattenPngLogoForPdf(relativePublicPath: string): Promise<string | null> {
  try {
    const relative = relativePublicPath.replace(/^\//, "");
    const bytes = await readFile(join(process.cwd(), "public", relative));
    const jpeg = await sharp(bytes)
      .flatten({ background: { r: 255, g: 255, b: 255 } })
      .jpeg({ quality: 92 })
      .toBuffer();
    return `data:image/jpeg;base64,${jpeg.toString("base64")}`;
  } catch {
    return null;
  }
}
