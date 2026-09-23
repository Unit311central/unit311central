/** Public master assets for Unit311 Central (internal workspace document branding default). */
export const UNIT311_DOCUMENT_LOGO_SVG_PATH = "/images/unit311central.svg";
export const UNIT311_DOCUMENT_LOGO_PNG_PATH = "/images/unit311central-document.png";

/** Bumped when default document PNG bytes change — invalidates in-process PDF logo cache. */
export const UNIT311_DOCUMENT_LOGO_PDF_CACHE_VERSION = 3;

export const UNIT311_DOCUMENT_LOGO_ASPECT = 320 / 120;

export const WORKSPACE_DOCUMENT_LOGO_MAX_BYTES = 2 * 1024 * 1024;

export const WORKSPACE_DOCUMENT_LOGO_ALLOWED_TYPES = new Set([
  "image/png",
  "image/svg+xml",
  "image/jpeg",
  "image/jpg",
]);

export function isPlatformDefaultDocumentLogoSlug(slug: string | null | undefined): boolean {
  const normalized = String(slug ?? "")
    .trim()
    .toLowerCase();
  return normalized === "unit311" || normalized === "internal";
}

export type WorkspaceDocumentLogoPreviewInput = {
  storagePath: string | null;
};

export function resolveWorkspaceDocumentLogoPreview(input: {
  workspaceSlug: string | null;
  record: WorkspaceDocumentLogoPreviewInput;
}): { previewUrl: string | null; isDefault: boolean; hasLogo: boolean } {
  if (input.record.storagePath) {
    return {
      previewUrl: "/api/workspace/document-logo/file",
      isDefault: false,
      hasLogo: true,
    };
  }
  if (isPlatformDefaultDocumentLogoSlug(input.workspaceSlug)) {
    return {
      previewUrl: UNIT311_DOCUMENT_LOGO_SVG_PATH,
      isDefault: true,
      hasLogo: true,
    };
  }
  return { previewUrl: null, isDefault: false, hasLogo: false };
}
