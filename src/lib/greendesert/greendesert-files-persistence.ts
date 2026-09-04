import { isBrowserGreenDesertSurface, isGreenDesertSlug } from "@/lib/greendesert-surface";
import { readBrowserCustomerWorkspaceSlug } from "@/lib/customer-workspace-surface";

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
export const GREENDESERT_FILES_ROOT_ID = "gd-root";

function seedGreenDesertFilesState(): GreenDesertFilesState {
  const now = new Date().toISOString();
  return {
    entries: [
      {
        id: GREENDESERT_FILES_ROOT_ID,
        name: "Green Desert",
        kind: "folder",
        parentId: null,
        updatedAt: now,
      },
    ],
  };
}

export function isGreenDesertFilesSurface(): boolean {
  if (typeof window === "undefined") return false;
  return (
    isBrowserGreenDesertSurface() ||
    isGreenDesertSlug(readBrowserCustomerWorkspaceSlug())
  );
}

export function normalizeGreenDesertFilesState(
  state: GreenDesertFilesState | null | undefined,
): GreenDesertFilesState {
  const entries = Array.isArray(state?.entries) ? [...state!.entries] : [];
  if (!entries.some((entry) => entry.id === GREENDESERT_FILES_ROOT_ID)) {
    entries.unshift(seedGreenDesertFilesState().entries[0]!);
  }
  return { entries };
}

export function loadGreenDesertFilesState(): GreenDesertFilesState {
  if (typeof window === "undefined") return seedGreenDesertFilesState();
  try {
    const raw = window.localStorage.getItem(GREENDESERT_FILES_STORAGE_KEY);
    if (!raw) return seedGreenDesertFilesState();
    const parsed = JSON.parse(raw) as GreenDesertFilesState;
    const normalized = normalizeGreenDesertFilesState(parsed);
    if (!normalized.entries.length) return seedGreenDesertFilesState();
    return normalized;
  } catch {
    return seedGreenDesertFilesState();
  }
}

export function saveGreenDesertFilesState(state: GreenDesertFilesState): void {
  if (typeof window === "undefined") return;
  if (!isGreenDesertFilesSurface()) return;
  try {
    window.localStorage.setItem(
      GREENDESERT_FILES_STORAGE_KEY,
      JSON.stringify(normalizeGreenDesertFilesState(state)),
    );
  } catch {
    /* ignore */
  }
}

export function createGreenDesertFolderEntry(
  state: GreenDesertFilesState,
  name: string,
  parentId: string = GREENDESERT_FILES_ROOT_ID,
): GreenDesertFilesState {
  const trimmed = name.trim();
  if (!trimmed) return state;

  const nextEntry: GreenDesertFileRecord = {
    id: `gd-folder-${Math.random().toString(36).slice(2, 9)}`,
    name: trimmed,
    kind: "folder",
    parentId,
    updatedAt: new Date().toISOString(),
  };

  return normalizeGreenDesertFilesState({
    entries: [...state.entries, nextEntry],
  });
}
