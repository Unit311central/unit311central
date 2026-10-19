/** Session gate for Executive Home intro motion (no React / no "use client"). */

export const HOME_LIVING_INTRO_SESSION_KEY = "unit311-executive-home-living-intro-v1";

/** Fired on `window` when intro is marked played so all motion hooks re-read sessionStorage. */
export const HOME_LIVING_INTRO_CHANGED_EVENT = "unit311-home-living-intro-changed";

export function readHomeLivingIntroPlayed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(HOME_LIVING_INTRO_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

export function markHomeLivingIntroPlayed(): void {
  if (typeof window === "undefined") return;
  try {
    if (sessionStorage.getItem(HOME_LIVING_INTRO_SESSION_KEY) === "1") return;
    sessionStorage.setItem(HOME_LIVING_INTRO_SESSION_KEY, "1");
    window.dispatchEvent(new Event(HOME_LIVING_INTRO_CHANGED_EVENT));
  } catch {
    /* blocked */
  }
}
