import { normalizePlatformUsername } from "@/lib/platform-auth";
import {
  GREENDESERT_CLIENT_PORTAL_ROUTES,
  type GreenDesertClientPortalRoute,
} from "@/lib/greendesert/client-portal-routes";

/** Override in production via GREENDESERT_JEDDAH_PORTAL_PASSWORD. */
export const GREENDESERT_JEDDAH_PORTAL_PASSWORD =
  process.env.GREENDESERT_JEDDAH_PORTAL_PASSWORD ?? "Reactor20206$";

export const GREENDESERT_JEDDAH_PORTAL_USERNAME =
  "jeddahtechnologies@greendesert.unit311central.com";

export function isGreenDesertClientPortalUsername(
  username: string | null | undefined,
  route?: GreenDesertClientPortalRoute | null,
): boolean {
  const normalized = normalizePlatformUsername(String(username ?? ""));
  if (route?.username) return normalized === normalizePlatformUsername(route.username);
  return GREENDESERT_CLIENT_PORTAL_USERNAMES.has(normalized);
}

export function getGreenDesertClientPortalByUsername(
  username: string | null | undefined,
): GreenDesertClientPortalRoute | null {
  const normalized = normalizePlatformUsername(String(username ?? ""));
  if (!normalized) return null;
  return (
    [...GREENDESERT_CLIENT_PORTAL_ROUTES].find(
      (route) => normalizePlatformUsername(route.username) === normalized,
    ) ?? null
  );
}

const GREENDESERT_CLIENT_PORTAL_USERNAMES = new Set(
  ["jeddahtechnologies@greendesert.unit311central.com"].map((u) =>
    normalizePlatformUsername(u),
  ),
);

export function verifyGreenDesertClientPortalPassword(password: string | null | undefined): boolean {
  const candidate = String(password ?? "");
  const expected = GREENDESERT_JEDDAH_PORTAL_PASSWORD;
  return Boolean(candidate && expected && candidate === expected);
}
