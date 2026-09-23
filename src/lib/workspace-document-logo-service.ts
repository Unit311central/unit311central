import "server-only";

import { INTERNAL_FILES_BUCKET } from "@/lib/internal-files-data";
import {
  isPlatformDefaultDocumentLogoSlug,
  resolveWorkspaceDocumentLogoPreview,
  WORKSPACE_DOCUMENT_LOGO_ALLOWED_TYPES,
  WORKSPACE_DOCUMENT_LOGO_MAX_BYTES,
} from "@/lib/workspace-document-logo-data";
import {
  documentLogoPdfStoragePath,
  documentLogoStoragePath,
  downloadStoragePath,
  extensionForContentType,
  getWorkspaceDocumentLogoRecord,
  loadDefaultUnit311DocumentLogoSvgBytes,
  requireFilesSupabase,
  type WorkspaceDocumentLogoRecord,
} from "@/lib/workspace-document-logo-shared";

export { resolveWorkspaceDocumentLogoPreview };
export type { WorkspaceDocumentLogoRecord } from "@/lib/workspace-document-logo-shared";

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
    const { rasterizeSvgToPngForPdfDocument } = await import("@/lib/workspace-document-logo-pdf-raster");
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

export { getWorkspaceDocumentLogoRecord } from "@/lib/workspace-document-logo-shared";
