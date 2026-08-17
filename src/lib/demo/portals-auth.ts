/** Northstar Demo /portals auth — edge-safe (no nav/content imports). */

import {
  DEMO_ADMIN_USERNAME,
  DEMO_PROSPECT_USERNAME,
  isDemoAdminUsername,
  isDemoProspectUsername,
} from "@/lib/demo/read-only";

export const DEMO_PORTALS_PLATFORM_USERNAME = DEMO_PROSPECT_USERNAME;
export const DEMO_PORTALS_ADMIN_USERNAME = DEMO_ADMIN_USERNAME;
export const DEMO_PORTALS_PLATFORM_PASSWORD = "Letmein2026$";

export function normalizeUsername(username: string | null | undefined): string {
  return String(username ?? "")
    .trim()
    .toLowerCase();
}

export function isDemoPortalsPlatformUsername(username: string | null | undefined): boolean {
  return isDemoProspectUsername(username);
}

export function isDemoPortalsAdminUsername(username: string | null | undefined): boolean {
  return isDemoAdminUsername(username);
}

/** Platform users allowed onto demo.unit311central.com/portals. */
export function isDemoPortalsAllowedUsername(username: string | null | undefined): boolean {
  return isDemoPortalsPlatformUsername(username) || isDemoPortalsAdminUsername(username);
}
