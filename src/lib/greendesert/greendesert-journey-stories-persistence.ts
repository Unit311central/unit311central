import type { JourneyStoriesState } from "@/lib/talanton/journey-stories-store";
import { isBrowserGreenDesertSurface } from "@/lib/greendesert-surface";

export const GREENDESERT_JOURNEY_STORIES_STORAGE_KEY = "greendesert-journey-stories-v1";

export function isGreenDesertJourneyStoriesSurface(): boolean {
  return typeof window !== "undefined" && isBrowserGreenDesertSurface();
}

export function emptyGreenDesertJourneyStoriesState(): JourneyStoriesState {
  return { stories: [] };
}

export function loadGreenDesertJourneyStoriesState(): JourneyStoriesState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(GREENDESERT_JOURNEY_STORIES_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as JourneyStoriesState;
  } catch {
    return null;
  }
}

export function persistGreenDesertJourneyStoriesState(state: JourneyStoriesState): void {
  if (!isGreenDesertJourneyStoriesSurface()) return;
  try {
    window.localStorage.setItem(GREENDESERT_JOURNEY_STORIES_STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore quota errors */
  }
}
