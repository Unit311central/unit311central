/**
 * Route-based OnwardAir client portals.
 * Public URLs: onwardair.unit311central.com/{path}
 */

export type OnwardAirClientPortalRoute = {
  path: string;
  displayName: string;
  /** internal_clients.id */
  clientId: string;
  username: string;
  redirectPath: string;
  companyLogoSrc?: string;
  /** Client programme portal, Board governance, or private overview invite. */
  portalKind?: "client" | "board" | "overview";
};

export const ONWARDAIR_CLIENT_PORTAL_ORIGIN = "https://onwardair.unit311central.com";

export const ONWARDAIR_CLIENT_PORTAL_ROUTES: readonly OnwardAirClientPortalRoute[] = [
  {
    path: "overview",
    displayName: "OnwardAir Overview",
    clientId: "oa-cli-overview",
    username: "overview@onwardair.tech",
    redirectPath: "/overview",
    portalKind: "overview",
  },
  {
    path: "board",
    displayName: "OnwardAir Board",
    clientId: "oa-cli-board",
    username: "board@onwardair.tech",
    redirectPath: "/board",
    portalKind: "board",
  },
  {
    path: "coastalfreightpartners.com",
    displayName: "Coastal Freight Partners",
    clientId: "oa-cli-coastal-freight",
    username: "demo@coastalfreightpartners.com",
    redirectPath: "/coastalfreightpartners.com",
    companyLogoSrc: "/images/portals/coastalfreightpartners.png",
  },
] as const;

const BY_PATH = new Map(ONWARDAIR_CLIENT_PORTAL_ROUTES.map((r) => [r.path, r]));
const BY_CLIENT_ID = new Map(ONWARDAIR_CLIENT_PORTAL_ROUTES.map((r) => [r.clientId, r]));

export function getOnwardAirClientPortalByPath(
  path: string | null | undefined,
): OnwardAirClientPortalRoute | null {
  const key = String(path ?? "")
    .trim()
    .toLowerCase()
    .replace(/^\/+|\/+$/g, "")
    .split("/")[0];
  if (!key) return null;
  return BY_PATH.get(key) ?? null;
}

export function getOnwardAirClientPortalByClientId(
  clientId: string | null | undefined,
): OnwardAirClientPortalRoute | null {
  if (!clientId) return null;
  return BY_CLIENT_ID.get(clientId) ?? null;
}

export function matchOnwardAirClientPortalPathname(pathname: string): {
  route: OnwardAirClientPortalRoute;
  rest: string;
} | null {
  const cleaned = pathname.split("?")[0] || "/";
  const parts = cleaned.split("/").filter(Boolean);
  if (parts.length === 0) return null;
  const route = getOnwardAirClientPortalByPath(parts[0]);
  if (!route) return null;
  const rest = parts.length > 1 ? `/${parts.slice(1).join("/")}` : "";
  return { route, rest };
}

export function resolveOnwardAirClientPortalAbsoluteUrl(client: {
  id?: string | null;
}): string | null {
  const registered = getOnwardAirClientPortalByClientId(client.id);
  if (!registered) return null;
  return `${ONWARDAIR_CLIENT_PORTAL_ORIGIN}${registered.redirectPath}`;
}
