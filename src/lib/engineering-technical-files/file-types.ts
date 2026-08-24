export const TECHNICAL_FILE_CATEGORIES = [
  "CAD",
  "3D Model",
  "Drawing",
  "Specification",
  "Design Document",
  "Test / Validation",
  "Manufacturing",
  "Regulatory",
  "Supplier",
  "Reference",
  "Image",
  "Other",
] as const;

export type TechnicalFileCategory = (typeof TECHNICAL_FILE_CATEGORIES)[number];

export const TECHNICAL_FILE_STATUSES = [
  "Draft",
  "In Review",
  "Approved",
  "Released",
  "Superseded",
  "Archived",
] as const;

export type TechnicalFileStatus = (typeof TECHNICAL_FILE_STATUSES)[number];

export const TECHNICAL_FILE_RELATIONSHIP_TYPES = [
  "technical_file",
  "master",
  "sop",
  "program",
  "milestone",
  "product",
  "project",
  "risk",
  "task",
] as const;

export type TechnicalFileRelationshipType = (typeof TECHNICAL_FILE_RELATIONSHIP_TYPES)[number];

export type PreviewCapability = "native" | "convertible" | "download_only";

export type TechnicalFileKind =
  | "document"
  | "spreadsheet"
  | "presentation"
  | "image"
  | "pdf"
  | "text"
  | "archive"
  | "model_3d"
  | "cad"
  | "other";

const EXTENSION_MAP: Record<string, { kind: TechnicalFileKind; preview: PreviewCapability }> = {
  pdf: { kind: "pdf", preview: "native" },
  doc: { kind: "document", preview: "convertible" },
  docx: { kind: "document", preview: "convertible" },
  ppt: { kind: "presentation", preview: "download_only" },
  pptx: { kind: "presentation", preview: "download_only" },
  xls: { kind: "spreadsheet", preview: "download_only" },
  xlsx: { kind: "spreadsheet", preview: "download_only" },
  csv: { kind: "text", preview: "native" },
  txt: { kind: "text", preview: "native" },
  png: { kind: "image", preview: "native" },
  jpg: { kind: "image", preview: "native" },
  jpeg: { kind: "image", preview: "native" },
  svg: { kind: "image", preview: "native" },
  tiff: { kind: "image", preview: "native" },
  tif: { kind: "image", preview: "native" },
  stl: { kind: "model_3d", preview: "native" },
  obj: { kind: "model_3d", preview: "native" },
  "3mf": { kind: "model_3d", preview: "download_only" },
  ply: { kind: "model_3d", preview: "download_only" },
  glb: { kind: "model_3d", preview: "native" },
  gltf: { kind: "model_3d", preview: "native" },
  step: { kind: "cad", preview: "download_only" },
  stp: { kind: "cad", preview: "download_only" },
  iges: { kind: "cad", preview: "download_only" },
  igs: { kind: "cad", preview: "download_only" },
  dxf: { kind: "cad", preview: "download_only" },
  dwg: { kind: "cad", preview: "download_only" },
  sat: { kind: "cad", preview: "download_only" },
  zip: { kind: "archive", preview: "download_only" },
};

export function getFileExtension(filename: string): string {
  const parts = filename.split(".");
  if (parts.length < 2) return "";
  return parts.pop()?.toLowerCase() ?? "";
}

export function classifyTechnicalFile(filename: string, mimeType?: string | null) {
  const ext = getFileExtension(filename);
  const mapped = EXTENSION_MAP[ext];
  if (mapped) return { extension: ext, ...mapped };

  if (mimeType?.startsWith("image/")) {
    return { extension: ext, kind: "image" as const, preview: "native" as const };
  }
  if (mimeType === "application/pdf") {
    return { extension: ext, kind: "pdf" as const, preview: "native" as const };
  }
  if (mimeType?.startsWith("text/")) {
    return { extension: ext, kind: "text" as const, preview: "native" as const };
  }

  return { extension: ext, kind: "other" as const, preview: "download_only" as const };
}

export function inferCategoryFromKind(kind: TechnicalFileKind): TechnicalFileCategory {
  switch (kind) {
    case "cad":
      return "CAD";
    case "model_3d":
      return "3D Model";
    case "image":
      return "Image";
    case "document":
    case "pdf":
      return "Design Document";
    case "spreadsheet":
    case "text":
      return "Specification";
    case "presentation":
      return "Reference";
    default:
      return "Other";
  }
}

export function isModelViewerFormat(extension: string): boolean {
  return ["glb", "gltf"].includes(extension.toLowerCase());
}

export function isThreeJsModelFormat(extension: string): boolean {
  return ["stl", "obj"].includes(extension.toLowerCase());
}

export function supportsBrowserPreview(extension: string, mimeType?: string | null): boolean {
  const { preview } = classifyTechnicalFile(`file.${extension || "bin"}`, mimeType);
  return preview === "native" || preview === "convertible";
}

export function formatTechnicalFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export const TECHNICAL_FILES_MAX_BYTES = 524_288_000; // 500 MB for engineering assets

export const TECHNICAL_FILES_STORAGE_PREFIX = "engineering/technical-files";
