/**
 * Route-based OmniTransit external portals (board + client sites).
 * Board: https://omnitransit.unit311.com/board
 * Client: https://omnitransit.unit311central.com/hyprop
 */

import {
  OMNITRANSIT_BOARD_PORTAL_ORIGIN,
  OMNITRANSIT_CLIENT_PORTAL_ORIGIN,
} from "@/lib/saec/omnitransit-brand-host";
import { OMNITRANSIT_PORTALS_DEMO_USERNAME } from "@/lib/saec/portals-auth";

export type OmnitransitPortalRoute = {
  path: string;
  displayName: string;
  /** internal_clients.id */
  clientId: string;
  username: string;
  redirectPath: string;
  companyLogoSrc?: string;
  portalKind?: "client" | "board";
};

export const OMNITRANSIT_BOARD_PORTAL_PATH = "board";
export const OMNITRANSIT_BOARD_CLIENT_ID = "saec-cli-board-portal";

export const OMNITRANSIT_CLIENT_PORTAL_HYPROP_PATH = "hyprop";
export const OMNITRANSIT_HYPROP_CLIENT_ID = "saec-cli-hyprop";

export const OMNITRANSIT_PORTAL_ROUTES: readonly OmnitransitPortalRoute[] = [
  {
    path: OMNITRANSIT_BOARD_PORTAL_PATH,
    displayName: "OmniTransit Board",
    clientId: OMNITRANSIT_BOARD_CLIENT_ID,
    username: OMNITRANSIT_PORTALS_DEMO_USERNAME,
    redirectPath: "/board",
    portalKind: "board",
  },
  {
    path: OMNITRANSIT_CLIENT_PORTAL_HYPROP_PATH,
    displayName: "Hyprop Investments",
    clientId: OMNITRANSIT_HYPROP_CLIENT_ID,
    username: OMNITRANSIT_PORTALS_DEMO_USERNAME,
    redirectPath: "/hyprop",
    portalKind: "client",
  },
] as const;

const BY_PATH = new Map(OMNITRANSIT_PORTAL_ROUTES.map((route) => [route.path, route]));
const BY_CLIENT_ID = new Map(OMNITRANSIT_PORTAL_ROUTES.map((route) => [route.clientId, route]));

export function getOmnitransitPortalByPath(path: string | null | undefined): OmnitransitPortalRoute | null {
  const key = String(path ?? "")
    .trim()
    .toLowerCase()
    .replace(/^\/+|\/+$/g, "")
    .split("/")[0];
  if (!key) return null;
  return BY_PATH.get(key) ?? null;
}

export function getOmnitransitPortalByClientId(
  clientId: string | null | undefined,
): OmnitransitPortalRoute | null {
  if (!clientId) return null;
  return BY_CLIENT_ID.get(clientId) ?? null;
}

export function matchOmnitransitPortalPathname(pathname: string): {
  route: OmnitransitPortalRoute;
  rest: string;
} | null {
  const cleaned = pathname.split("?")[0] || "/";
  const parts = cleaned.split("/").filter(Boolean);
  if (parts.length === 0) return null;
  const route = getOmnitransitPortalByPath(parts[0]);
  if (!route) return null;
  const rest = parts.length > 1 ? `/${parts.slice(1).join("/")}` : "";
  return { route, rest };
}

export function omnitransitPortalAbsoluteUrl(route: OmnitransitPortalRoute): string {
  const origin =
    route.portalKind === "board" ? OMNITRANSIT_BOARD_PORTAL_ORIGIN : OMNITRANSIT_CLIENT_PORTAL_ORIGIN;
  return `${origin}${route.redirectPath}`;
}

export function resolveOmnitransitPortalAbsoluteUrl(client: { id?: string | null }): string | null {
  const registered = getOmnitransitPortalByClientId(client.id);
  if (!registered) return null;
  return omnitransitPortalAbsoluteUrl(registered);
}
