import { isBrowserGreenDesertSurface } from "@/lib/greendesert-surface";

export type GreenDesertFileRecord = {
  id: string;
  name: string;
  kind: "folder" | "file";
  parentId: string | null;
  updatedAt: string;
  sizeBytes?: number;
};

export type GreenDesertFilesState = {
  entries: GreenDesertFileRecord[];
};

export const GREENDESERT_FILES_STORAGE_KEY = "greendesert-files-v1";

function seedGreenDesertFilesState(): GreenDesertFilesState {
  const now = new Date().toISOString();
  return {
    entries: [
      {
        id: "gd-root",
        name: "Green Desert",
        kind: "folder",
        parentId: null,
        updatedAt: now,
      },
    ],
  };
}

export function loadGreenDesertFilesState(): GreenDesertFilesState {
  if (typeof window === "undefined") return seedGreenDesertFilesState();
  try {
    const raw = window.localStorage.getItem(GREENDESERT_FILES_STORAGE_KEY);
    if (!raw) return seedGreenDesertFilesState();
    const parsed = JSON.parse(raw) as GreenDesertFilesState;
    if (!parsed.entries?.length) return seedGreenDesertFilesState();
    return parsed;
  } catch {
    return seedGreenDesertFilesState();
  }
}

export function saveGreenDesertFilesState(state: GreenDesertFilesState): void {
  if (!isBrowserGreenDesertSurface()) return;
  try {
    window.localStorage.setItem(GREENDESERT_FILES_STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}
