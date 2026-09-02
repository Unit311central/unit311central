/**
 * WOLF Central external client portal — PAILEX programme at wolf.unit311central.com/pailex
 */

import type { PortalRouteDefinition } from "@/lib/portals/types";
import { WOLF_CENTRAL_ORIGIN } from "@/lib/wolf/wolf-surface";

export const WOLF_PAILEX_PORTAL_PATH = "pailex";

export const WOLF_PAILEX_CLIENT_ID = "wolf-cli-pailex";

export const WOLF_PAILEX_PORTAL_USERNAME = "pailex@wolf.unit311central.com";

export const WOLF_PAILEX_PORTAL_LOGO_SRC = "/images/portals/pailex-logo.svg";

export const WOLF_PAILEX_PORTAL_ROUTES: readonly PortalRouteDefinition[] = [
  {
    path: WOLF_PAILEX_PORTAL_PATH,
    displayName: "PAILEX",
    clientId: WOLF_PAILEX_CLIENT_ID,
    username: WOLF_PAILEX_PORTAL_USERNAME,
    redirectPath: `/${WOLF_PAILEX_PORTAL_PATH}`,
    companyLogoSrc: WOLF_PAILEX_PORTAL_LOGO_SRC,
    portalKind: "client",
  },
] as const;

const BY_PATH = new Map(WOLF_PAILEX_PORTAL_ROUTES.map((route) => [route.path, route]));
const BY_CLIENT_ID = new Map(WOLF_PAILEX_PORTAL_ROUTES.map((route) => [route.clientId, route]));

export function getWolfPailexPortalByPath(path: string | null | undefined): PortalRouteDefinition | null {
  const key = String(path ?? "")
    .trim()
    .toLowerCase()
    .replace(/^\/+|\/+$/g, "")
    .split("/")[0];
  if (!key) return null;
  return BY_PATH.get(key) ?? null;
}

export function getWolfPailexPortalByClientId(clientId: string | null | undefined): PortalRouteDefinition | null {
  if (!clientId) return null;
  return BY_CLIENT_ID.get(clientId) ?? null;
}

export function matchWolfPailexPortalPathname(pathname: string): {
  route: PortalRouteDefinition;
  rest: string;
} | null {
  const cleaned = pathname.split("?")[0] || "/";
  const segments = cleaned.split("/").filter(Boolean);
  if (!segments.length) return null;
  const route = getWolfPailexPortalByPath(segments[0]);
  if (!route) return null;
  const rest = segments.length > 1 ? `/${segments.slice(1).join("/")}` : "";
  return { route, rest };
}

export function wolfPailexPortalAbsoluteUrl(route: PortalRouteDefinition): string {
  return `${WOLF_CENTRAL_ORIGIN}/${route.path}`;
}
