/** Talanton /portals auth — edge-safe (no nav/content imports). */

export const TALANTON_DEMO_PLATFORM_USERNAME = "demo@talantonimpact.com";
export const TALANTON_PORTALS_ADMIN_USERNAME = "admin@talantonimpact.com";
export const TALANTON_PORTALS_SHARED_PASSWORD = "Africa1999$";

export function normalizeUsername(username: string | null | undefined): string {
  return String(username ?? "")
    .trim()
    .toLowerCase();
}

export function isTalantonDemoPlatformUsername(username: string | null | undefined): boolean {
  return normalizeUsername(username) === TALANTON_DEMO_PLATFORM_USERNAME;
}

export function isTalantonPortalsAdminUsername(username: string | null | undefined): boolean {
  return normalizeUsername(username) === TALANTON_PORTALS_ADMIN_USERNAME;
}

/** Platform users allowed onto /portals (Talanton demo/admin). */
export function isTalantonPortalsAllowedUsername(username: string | null | undefined): boolean {
  return isTalantonDemoPlatformUsername(username) || isTalantonPortalsAdminUsername(username);
}
