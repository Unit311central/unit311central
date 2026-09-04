/**
 * Green Desert external client portals — greendesert.unit311central.com/{path}
 */

import { GREENDESERT_BOARD_PORTAL_ORIGIN } from "@/lib/greendesert/greendesert-board-portal-data";

export type GreenDesertClientPortalRoute = {
  path: string;
  displayName: string;
  clientId: string;
  username: string;
  redirectPath: string;
  portalKind?: "client";
};

export const GREENDESERT_CLIENT_PORTAL_ORIGIN = GREENDESERT_BOARD_PORTAL_ORIGIN;

export const GREENDESERT_CLIENT_PORTAL_ROUTES = [
  {
    path: "jeddahtechnologies",
    displayName: "Jeddah Technologies",
    clientId: "greendesert-cli-jeddah-technologies",
    username: "jeddahtechnologies@greendesert.unit311central.com",
    redirectPath: "/jeddahtechnologies",
    portalKind: "client",
  },
] as const;

const BY_PATH = new Map<string, GreenDesertClientPortalRoute>(
  GREENDESERT_CLIENT_PORTAL_ROUTES.map((r) => [r.path, r]),
);
const BY_CLIENT_ID = new Map<string, GreenDesertClientPortalRoute>(
  GREENDESERT_CLIENT_PORTAL_ROUTES.map((r) => [r.clientId, r]),
);

export function getGreenDesertClientPortalByPath(
  path: string | null | undefined,
): GreenDesertClientPortalRoute | null {
  const key = String(path ?? "")
    .trim()
    .toLowerCase()
    .replace(/^\/+|\/+$/g, "")
    .split("/")[0];
  if (!key) return null;
  return BY_PATH.get(key) ?? null;
}

export function getGreenDesertClientPortalByClientId(
  clientId: string | null | undefined,
): GreenDesertClientPortalRoute | null {
  if (!clientId) return null;
  return BY_CLIENT_ID.get(clientId) ?? null;
}

export function greenDesertClientPortalAbsoluteUrl(route: GreenDesertClientPortalRoute): string {
  return `${GREENDESERT_CLIENT_PORTAL_ORIGIN}${route.redirectPath}`;
}

export function matchGreenDesertClientPortalPathname(pathname: string): {
  route: GreenDesertClientPortalRoute;
  rest: string;
} | null {
  const cleaned = pathname.split("?")[0] || "/";
  const parts = cleaned.split("/").filter(Boolean);
  if (parts.length === 0) return null;
  const route = getGreenDesertClientPortalByPath(parts[0]);
  if (!route) return null;
  const rest = parts.length > 1 ? `/${parts.slice(1).join("/")}` : "";
  return { route, rest };
}
