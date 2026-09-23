import "server-only";

import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { INTERNAL_FILES_BUCKET } from "@/lib/internal-files-data";
import { INTERNAL_SITE_URL } from "@/lib/app-domains";
import { isSupabaseServiceRoleConfigured } from "@/lib/supabase/server";
import { createTenancyServerClient } from "@/lib/supabase/tenancy-server";
import { UNIT311_DOCUMENT_LOGO_SVG_PATH } from "@/lib/workspace-document-logo-data";

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

export function requireFilesSupabase() {
  if (!isSupabaseServiceRoleConfigured()) {
    throw new Error("Supabase service role is not configured for document logo storage.");
  }
  return createTenancyServerClient();
}

export function documentLogoStoragePath(workspaceId: string, extension: string) {
  return `${workspaceId}/branding/document-logo.${extension.replace(/^\./, "")}`;
}

export function documentLogoPdfStoragePath(workspaceId: string) {
  return `${workspaceId}/branding/document-logo-pdf.png`;
}

export function extensionForContentType(contentType: string) {
  const normalized = contentType.toLowerCase();
  if (normalized.includes("svg")) return "svg";
  if (normalized.includes("jpeg") || normalized.includes("jpg")) return "jpg";
  return "png";
}

export function resolveDefaultDocumentLogoAssetOrigin(): string {
  const configured = INTERNAL_SITE_URL.trim().replace(/\/$/, "");
  if (configured) return configured;
  const vercelHost = process.env.VERCEL_URL?.trim();
  if (vercelHost) return `https://${vercelHost.replace(/^https?:\/\//, "")}`;
  return "https://internal.unit311central.com";
}

export async function readPublicLogoBytesFromDisk(relativePath: string): Promise<Uint8Array | null> {
  try {
    const relative = relativePath.replace(/^\//, "");
    const buffer = await readFile(join(process.cwd(), "public", relative));
    return new Uint8Array(buffer);
  } catch {
    return null;
  }
}

/** Default Unit311 artwork — SVG from public CDN (Vercel does not bundle public/ into lambdas). */
export async function loadDefaultUnit311DocumentLogoSvgBytes(): Promise<Uint8Array> {
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

export async function downloadStoragePath(storagePath: string): Promise<Uint8Array> {
  const supabase = requireFilesSupabase();
  const { data, error } = await supabase.storage.from(INTERNAL_FILES_BUCKET).download(storagePath);
  if (error || !data) throw new Error(error?.message ?? "Document logo file missing.");
  return new Uint8Array(await data.arrayBuffer());
}

export async function resolveWorkspaceSlug(workspaceId: string, workspaceSlug: string | null) {
  if (workspaceSlug?.trim()) return workspaceSlug.trim().toLowerCase();
  const supabase = createTenancyServerClient();
  const { data } = await supabase.from("workspaces").select("slug").eq("id", workspaceId).maybeSingle();
  return data?.slug ? String(data.slug).trim().toLowerCase() : null;
}
