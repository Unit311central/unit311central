import type {
  EngineeringMaster,
  TechnicalFileDetail,
  TechnicalFileListItem,
} from "@/lib/engineering-technical-files/types";

const FETCH_INIT: RequestInit = {
  cache: "no-store",
  credentials: "include",
};

async function parseJson<T>(response: Response): Promise<T> {
  const body = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(body.error ?? `Request failed (${response.status})`);
  return body;
}

async function fetchJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, { ...FETCH_INIT, ...init });
  return parseJson<T>(response);
}

export async function listTechnicalFilesApi(filters?: {
  search?: string;
  category?: string;
  status?: string;
  masterId?: string;
}) {
  const params = new URLSearchParams();
  if (filters?.search) params.set("search", filters.search);
  if (filters?.category && filters.category !== "All") params.set("category", filters.category);
  if (filters?.status && filters.status !== "All") params.set("status", filters.status);
  if (filters?.masterId) params.set("masterId", filters.masterId);
  const qs = params.toString();
  const body = await fetchJson<{ files: TechnicalFileListItem[] }>(
    `/api/engineering/technical-files${qs ? `?${qs}` : ""}`,
  );
  return body.files;
}

export async function getTechnicalFileApi(id: string) {
  const body = await fetchJson<{ file: TechnicalFileDetail }>(`/api/engineering/technical-files/${id}`);
  return body.file;
}

export async function listEngineeringMastersApi() {
  const body = await fetchJson<{ masters: EngineeringMaster[] }>("/api/engineering/masters");
  return body.masters;
}

export async function createEngineeringMasterApi(input: { title: string; description?: string }) {
  const body = await fetchJson<{ master: EngineeringMaster }>("/api/engineering/masters", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return body.master;
}

export async function prepareTechnicalFileUploadApi(input: {
  fileName: string;
  sizeBytes: number;
  technicalFileId?: string;
}) {
  return fetchJson<{
    signedUrl: string;
    token: string;
    storagePath: string;
    versionId: string;
  }>("/api/engineering/technical-files/upload/prepare", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export async function createTechnicalFileApi(input: Record<string, unknown>) {
  const body = await fetchJson<{ file: TechnicalFileDetail }>("/api/engineering/technical-files", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return body.file;
}

export async function addTechnicalFileVersionApi(fileId: string, input: Record<string, unknown>) {
  const body = await fetchJson<{ file: TechnicalFileDetail }>(
    `/api/engineering/technical-files/${fileId}/versions`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
  return body.file;
}

export async function updateTechnicalFileApi(fileId: string, input: Record<string, unknown>) {
  const body = await fetchJson<{ file: TechnicalFileDetail }>(
    `/api/engineering/technical-files/${fileId}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
  return body.file;
}

export async function archiveTechnicalFileApi(fileId: string) {
  const body = await fetchJson<{ file: TechnicalFileDetail | null }>(
    `/api/engineering/technical-files/${fileId}`,
    { method: "DELETE" },
  );
  return body.file;
}

export async function restoreTechnicalFileVersionApi(fileId: string, versionId: string) {
  const body = await fetchJson<{ file: TechnicalFileDetail }>(
    `/api/engineering/technical-files/${fileId}/versions/${versionId}/restore`,
    { method: "POST" },
  );
  return body.file;
}

export async function getTechnicalFileDownloadUrlApi(fileId: string, versionId?: string) {
  const qs = versionId ? `?versionId=${encodeURIComponent(versionId)}` : "";
  return fetchJson<{ url: string; fileName: string; mimeType: string | null }>(
    `/api/engineering/technical-files/${fileId}/download${qs}`,
  );
}

export async function uploadTechnicalFileBlob(signedUrl: string, file: File) {
  const response = await fetch(signedUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body: file,
  });
  if (!response.ok) throw new Error("Upload to storage failed.");
}
