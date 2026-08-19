/**
 * Tutorial progress persistence abstraction.
 *
 * v1: localStorage per user/workspace/tutorial (not production-long-term).
 * v2 (TODO): POST /api/internal/guided-tutorials/progress with authenticated user.
 */

export type TutorialProgressRecord = {
  tutorialId: string;
  workspaceSlug: string;
  completedAt: string | null;
  lastStepId: string | null;
  lastStepIndex: number;
  completed: boolean;
};

export type TutorialProgressStore = {
  load(tutorialId: string, workspaceSlug: string, userId?: string | null): TutorialProgressRecord | null;
  save(record: TutorialProgressRecord, userId?: string | null): void;
  markCompleted(tutorialId: string, workspaceSlug: string, userId?: string | null): void;
  isCompleted(tutorialId: string, workspaceSlug: string, userId?: string | null): boolean;
};

const STORAGE_PREFIX = "unit311-guided-tutorial-progress";

function storageKey(tutorialId: string, workspaceSlug: string, userId?: string | null): string {
  return `${STORAGE_PREFIX}:${userId ?? "anon"}:${workspaceSlug}:${tutorialId}`;
}

function readJson<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // quota / private mode
  }
}

export const localTutorialProgressStore: TutorialProgressStore = {
  load(tutorialId, workspaceSlug, userId) {
    return readJson<TutorialProgressRecord>(storageKey(tutorialId, workspaceSlug, userId));
  },
  save(record, userId) {
    writeJson(storageKey(record.tutorialId, record.workspaceSlug, userId), record);
  },
  markCompleted(tutorialId, workspaceSlug, userId) {
    const existing =
      readJson<TutorialProgressRecord>(storageKey(tutorialId, workspaceSlug, userId)) ?? {
        tutorialId,
        workspaceSlug,
        completedAt: null,
        lastStepId: null,
        lastStepIndex: 0,
        completed: false,
      };
    writeJson(storageKey(tutorialId, workspaceSlug, userId), {
      ...existing,
      completed: true,
      completedAt: new Date().toISOString(),
    });
  },
  isCompleted(tutorialId, workspaceSlug, userId) {
    const record = readJson<TutorialProgressRecord>(storageKey(tutorialId, workspaceSlug, userId));
    return Boolean(record?.completed);
  },
};

/**
 * Server-backed store — not wired in v1.
 * Implement against authenticated workspace user when API route is added.
 */
export const serverTutorialProgressStore: TutorialProgressStore = {
  load() {
    return null;
  },
  save() {
    // no-op until API exists
  },
  markCompleted(tutorialId, workspaceSlug, userId) {
    localTutorialProgressStore.markCompleted(tutorialId, workspaceSlug, userId);
  },
  isCompleted(tutorialId, workspaceSlug, userId) {
    return localTutorialProgressStore.isCompleted(tutorialId, workspaceSlug, userId);
  },
};

/** Active store — swap to serverTutorialProgressStore when API ships. */
export const tutorialProgressStore: TutorialProgressStore = localTutorialProgressStore;
