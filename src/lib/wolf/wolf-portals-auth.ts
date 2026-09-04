/** WOLF Central portal auth — edge-safe (no server-only imports). */

import { WOLF_PAILEX_PORTAL_USERNAME } from "@/lib/wolf/wolf-pailex-portal-routes";

export function normalizeWolfPortalUsername(username: string | null | undefined): string {
  return String(username ?? "")
    .trim()
    .toLowerCase();
}

export function isWolfPailexPortalUsername(username: string | null | undefined): boolean {
  return normalizeWolfPortalUsername(username) === WOLF_PAILEX_PORTAL_USERNAME;
}

/** Platform users allowed onto WOLF portal briefing surfaces (PAILEX programme user). */
export function isWolfPortalsAllowedUsername(username: string | null | undefined): boolean {
  return isWolfPailexPortalUsername(username);
}
