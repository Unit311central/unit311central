import "server-only";

import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { Resvg } from "@resvg/resvg-js";

import { INTERNAL_FILES_BUCKET } from "@/lib/internal-files-data";
import { isSupabaseServiceRoleConfigured } from "@/lib/supabase/server";
import { createTenancyServerClient } from "@/lib/supabase/tenancy-server";
import { INTERNAL_SITE_URL } from "@/lib/app-domains";
import {
  isPlatformDefaultDocumentLogoSlug,
  resolveWorkspaceDocumentLogoPreview,
  UNIT311_DOCUMENT_LOGO_ASPECT,
  UNIT311_DOCUMENT_LOGO_SVG_PATH,
  WORKSPACE_DOCUMENT_LOGO_ALLOWED_TYPES,
  WORKSPACE_DOCUMENT_LOGO_MAX_BYTES,
} from "@/lib/workspace-document-logo-data";

export { resolveWorkspaceDocumentLogoPreview };

export type WorkspaceDocumentLogoRecord = {
  storagePath: string | null;
  pdfStoragePath: string | null;
  filename: string | null;
  contentType: string | null;
};

export type WorkspaceDocumentLogoRaster = {
  bytes: Uint8Array;
  format: "PNG" | "JPEG";
  widthPx: number;
  heightPx: number;
};

function requireFilesSupabase() {
  if (!isSupabaseServiceRoleConfigured()) {
    throw new Error("Supabase service role is not configured for document logo storage.");
  }
  return createTenancyServerClient();
}

function documentLogoStoragePath(workspaceId: string, extension: string) {
  return `${workspaceId}/branding/document-logo.${extension.replace(/^\./, "")}`;
}

function documentLogoPdfStoragePath(workspaceId: string) {
  return `${workspaceId}/branding/document-logo-pdf.png`;
}

function extensionForContentType(contentType: string) {
  const normalized = contentType.toLowerCase();
  if (normalized.includes("svg")) return "svg";
  if (normalized.includes("jpeg") || normalized.includes("jpg")) return "jpg";
  return "png";
}

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

function rasterizeSvgToPng(svgBytes: Uint8Array, targetWidth = PDF_DOCUMENT_LOGO_RASTER_WIDTH): Uint8Array {
  const resvg = new Resvg(Buffer.from(svgBytes), {
    fitTo: { mode: "width", value: targetWidth },
    background: "rgba(0,0,0,0)",
  });
  return resvg.render().asPng();
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

function resolveDefaultDocumentLogoAssetOrigin(): string {
  const configured = INTERNAL_SITE_URL.trim().replace(/\/$/, "");
  if (configured) return configured;
  const vercelHost = process.env.VERCEL_URL?.trim();
  if (vercelHost) return `https://${vercelHost.replace(/^https?:\/\//, "")}`;
  return "https://internal.unit311central.com";
}

async function readPublicLogoBytesFromDisk(relativePath: string): Promise<Uint8Array | null> {
  try {
    const relative = relativePath.replace(/^\//, "");
    const buffer = await readFile(join(process.cwd(), "public", relative));
    return new Uint8Array(buffer);
  } catch {
    return null;
  }
}

/** Default Unit311 artwork — SVG from public CDN (Vercel does not bundle public/ into lambdas). */
async function loadDefaultUnit311DocumentLogoSvgBytes(): Promise<Uint8Array> {
  const fromDisk = await readPublicLogoBytesFromDisk(UNIT311_DOCUMENT_LOGO_SVG_PATH);
  if (fromDisk) return fromDisk;

  const origin = resolveDefaultDocumentLogoAssetOrigin();
  const response = await fetch(`${origin}${UNIT311_DOCUMENT_LOGO_SVG_PATH}`, {
    cache: "force-cache",
  });
  if (!response.ok) {
    throw new Error(`Default document logo unavailable (${response.status}).`);
  }
  return new Uint8Array(await response.arrayBuffer());
}

export async function loadDefaultUnit311DocumentLogoRasterForPdf(): Promise<WorkspaceDocumentLogoRaster> {
  if (cachedDefaultUnit311DocumentLogoRaster) return cachedDefaultUnit311DocumentLogoRaster;

  const svgBytes = await loadDefaultUnit311DocumentLogoSvgBytes();
  const png = rasterizeSvgToPngForPdfDocument(svgBytes);
  const dims = await pngDimensions(png);
  cachedDefaultUnit311DocumentLogoRaster = { bytes: png, format: "PNG", ...dims };
  return cachedDefaultUnit311DocumentLogoRaster;
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

export async function getWorkspaceDocumentLogoRecord(
  workspaceId: string,
): Promise<WorkspaceDocumentLogoRecord> {
  const supabase = createTenancyServerClient();
  const { data, error } = await supabase
    .from("workspace_settings")
    .select(
      "document_logo_storage_path, document_logo_pdf_storage_path, document_logo_filename, document_logo_content_type",
    )
    .eq("workspace_id", workspaceId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return {
    storagePath: data?.document_logo_storage_path ? String(data.document_logo_storage_path) : null,
    pdfStoragePath: data?.document_logo_pdf_storage_path
      ? String(data.document_logo_pdf_storage_path)
      : null,
    filename: data?.document_logo_filename ? String(data.document_logo_filename) : null,
    contentType: data?.document_logo_content_type ? String(data.document_logo_content_type) : null,
  };
}

async function downloadStoragePath(storagePath: string): Promise<Uint8Array> {
  const supabase = requireFilesSupabase();
  const { data, error } = await supabase.storage.from(INTERNAL_FILES_BUCKET).download(storagePath);
  if (error || !data) throw new Error(error?.message ?? "Document logo file missing.");
  return new Uint8Array(await data.arrayBuffer());
}

async function resolveWorkspaceSlug(workspaceId: string, workspaceSlug: string | null) {
  if (workspaceSlug?.trim()) return workspaceSlug.trim().toLowerCase();
  const supabase = createTenancyServerClient();
  const { data } = await supabase.from("workspaces").select("slug").eq("id", workspaceId).maybeSingle();
  return data?.slug ? String(data.slug).trim().toLowerCase() : null;
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

  let record: WorkspaceDocumentLogoRecord = {
    storagePath: null,
    pdfStoragePath: null,
    filename: null,
    contentType: null,
  };
  try {
    record = await getWorkspaceDocumentLogoRecord(input.workspaceId);
  } catch {
    if (!isPlatformDefaultDocumentLogoSlug(workspaceSlug)) return null;
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
        const dims = await pngDimensions(png);
        return { bytes: png, format: "PNG", ...dims };
      }
      if (type.includes("png")) {
        const dims = await pngDimensions(bytes);
        return { bytes, format: "PNG", ...dims };
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

  if (record.pdfStoragePath) {
    try {
      const bytes = await downloadStoragePath(record.pdfStoragePath);
      const dims = await pngDimensions(bytes);
      return { bytes, format: "PNG", ...dims };
    } catch {
      // Fall through to platform default.
    }
  }

  if (isPlatformDefaultDocumentLogoSlug(workspaceSlug)) {
    return loadDefaultUnit311DocumentLogoRasterForPdf();
  }

  if (
    !record.storagePath &&
    !record.pdfStoragePath &&
    isPlatformDefaultDocumentLogoSlug(input.workspaceSlug)
  ) {
    return loadDefaultUnit311DocumentLogoRasterForPdf();
  }

  return null;
}

export async function loadWorkspaceDocumentLogoBytesForPreview(input: {
  workspaceId: string;
  workspaceSlug: string | null;
}): Promise<{ bytes: Uint8Array; contentType: string } | null> {
  const record = await getWorkspaceDocumentLogoRecord(input.workspaceId);
  if (record.storagePath) {
    const bytes = await downloadStoragePath(record.storagePath);
    return {
      bytes,
      contentType: record.contentType ?? "application/octet-stream",
    };
  }
  if (isPlatformDefaultDocumentLogoSlug(input.workspaceSlug)) {
    const bytes = await loadDefaultUnit311DocumentLogoSvgBytes();
    return { bytes, contentType: "image/svg+xml" };
  }
  return null;
}

export async function uploadWorkspaceDocumentLogo(workspaceId: string, file: File) {
  if (file.size <= 0 || file.size > WORKSPACE_DOCUMENT_LOGO_MAX_BYTES) {
    throw new Error("Logo file must be between 1 byte and 2 MB.");
  }
  const contentType = (file.type || "").toLowerCase();
  if (!WORKSPACE_DOCUMENT_LOGO_ALLOWED_TYPES.has(contentType)) {
    throw new Error("Logo must be SVG, PNG, or JPEG.");
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const extension = extensionForContentType(contentType);
  const storagePath = documentLogoStoragePath(workspaceId, extension);
  let pdfStoragePath: string | null = null;

  const supabase = requireFilesSupabase();
  const { error: uploadError } = await supabase.storage.from(INTERNAL_FILES_BUCKET).upload(storagePath, bytes, {
    contentType,
    upsert: true,
  });
  if (uploadError) throw new Error(uploadError.message);

  if (contentType.includes("svg")) {
    pdfStoragePath = documentLogoPdfStoragePath(workspaceId);
    const png = rasterizeSvgToPngForPdfDocument(bytes);
    const { error: pdfUploadError } = await supabase.storage
      .from(INTERNAL_FILES_BUCKET)
      .upload(pdfStoragePath, png, { contentType: "image/png", upsert: true });
    if (pdfUploadError) throw new Error(pdfUploadError.message);
  } else if (contentType.includes("png")) {
    pdfStoragePath = storagePath;
  } else if (contentType.includes("jpeg") || contentType.includes("jpg")) {
    pdfStoragePath = storagePath;
  }

  const { data: settingsRow, error: settingsLookupError } = await supabase
    .from("workspace_settings")
    .select("id")
    .eq("workspace_id", workspaceId)
    .maybeSingle();
  if (settingsLookupError) throw new Error(settingsLookupError.message);
  if (!settingsRow?.id) throw new Error("Workspace settings not found.");

  const { error: settingsError } = await supabase
    .from("workspace_settings")
    .update({
      document_logo_storage_path: storagePath,
      document_logo_pdf_storage_path: pdfStoragePath,
      document_logo_filename: file.name,
      document_logo_content_type: contentType,
      updated_at: new Date().toISOString(),
    })
    .eq("workspace_id", workspaceId);
  if (settingsError) throw new Error(settingsError.message);

  return getWorkspaceDocumentLogoRecord(workspaceId);
}

export async function removeWorkspaceDocumentLogo(workspaceId: string) {
  const record = await getWorkspaceDocumentLogoRecord(workspaceId);
  const supabase = requireFilesSupabase();
  const uniquePaths = [...new Set([record.storagePath, record.pdfStoragePath].filter(Boolean))] as string[];
  if (uniquePaths.length) {
    await supabase.storage.from(INTERNAL_FILES_BUCKET).remove(uniquePaths);
  }

  const { error } = await supabase
    .from("workspace_settings")
    .update({
      document_logo_storage_path: null,
      document_logo_pdf_storage_path: null,
      document_logo_filename: null,
      document_logo_content_type: null,
      updated_at: new Date().toISOString(),
    })
    .eq("workspace_id", workspaceId);
  if (error) throw new Error(error.message);
}
