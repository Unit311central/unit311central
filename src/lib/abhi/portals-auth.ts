/** ABHI /portals auth — edge-safe (no nav/content imports). */

export const ABHI_DEMO_PLATFORM_USERNAME = "demo@abhi.org.uk";
export const ABHI_PORTALS_ADMIN_USERNAME = "admin@abhi.org.uk";
export const ABHI_PORTALS_SHARED_PASSWORD = "London1999$";

export function normalizeUsername(username: string | null | undefined): string {
  return String(username ?? "")
    .trim()
    .toLowerCase();
}

export function isAbhiDemoPlatformUsername(username: string | null | undefined): boolean {
  return normalizeUsername(username) === ABHI_DEMO_PLATFORM_USERNAME;
}

export function isAbhiPortalsAdminUsername(username: string | null | undefined): boolean {
  return normalizeUsername(username) === ABHI_PORTALS_ADMIN_USERNAME;
}

/** Platform users allowed onto /portals (and ABHI org login for this demo). */
export function isAbhiPortalsAllowedUsername(username: string | null | undefined): boolean {
  return isAbhiDemoPlatformUsername(username) || isAbhiPortalsAdminUsername(username);
}
