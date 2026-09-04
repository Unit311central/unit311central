/**
 * Edge-safe portal helpers for middleware only.
 * Avoids bootstrapping workspace packs (which pull server-only modules into the Edge bundle).
 */
import { matchAbhiMemberPortalPathname } from "@/lib/abhi/member-portal-routes";
import { isAbhiPortalsAllowedUsername } from "@/lib/abhi/portals-auth";
import { ABHI_SLUG } from "@/lib/abhi-surface";
import { matchOnwardAirClientPortalPathname } from "@/lib/onwardair/client-portal-routes";
import { isOnwardAirPortalsAllowedUsername } from "@/lib/onwardair/portals-demo";
import { isOnwardAirSlug, ONWARDAIR_SLUG } from "@/lib/onwardair-surface";
import { matchOmnitransitPortalPathname } from "@/lib/saec/client-portal-routes";
import { isOmnitransitPortalsAllowedUsername } from "@/lib/saec/portals-auth";
import { isSaecSlug, SAEC_SLUG } from "@/lib/saec-surface";
import type { PortalRouteDefinition } from "@/lib/portals/types";
import { matchTalantonCompanyPortalPathname } from "@/lib/talanton/company-portal-routes";
import { isTalantonPortalsAllowedUsername } from "@/lib/talanton/portals-auth";
import { isTalantonImpactSlug, TALANTON_IMPACT_SLUG } from "@/lib/talanton-surface";
import { matchWolfPailexPortalPathname } from "@/lib/wolf/wolf-pailex-portal-routes";
import { isWolfPortalsAllowedUsername } from "@/lib/wolf/wolf-portals-auth";
import { isWolfCentralSlug, WOLF_CENTRAL_SLUG } from "@/lib/wolf/wolf-surface";

type EdgePortalPack = {
  slug: string;
  aliases: string[];
  implBase: string;
  matchPathname: (pathname: string) => { route: PortalRouteDefinition; rest: string } | null;
  isAllowedUsername: (username: string | null | undefined) => boolean;
  briefingLoginPath: string;
  usesDedicatedPortalsLogin: boolean;
};

const EDGE_PORTAL_PACKS: readonly EdgePortalPack[] = [
  {
    slug: ONWARDAIR_SLUG,
    aliases: ["onward"],
    implBase: "/client-portal",
    matchPathname: matchOnwardAirClientPortalPathname,
    isAllowedUsername: isOnwardAirPortalsAllowedUsername,
    briefingLoginPath: "/login?next=/portals",
    usesDedicatedPortalsLogin: false,
  },
  {
    slug: SAEC_SLUG,
    aliases: ["omnitransit"],
    implBase: "/omnitransit-portal",
    matchPathname: matchOmnitransitPortalPathname,
    isAllowedUsername: isOmnitransitPortalsAllowedUsername,
    briefingLoginPath: "/login",
    usesDedicatedPortalsLogin: false,
  },
  {
    slug: TALANTON_IMPACT_SLUG,
    aliases: ["talanton"],
    implBase: "/portfolio-portal",
    matchPathname: matchTalantonCompanyPortalPathname,
    isAllowedUsername: isTalantonPortalsAllowedUsername,
    briefingLoginPath: "/portals/login",
    usesDedicatedPortalsLogin: true,
  },
  {
    slug: ABHI_SLUG,
    aliases: [],
    implBase: "/member-portal",
    matchPathname: matchAbhiMemberPortalPathname,
    isAllowedUsername: isAbhiPortalsAllowedUsername,
    briefingLoginPath: "/login?next=/portals",
    usesDedicatedPortalsLogin: false,
  },
  {
    slug: WOLF_CENTRAL_SLUG,
    aliases: ["wolf"],
    implBase: "/wolf-client-portal",
    matchPathname: matchWolfPailexPortalPathname,
    isAllowedUsername: isWolfPortalsAllowedUsername,
    briefingLoginPath: "/pailex/login",
    usesDedicatedPortalsLogin: true,
  },
];

const packsBySlug = new Map<string, EdgePortalPack>();
for (const pack of EDGE_PORTAL_PACKS) {
  packsBySlug.set(pack.slug, pack);
  for (const alias of pack.aliases) {
    packsBySlug.set(alias, pack);
  }
}

function normalizeSlug(slug: string | null | undefined): string {
  return String(slug ?? "")
    .trim()
    .toLowerCase();
}

function getPack(workspaceSlug: string | null | undefined): EdgePortalPack | null {
  const normalized = normalizeSlug(workspaceSlug);
  if (!normalized) return null;
  return packsBySlug.get(normalized) ?? null;
}

export function isPortalWorkspaceSlug(workspaceSlug: string | null | undefined): boolean {
  if (getPack(workspaceSlug)) return true;
  const normalized = normalizeSlug(workspaceSlug);
  return (
    isOnwardAirSlug(normalized) ||
    isTalantonImpactSlug(normalized) ||
    isSaecSlug(normalized) ||
    normalized === ABHI_SLUG ||
    isWolfCentralSlug(normalized)
  );
}

export function portalImplBaseForSlug(workspaceSlug: string): string | null {
  return getPack(workspaceSlug)?.implBase ?? null;
}

export function matchPortalPathnameForSlug(
  workspaceSlug: string,
  pathname: string,
): { route: PortalRouteDefinition; rest: string } | null {
  return getPack(workspaceSlug)?.matchPathname(pathname) ?? null;
}

export function canonicalizePortalRedirect(
  redirectPath: string | null | undefined,
): string | null {
  if (!redirectPath) return null;
  for (const pack of EDGE_PORTAL_PACKS) {
    const match = pack.matchPathname(redirectPath);
    if (match) return `/${match.route.path}`;
  }
  return null;
}

export function isPortalsBriefingAllowedUsername(
  username: string | null | undefined,
  workspaceSlug: string,
): boolean {
  const pack = getPack(workspaceSlug);
  if (!pack) return false;
  return pack.isAllowedUsername(username);
}

export function portalsBriefingLoginUrl(origin: string, workspaceSlug: string): string {
  const pack = getPack(workspaceSlug);
  const base = origin.replace(/\/$/, "");
  if (!pack) {
    return `${base}/login?next=${encodeURIComponent("/portals")}`;
  }
  if (pack.usesDedicatedPortalsLogin) {
    return `${base}/portals/login`;
  }
  return `${base}${pack.briefingLoginPath.startsWith("/") ? pack.briefingLoginPath : `/${pack.briefingLoginPath}`}`;
}
