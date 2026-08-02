/**
 * Route-based ABHI member company portals.
 * Public URLs live on abhi.unit311central.com/{path} only — no company subdomains.
 * Mirrors src/lib/talanton/company-portal-routes.ts, scoped to ABHI.
 */

export type AbhiMemberPortalRoute = {
  path: string;
  displayName: string;
  /** internal_clients.id (ABHI member company) */
  clientId: string;
  username: string;
  redirectPath: string;
  /** Optional member-company logo under the ABHI mark on the login page. */
  companyLogoSrc?: string;
};

export const ABHI_MEMBER_PORTAL_ROUTES: readonly AbhiMemberPortalRoute[] = [
  {
    path: "centrak",
    displayName: "Centrak",
    clientId: "abhi-cli-centrak",
    username: "demo@centrak.com",
    redirectPath: "/centrak",
    companyLogoSrc: "/images/portals/centrak.jpg",
  },
  {
    path: "gamahealthcare",
    displayName: "GAMA Healthcare Ltd",
    clientId: "abhi-cli-gama-healthcare-ltd",
    username: "demo@gamahealthcare.com",
    redirectPath: "/gamahealthcare",
  },
  {
    path: "zeumed",
    displayName: "Zeumed",
    clientId: "abhi-cli-zeumed",
    username: "demo@zeumed.com",
    redirectPath: "/zeumed",
  },
  {
    path: "ddcdolphin",
    displayName: "DDC Dolphin Ltd",
    clientId: "abhi-cli-ddc-dolphin-ltd",
    username: "demo@ddcdolphin.com",
    redirectPath: "/ddcdolphin",
  },
  {
    path: "wavetec",
    displayName: "Wavetec",
    clientId: "abhi-cli-wavetec",
    username: "demo@wavetec.com",
    redirectPath: "/wavetec",
  },
] as const;

const BY_PATH = new Map(ABHI_MEMBER_PORTAL_ROUTES.map((r) => [r.path, r]));
const BY_CLIENT_ID = new Map(ABHI_MEMBER_PORTAL_ROUTES.map((r) => [r.clientId, r]));

export function getMemberPortalByPath(
  path: string | null | undefined,
): AbhiMemberPortalRoute | null {
  const key = String(path ?? "")
    .trim()
    .toLowerCase()
    .replace(/^\/+|\/+$/g, "")
    .split("/")[0];
  if (!key) return null;
  return BY_PATH.get(key) ?? null;
}

export function getMemberPortalByClientId(
  clientId: string | null | undefined,
): AbhiMemberPortalRoute | null {
  if (!clientId) return null;
  return BY_CLIENT_ID.get(clientId) ?? null;
}

export function memberPortalAbsoluteUrl(route: AbhiMemberPortalRoute): string {
  return `https://abhi.unit311central.com${route.redirectPath}`;
}

export function isAbhiMemberPortalPath(pathname: string | null | undefined): boolean {
  return getMemberPortalByPath(pathname) != null;
}

export function matchAbhiMemberPortalPathname(pathname: string): {
  route: AbhiMemberPortalRoute;
  rest: string;
} | null {
  const cleaned = pathname.split("?")[0] || "/";
  const parts = cleaned.split("/").filter(Boolean);
  if (parts.length === 0) return null;
  const route = BY_PATH.get(parts[0].toLowerCase());
  if (!route) return null;
  const rest = parts.length > 1 ? `/${parts.slice(1).join("/")}` : "";
  return { route, rest };
}

export function publicMemberPortalHref(path: string, rest = ""): string {
  const suffix = rest && !rest.startsWith("/") ? `/${rest}` : rest;
  return `/${path}${suffix}`;
}
