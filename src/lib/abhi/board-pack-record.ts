export type AbhiBoardPackRecord = {
  id: string;
  packName: string;
  meetingDate: string;
  status: "Draft" | "Final";
  createdAt: string;
  pdfArtifactId?: string;
  pptxArtifactId?: string;
  pdfOpenUrl?: string;
  pptxDownloadUrl?: string;
  folderPath: string;
  pageSummaries: string[];
};

const STORAGE_KEY = "unit311-abhi-board-packs";
const LATEST_KEY = "unit311-abhi-board-packs-latest";

function readAll(): AbhiBoardPackRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AbhiBoardPackRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(records: AbhiBoardPackRecord[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export function loadAbhiBoardPacks(): AbhiBoardPackRecord[] {
  return readAll().sort(
    (left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt),
  );
}

export function saveAbhiBoardPack(record: AbhiBoardPackRecord): AbhiBoardPackRecord {
  const current = readAll();
  const index = current.findIndex((item) => item.id === record.id);
  const next = index >= 0 ? [...current] : [record, ...current];
  if (index >= 0) {
    next[index] = record;
  }
  writeAll(next);
  setLatestAbhiBoardPack(record.id);
  return record;
}

export function getAbhiBoardPack(id: string): AbhiBoardPackRecord | null {
  return readAll().find((record) => record.id === id) ?? null;
}

export function setLatestAbhiBoardPack(id: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LATEST_KEY, id);
}

export function getLatestAbhiBoardPack(): AbhiBoardPackRecord | null {
  if (typeof window === "undefined") return null;
  const latestId = window.localStorage.getItem(LATEST_KEY);
  if (!latestId) return loadAbhiBoardPacks()[0] ?? null;
  return getAbhiBoardPack(latestId) ?? loadAbhiBoardPacks()[0] ?? null;
}

export function createAbhiBoardPackRecordId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `abhi-bp-${crypto.randomUUID().slice(0, 8)}`;
  }
  return `abhi-bp-${Date.now().toString(36)}`;
}
