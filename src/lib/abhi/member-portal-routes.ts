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
  /** Member company portal vs ABHI Board governance portal. */
  portalKind?: "member" | "board";
};

export const ABHI_MEMBER_PORTAL_ORIGIN = "https://abhi.unit311central.com";

export const ABHI_MEMBER_PORTAL_ROUTES: readonly AbhiMemberPortalRoute[] = [
  {
    path: "board",
    displayName: "ABHI Board",
    clientId: "abhi-cli-board",
    username: "board@abhi.org.uk",
    redirectPath: "/board",
    portalKind: "board",
  },
  {
    path: "centrak",
    displayName: "Centrak",
    clientId: "abhi-cli-centrak",
    username: "demo@centrak.com",
    redirectPath: "/centrak",
    companyLogoSrc: "/images/portals/centrak.jpg",
  },
  {
    path: "abbotdiagnostics",
    displayName: "Abbott Diagnostics Ltd",
    clientId: "abhi-cli-abbott-diagnostics-ltd",
    username: "demo@abbotdiagnostics.com",
    redirectPath: "/abbotdiagnostics",
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

/** Legacy path aliases → canonical route path. */
const PATH_ALIASES: Record<string, string> = {
  // Older double-t spelling from "Abbott"; public URL is /abbotdiagnostics.
  abbottdiagnostics: "abbotdiagnostics",
};

/** Compact path slug from company name: "GAMA Healthcare Ltd" → gamahealthcare */
export function abhiMemberPortalSlug(companyName: string): string {
  const slug = String(companyName ?? "")
    .toLowerCase()
    .replace(/\b(ltd|limited|llc|inc|plc|gmbh|pty|srl|sa|nv|bv)\b\.?/gi, "")
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 48);
  return slug || "member";
}

export function getMemberPortalByPath(
  path: string | null | undefined,
): AbhiMemberPortalRoute | null {
  const key = String(path ?? "")
    .trim()
    .toLowerCase()
    .replace(/^\/+|\/+$/g, "")
    .split("/")[0];
  if (!key) return null;
  const canonical = PATH_ALIASES[key] ?? key;
  return BY_PATH.get(canonical) ?? null;
}

export function getMemberPortalByClientId(
  clientId: string | null | undefined,
): AbhiMemberPortalRoute | null {
  if (!clientId) return null;
  return BY_CLIENT_ID.get(clientId) ?? null;
}

export function memberPortalAbsoluteUrl(route: AbhiMemberPortalRoute): string {
  return `${ABHI_MEMBER_PORTAL_ORIGIN}${route.redirectPath}`;
}

/** Prefer curated portal path; otherwise derive from company name. */
export function resolveAbhiMemberPortalPath(client: {
  id?: string | null;
  companyName?: string | null;
}): string {
  const registered = getMemberPortalByClientId(client.id);
  if (registered && registered.portalKind !== "board") {
    return registered.path;
  }
  return abhiMemberPortalSlug(client.companyName ?? "");
}

export function resolveAbhiMemberPortalAbsoluteUrl(client: {
  id?: string | null;
  companyName?: string | null;
}): string {
  return `${ABHI_MEMBER_PORTAL_ORIGIN}/${resolveAbhiMemberPortalPath(client)}`;
}

/** demo@{email-domain} — falls back to demo@{portalSlug}.com */
export function resolveAbhiMemberPortalDemoUsername(input: {
  email?: string | null;
  companyName?: string | null;
  id?: string | null;
}): string {
  const registered = getMemberPortalByClientId(input.id);
  if (registered?.username) return registered.username;

  const email = String(input.email ?? "").trim().toLowerCase();
  const at = email.indexOf("@");
  if (at > 0 && at < email.length - 1) {
    return `demo@${email.slice(at + 1)}`;
  }

  const slug = resolveAbhiMemberPortalPath(input);
  return `demo@${slug}.com`;
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
  const route = getMemberPortalByPath(parts[0]);
  if (!route) return null;
  const rest = parts.length > 1 ? `/${parts.slice(1).join("/")}` : "";
  return { route, rest };
}

export function publicMemberPortalHref(path: string, rest = ""): string {
  const suffix = rest && !rest.startsWith("/") ? `/${rest}` : rest;
  return `/${path}${suffix}`;
}
