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

function storageKeys(): { packs: string; latest: string } {
  if (typeof window !== "undefined") {
    try {
      const { isBrowserTalantonImpactSurface } =
        require("@/lib/talanton-surface") as typeof import("@/lib/talanton-surface");
      if (isBrowserTalantonImpactSurface()) {
        return {
          packs: "unit311-talanton-board-packs",
          latest: "unit311-talanton-board-packs-latest",
        };
      }
    } catch {
      /* fall through */
    }
  }
  return {
    packs: "unit311-abhi-board-packs",
    latest: "unit311-abhi-board-packs-latest",
  };
}

function readAll(): AbhiBoardPackRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(storageKeys().packs);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AbhiBoardPackRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(records: AbhiBoardPackRecord[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKeys().packs, JSON.stringify(records));
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

/** Remove a generated board pack draft from local storage. */
export function deleteAbhiBoardPack(id: string): boolean {
  if (typeof window === "undefined") return false;
  const current = readAll();
  const next = current.filter((record) => record.id !== id);
  if (next.length === current.length) return false;
  writeAll(next);
  const latestKey = storageKeys().latest;
  const latestId = window.localStorage.getItem(latestKey);
  if (latestId === id) {
    if (next[0]?.id) setLatestAbhiBoardPack(next[0].id);
    else window.localStorage.removeItem(latestKey);
  }
  return true;
}

export function getAbhiBoardPack(id: string): AbhiBoardPackRecord | null {
  return readAll().find((record) => record.id === id) ?? null;
}

export function setLatestAbhiBoardPack(id: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKeys().latest, id);
}

export function getLatestAbhiBoardPack(): AbhiBoardPackRecord | null {
  if (typeof window === "undefined") return null;
  const latestId = window.localStorage.getItem(storageKeys().latest);
  if (!latestId) return loadAbhiBoardPacks()[0] ?? null;
  return getAbhiBoardPack(latestId) ?? loadAbhiBoardPacks()[0] ?? null;
}

export function createAbhiBoardPackRecordId(): string {
  const prefix =
    typeof window !== "undefined"
      ? (() => {
          try {
            const { isBrowserTalantonImpactSurface } =
              require("@/lib/talanton-surface") as typeof import("@/lib/talanton-surface");
            return isBrowserTalantonImpactSurface() ? "ti-bp" : "abhi-bp";
          } catch {
            return "abhi-bp";
          }
        })()
      : "abhi-bp";
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefix}-${Date.now().toString(36)}`;
}
