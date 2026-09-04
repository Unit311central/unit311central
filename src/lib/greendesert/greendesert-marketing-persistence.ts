import type { MarketingStoriesState } from "@/lib/talanton/marketing-stories-store";
import { isBrowserGreenDesertSurface } from "@/lib/greendesert-surface";

export const GREENDESERT_MARKETING_STORIES_STORAGE_KEY = "greendesert-marketing-stories-v1";

export function isGreenDesertMarketingSurface(): boolean {
  return typeof window !== "undefined" && isBrowserGreenDesertSurface();
}

export function emptyGreenDesertMarketingState(): MarketingStoriesState {
  return {
    stories: [],
    media: [],
    newsletters: [],
    contacts: [],
    campaigns: [],
  };
}

export function loadGreenDesertMarketingState(): MarketingStoriesState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(GREENDESERT_MARKETING_STORIES_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as MarketingStoriesState;
  } catch {
    return null;
  }
}

export function persistGreenDesertMarketingState(state: MarketingStoriesState): void {
  if (!isGreenDesertMarketingSurface()) return;
  try {
    window.localStorage.setItem(
      GREENDESERT_MARKETING_STORIES_STORAGE_KEY,
      JSON.stringify(state),
    );
  } catch {
    /* ignore quota errors */
  }
}
