import type {
  EngineeringMaster,
  TechnicalFileDetail,
  TechnicalFileListItem,
} from "@/lib/engineering-technical-files/types";

async function parseJson<T>(response: Response): Promise<T> {
  const body = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(body.error ?? `Request failed (${response.status})`);
  return body;
}

export async function listTechnicalFilesApi(filters?: {
  search?: string;
  category?: string;
  status?: string;
  masterId?: string;
}) {
  const params = new URLSearchParams();
  if (filters?.search) params.set("search", filters.search);
  if (filters?.category) params.set("category", filters.category);
  if (filters?.status) params.set("status", filters.status);
  if (filters?.masterId) params.set("masterId", filters.masterId);
  const qs = params.toString();
  const response = await fetch(`/api/engineering/technical-files${qs ? `?${qs}` : ""}`);
  const body = await parseJson<{ files: TechnicalFileListItem[] }>(response);
  return body.files;
}

export async function getTechnicalFileApi(id: string) {
  const response = await fetch(`/api/engineering/technical-files/${id}`);
  const body = await parseJson<{ file: TechnicalFileDetail }>(response);
  return body.file;
}

export async function listEngineeringMastersApi() {
  const response = await fetch("/api/engineering/masters");
  const body = await parseJson<{ masters: EngineeringMaster[] }>(response);
  return body.masters;
}

export async function createEngineeringMasterApi(input: { title: string; description?: string }) {
  const response = await fetch("/api/engineering/masters", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = await parseJson<{ master: EngineeringMaster }>(response);
  return body.master;
}

export async function prepareTechnicalFileUploadApi(input: {
  fileName: string;
  sizeBytes: number;
  technicalFileId?: string;
}) {
  const response = await fetch("/api/engineering/technical-files/upload/prepare", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseJson<{
    signedUrl: string;
    token: string;
    storagePath: string;
    versionId: string;
  }>(response);
}

export async function createTechnicalFileApi(input: Record<string, unknown>) {
  const response = await fetch("/api/engineering/technical-files", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = await parseJson<{ file: TechnicalFileDetail }>(response);
  return body.file;
}

export async function addTechnicalFileVersionApi(fileId: string, input: Record<string, unknown>) {
  const response = await fetch(`/api/engineering/technical-files/${fileId}/versions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = await parseJson<{ file: TechnicalFileDetail }>(response);
  return body.file;
}

export async function updateTechnicalFileApi(fileId: string, input: Record<string, unknown>) {
  const response = await fetch(`/api/engineering/technical-files/${fileId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = await parseJson<{ file: TechnicalFileDetail }>(response);
  return body.file;
}

export async function archiveTechnicalFileApi(fileId: string) {
  const response = await fetch(`/api/engineering/technical-files/${fileId}`, { method: "DELETE" });
  const body = await parseJson<{ file: TechnicalFileDetail | null }>(response);
  return body.file;
}

export async function restoreTechnicalFileVersionApi(fileId: string, versionId: string) {
  const response = await fetch(`/api/engineering/technical-files/${fileId}/versions/${versionId}/restore`, {
    method: "POST",
  });
  const body = await parseJson<{ file: TechnicalFileDetail }>(response);
  return body.file;
}

export async function getTechnicalFileDownloadUrlApi(fileId: string, versionId?: string) {
  const qs = versionId ? `?versionId=${encodeURIComponent(versionId)}` : "";
  const response = await fetch(`/api/engineering/technical-files/${fileId}/download${qs}`);
  return parseJson<{ url: string; fileName: string; mimeType: string | null }>(response);
}

export async function uploadTechnicalFileBlob(signedUrl: string, file: File) {
  const response = await fetch(signedUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body: file,
  });
  if (!response.ok) throw new Error("Upload to storage failed.");
}
