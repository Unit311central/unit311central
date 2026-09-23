import "server-only";

import { Resvg } from "@resvg/resvg-js";
import sharp from "sharp";

import {
  isPlatformDefaultDocumentLogoSlug,
  UNIT311_DOCUMENT_LOGO_ASPECT,
  UNIT311_DOCUMENT_LOGO_PDF_CACHE_VERSION,
  UNIT311_DOCUMENT_LOGO_PNG_PATH,
} from "@/lib/workspace-document-logo-data";
import {
  downloadStoragePath,
  getWorkspaceDocumentLogoRecord,
  loadDefaultUnit311DocumentLogoSvgBytes,
  readPublicLogoBytesFromDisk,
  resolveDefaultDocumentLogoAssetOrigin,
  resolveWorkspaceSlug,
  type WorkspaceDocumentLogoRaster,
} from "@/lib/workspace-document-logo-shared";

/** ~720px is sharp at typical PDF embed widths (~45mm on A4) without bloating file size. */
const PDF_DOCUMENT_LOGO_RASTER_WIDTH = 720;

/** Nav SVG uses white “UNIT” for dark UI; on white paper that text vanishes — use document ink. */
function prepareUnit311SvgForWhitePaperPdf(svgBytes: Uint8Array): Uint8Array {
  const svg = Buffer.from(svgBytes).toString("utf8");
  const adjusted = svg
    .replace(/fill="#ffffff"/gi, 'fill="#0b2d63"')
    .replace(/fill="#FFFFFF"/g, 'fill="#0b2d63"')
    .replace(/fill="white"/gi, 'fill="#0b2d63"');
  return new Uint8Array(Buffer.from(adjusted, "utf8"));
}

/** Rasterize workspace document SVG for PDF / print on white A4. */
export function rasterizeSvgToPngForPdfDocument(
  svgBytes: Uint8Array,
  targetWidth = PDF_DOCUMENT_LOGO_RASTER_WIDTH,
): Uint8Array {
  const prepared = prepareUnit311SvgForWhitePaperPdf(svgBytes);
  const resvg = new Resvg(Buffer.from(prepared), {
    fitTo: { mode: "width", value: targetWidth },
    background: "white",
  });
  return resvg.render().asPng();
}

let cachedDefaultUnit311DocumentLogoRaster: WorkspaceDocumentLogoRaster | null = null;
let cachedDefaultUnit311DocumentLogoVersion = 0;

/** True when PNG includes dark wordmark ink (not just accent lines). */
export async function logoPngHasWordmarkInk(pngBytes: Uint8Array): Promise<boolean> {
  if (!pngBytes.length || pngBytes[0] !== 0x89) return false;
  try {
    const { data, info } = await sharp(Buffer.from(pngBytes)).raw().toBuffer({ resolveWithObject: true });
    let dark = 0;
    const maxY = Math.floor(info.height * 0.65);
    for (let y = 0; y < maxY; y += 1) {
      for (let x = 0; x < info.width; x += 3) {
        const i = (y * info.width + x) * info.channels;
        const r = data[i]!;
        const g = data[i + 1]!;
        const b = data[i + 2]!;
        if (r < 90 && g < 90 && b < 120) dark += 1;
      }
    }
    return dark >= 180;
  } catch {
    return false;
  }
}

async function loadDefaultUnit311DocumentLogoPngBytes(): Promise<Uint8Array | null> {
  const fromDisk = await readPublicLogoBytesFromDisk(UNIT311_DOCUMENT_LOGO_PNG_PATH);
  if (fromDisk?.length && fromDisk[0] === 0x89) return fromDisk;

  const origin = resolveDefaultDocumentLogoAssetOrigin();
  const response = await fetch(`${origin}${UNIT311_DOCUMENT_LOGO_PNG_PATH}`, { cache: "no-store" });
  if (!response.ok) return null;
  const bytes = new Uint8Array(await response.arrayBuffer());
  return bytes.length && bytes[0] === 0x89 ? bytes : null;
}

async function pngDimensions(bytes: Uint8Array): Promise<{ widthPx: number; heightPx: number }> {
  if (bytes.length < 24 || bytes[0] !== 0x89) {
    return {
      widthPx: PDF_DOCUMENT_LOGO_RASTER_WIDTH,
      heightPx: Math.round(PDF_DOCUMENT_LOGO_RASTER_WIDTH / UNIT311_DOCUMENT_LOGO_ASPECT),
    };
  }
  const widthPx = bytes[16]! * 0x1000000 + bytes[17]! * 0x10000 + bytes[18]! * 0x100 + bytes[19]!;
  const heightPx = bytes[20]! * 0x1000000 + bytes[21]! * 0x10000 + bytes[22]! * 0x100 + bytes[23]!;
  return {
    widthPx: widthPx || PDF_DOCUMENT_LOGO_RASTER_WIDTH,
    heightPx: heightPx || Math.round(PDF_DOCUMENT_LOGO_RASTER_WIDTH / UNIT311_DOCUMENT_LOGO_ASPECT),
  };
}

/** Keeps jsPDF embeds small (avoids multi‑MB raw bitmaps from large PNGs). */
async function normalizeLogoRasterForPdfEmbed(
  raster: WorkspaceDocumentLogoRaster,
): Promise<WorkspaceDocumentLogoRaster> {
  if (raster.format !== "PNG" || raster.widthPx <= PDF_DOCUMENT_LOGO_RASTER_WIDTH) {
    return raster;
  }
  const out = await sharp(Buffer.from(raster.bytes))
    .resize({ width: PDF_DOCUMENT_LOGO_RASTER_WIDTH, withoutEnlargement: true })
    .png({ compressionLevel: 9 })
    .toBuffer();
  const bytes = new Uint8Array(out);
  const dims = await pngDimensions(bytes);
  return { bytes, format: "PNG", ...dims };
}

export async function loadDefaultUnit311DocumentLogoRasterForPdf(): Promise<WorkspaceDocumentLogoRaster> {
  if (
    cachedDefaultUnit311DocumentLogoRaster &&
    cachedDefaultUnit311DocumentLogoVersion === UNIT311_DOCUMENT_LOGO_PDF_CACHE_VERSION
  ) {
    return cachedDefaultUnit311DocumentLogoRaster;
  }

  const pngFromAsset = await loadDefaultUnit311DocumentLogoPngBytes();
  if (pngFromAsset && (await logoPngHasWordmarkInk(pngFromAsset))) {
    const dims = await pngDimensions(pngFromAsset);
    cachedDefaultUnit311DocumentLogoRaster = await normalizeLogoRasterForPdfEmbed({
      bytes: pngFromAsset,
      format: "PNG",
      ...dims,
    });
    cachedDefaultUnit311DocumentLogoVersion = UNIT311_DOCUMENT_LOGO_PDF_CACHE_VERSION;
    return cachedDefaultUnit311DocumentLogoRaster;
  }

  const svgBytes = await loadDefaultUnit311DocumentLogoSvgBytes();
  let png = rasterizeSvgToPngForPdfDocument(svgBytes);
  if (!(await logoPngHasWordmarkInk(png))) {
    throw new Error("Default document logo raster is missing wordmark text.");
  }
  const dims = await pngDimensions(png);
  cachedDefaultUnit311DocumentLogoRaster = await normalizeLogoRasterForPdfEmbed({
    bytes: png,
    format: "PNG",
    ...dims,
  });
  cachedDefaultUnit311DocumentLogoVersion = UNIT311_DOCUMENT_LOGO_PDF_CACHE_VERSION;
  return cachedDefaultUnit311DocumentLogoRaster;
}

export async function loadWorkspaceDocumentLogoRasterForPdf(input: {
  workspaceId: string;
  workspaceSlug: string | null;
}): Promise<WorkspaceDocumentLogoRaster | null> {
  let workspaceSlug: string | null = null;
  try {
    workspaceSlug = await resolveWorkspaceSlug(input.workspaceId, input.workspaceSlug);
  } catch {
    workspaceSlug = input.workspaceSlug?.trim().toLowerCase() ?? null;
  }

  let record = {
    storagePath: null as string | null,
    pdfStoragePath: null as string | null,
    filename: null as string | null,
    contentType: null as string | null,
  };
  try {
    record = await getWorkspaceDocumentLogoRecord(input.workspaceId);
  } catch {
    if (!isPlatformDefaultDocumentLogoSlug(workspaceSlug)) return null;
  }

  if (isPlatformDefaultDocumentLogoSlug(workspaceSlug) && !record.storagePath?.trim()) {
    return loadDefaultUnit311DocumentLogoRasterForPdf();
  }

  if (record.storagePath) {
    let bytes: Uint8Array;
    try {
      bytes = await downloadStoragePath(record.storagePath);
    } catch {
      bytes = new Uint8Array();
    }
    if (bytes.length) {
      const type = (record.contentType ?? "").toLowerCase();
      if (type.includes("svg")) {
        const png = rasterizeSvgToPngForPdfDocument(bytes);
        if (await logoPngHasWordmarkInk(png)) {
          const dims = await pngDimensions(png);
          return normalizeLogoRasterForPdfEmbed({ bytes: png, format: "PNG", ...dims });
        }
        if (isPlatformDefaultDocumentLogoSlug(workspaceSlug)) {
          return loadDefaultUnit311DocumentLogoRasterForPdf();
        }
        const dims = await pngDimensions(png);
        return normalizeLogoRasterForPdfEmbed({ bytes: png, format: "PNG", ...dims });
      }
      if (type.includes("png")) {
        const dims = await pngDimensions(bytes);
        const raster = { bytes, format: "PNG" as const, ...dims };
        if (
          isPlatformDefaultDocumentLogoSlug(workspaceSlug) &&
          !(await logoPngHasWordmarkInk(bytes))
        ) {
          return loadDefaultUnit311DocumentLogoRasterForPdf();
        }
        return normalizeLogoRasterForPdfEmbed(raster);
      }
      if (type.includes("jpeg") || type.includes("jpg")) {
        return {
          bytes,
          format: "JPEG",
          widthPx: PDF_DOCUMENT_LOGO_RASTER_WIDTH,
          heightPx: Math.round(PDF_DOCUMENT_LOGO_RASTER_WIDTH / UNIT311_DOCUMENT_LOGO_ASPECT),
        };
      }
    }
  }

  if (record.pdfStoragePath && !isPlatformDefaultDocumentLogoSlug(workspaceSlug)) {
    try {
      const bytes = await downloadStoragePath(record.pdfStoragePath);
      const dims = await pngDimensions(bytes);
      return normalizeLogoRasterForPdfEmbed({ bytes, format: "PNG", ...dims });
    } catch {
      // Fall through to platform default.
    }
  }

  if (isPlatformDefaultDocumentLogoSlug(workspaceSlug)) {
    return loadDefaultUnit311DocumentLogoRasterForPdf();
  }

  return null;
}
