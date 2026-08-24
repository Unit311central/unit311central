import type {
  TechnicalFileCategory,
  TechnicalFileKind,
  TechnicalFileRelationshipType,
  TechnicalFileStatus,
} from "@/lib/engineering-technical-files/file-types";

export type EngineeringMaster = {
  id: string;
  workspaceId: string;
  title: string;
  description: string;
  programRef: string | null;
  productRef: string | null;
  status: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
};

export type TechnicalFileVersion = {
  id: string;
  technicalFileId: string;
  revision: string;
  versionLabel: string;
  fileName: string;
  storagePath: string;
  mimeType: string | null;
  extension: string | null;
  sizeBytes: number;
  isCurrent: boolean;
  uploadedByName: string;
  changeNotes: string;
  createdAt: string;
};

export type TechnicalFileRelationship = {
  id: string;
  sourceFileId: string;
  targetType: TechnicalFileRelationshipType;
  targetId: string;
  label: string | null;
  createdAt: string;
};

export type TechnicalFileListItem = {
  id: string;
  title: string;
  description: string;
  category: TechnicalFileCategory;
  fileKind: TechnicalFileKind;
  status: TechnicalFileStatus;
  masterId: string | null;
  masterTitle: string | null;
  programRef: string | null;
  productRef: string | null;
  partNumber: string | null;
  drawingNumber: string | null;
  tags: string[];
  currentRevision: string | null;
  currentFileName: string | null;
  currentExtension: string | null;
  currentSizeBytes: number;
  uploadedByName: string;
  createdAt: string;
  updatedAt: string;
};

export type TechnicalFileDetail = TechnicalFileListItem & {
  notes: string;
  accessLevel: string;
  archivedAt: string | null;
  versions: TechnicalFileVersion[];
  relationships: TechnicalFileRelationship[];
  events: TechnicalFileEvent[];
};

export type TechnicalFileEvent = {
  id: string;
  eventType: string;
  actorName: string;
  comment: string | null;
  createdAt: string;
  payload: Record<string, unknown>;
};

export type TechnicalFileUploadPrepareResult = {
  signedUrl: string;
  token: string;
  storagePath: string;
  versionId: string;
};
