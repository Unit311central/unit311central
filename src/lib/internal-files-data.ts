export const INTERNAL_FILES_BUCKET = "internal-files";
export const INTERNAL_FILES_MAX_BYTES = 52_428_800;

export type FileCategory = {
  id: string;
  name: string;
  color: string;
  createdAt: string;
};

export type FileFolder = {
  id: string;
  name: string;
  parentId: string | null;
  categoryId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FileObject = {
  id: string;
  name: string;
  folderId: string | null;
  categoryId: string | null;
  storagePath: string;
  mimeType: string | null;
  extension: string | null;
  sizeBytes: number;
  createdAt: string;
  updatedAt: string;
};

export type BrowseEntry =
  | { kind: "folder"; item: FileFolder }
  | { kind: "file"; item: FileObject };

export type BreadcrumbSegment = {
  id: string | null;
  name: string;
};

export function getFileExtension(filename: string) {
  const parts = filename.split(".");
  if (parts.length < 2) return "";
  return parts.pop()?.toLowerCase() ?? "";
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export function formatFileDate(value: string) {
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function fileTypeLabel(extension: string | null, mimeType: string | null) {
  const ext = extension?.toLowerCase() ?? "";
  if (["doc", "docx"].includes(ext)) return "Word";
  if (["xls", "xlsx", "csv"].includes(ext)) return "Excel";
  if (["ppt", "pptx"].includes(ext)) return "PowerPoint";
  if (ext === "pdf") return "PDF";
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) return "Image";
  if (["zip", "rar", "7z"].includes(ext)) return "Archive";
  if (mimeType?.startsWith("text/")) return "Text";
  return ext ? ext.toUpperCase() : "File";
}

export function isPreviewable(extension: string | null, mimeType: string | null) {
  const ext = extension?.toLowerCase() ?? "";
  return (
    ext === "pdf" ||
    ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext) ||
    mimeType?.startsWith("image/") === true ||
    mimeType === "application/pdf"
  );
}
