/** Session gate for Executive Home intro motion (no React / no "use client"). */

export const HOME_LIVING_INTRO_SESSION_KEY = "unit311-executive-home-living-intro-v1";

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
    sessionStorage.setItem(HOME_LIVING_INTRO_SESSION_KEY, "1");
  } catch {
    /* blocked */
  }
}
