/**
 * Green Desert Board Portal credential auth (server / login route).
 */

import { normalizePlatformUsername } from "@/lib/platform-auth";
import { GREENDESERT_BOARD_USERNAME } from "@/lib/greendesert/greendesert-board-portal-data";

/** Override in production via GREENDESERT_BOARD_PORTAL_PASSWORD. */
export const GREENDESERT_BOARD_PORTAL_PASSWORD =
  process.env.GREENDESERT_BOARD_PORTAL_PASSWORD ?? "Algae2026$";

export function isGreenDesertBoardPortalUsername(username: string | null | undefined): boolean {
  return normalizePlatformUsername(String(username ?? "")) === GREENDESERT_BOARD_USERNAME;
}

export function verifyGreenDesertBoardPortalPassword(password: string | null | undefined): boolean {
  const candidate = String(password ?? "");
  const expected = GREENDESERT_BOARD_PORTAL_PASSWORD;
  if (!candidate || !expected) return false;
  return candidate === expected;
}
