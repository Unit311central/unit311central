import {
  companyPortalAbsoluteUrl,
  getCompanyPortalByCompanyId,
  getCompanyPortalByPath,
  matchTalantonCompanyPortalPathname,
  TALANTON_COMPANY_PORTAL_ROUTES,
} from "@/lib/talanton/company-portal-routes";
import {
  defaultTalantonPortalsContent,
  sanitizePortalsContent,
} from "@/lib/talanton/portals-demo";
import {
  isTalantonPortalsAdminUsername,
  isTalantonPortalsAllowedUsername,
  TALANTON_PORTALS_SHARED_PASSWORD,
} from "@/lib/talanton/portals-auth";
import { TALANTON_IMPACT_SLUG } from "@/lib/talanton-surface";
import type { PortalRouteDefinition, PortalWorkspacePack } from "@/lib/portals/types";

function talantonPortalAbsoluteUrl(route: PortalRouteDefinition): string {
  return companyPortalAbsoluteUrl(route as Parameters<typeof companyPortalAbsoluteUrl>[0]);
}

export const talantonPortalPack: PortalWorkspacePack = {
  slug: TALANTON_IMPACT_SLUG,
  slugAliases: ["talanton"],
  implBase: "/portfolio-portal",
  publicPathPrefix: "",
  origin: "https://talantonimpact.unit311central.com",
  routes: TALANTON_COMPANY_PORTAL_ROUTES,
  accessPolicy: {
    externalOnly: true,
    allowStaffPreview: true,
    staffPreviewBlockedKinds: ["board"],
  },
  matcher: {
    matchPathname: matchTalantonCompanyPortalPathname,
    getRouteByPath: getCompanyPortalByPath,
    getRouteByClientId: getCompanyPortalByCompanyId,
    absoluteUrl: talantonPortalAbsoluteUrl,
  },
  briefing: {
    isAllowedUsername: isTalantonPortalsAllowedUsername,
    isAdminUsername: isTalantonPortalsAdminUsername,
    sharedPassword: TALANTON_PORTALS_SHARED_PASSWORD,
    loginPath: "/portals/login",
    usesDedicatedPortalsLogin: true,
    contentTable: "talanton_portals_page_content",
    defaultContent: defaultTalantonPortalsContent,
    sanitizeContent: sanitizePortalsContent,
  },
};
