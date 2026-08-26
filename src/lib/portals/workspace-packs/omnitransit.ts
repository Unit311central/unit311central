import {
  getOmnitransitPortalByClientId,
  getOmnitransitPortalByPath,
  matchOmnitransitPortalPathname,
  omnitransitPortalAbsoluteUrl,
  OMNITRANSIT_PORTAL_ROUTES,
} from "@/lib/saec/client-portal-routes";
import {
  isOmnitransitPortalsAllowedUsername,
} from "@/lib/saec/portals-auth";
import { OMNITRANSIT_CLIENT_PORTAL_ORIGIN } from "@/lib/saec/omnitransit-brand-host";
import { SAEC_SLUG, OMNITRANSIT_HOST_ALIAS_SLUG } from "@/lib/saec-surface";
import type { PortalRouteDefinition, PortalWorkspacePack } from "@/lib/portals/types";

function omnitransitPortalRouteAbsoluteUrl(route: PortalRouteDefinition): string {
  return omnitransitPortalAbsoluteUrl(route as Parameters<typeof omnitransitPortalAbsoluteUrl>[0]);
}

export const omnitransitPortalPack: PortalWorkspacePack = {
  slug: SAEC_SLUG,
  slugAliases: [OMNITRANSIT_HOST_ALIAS_SLUG],
  implBase: "/omnitransit-portal",
  publicPathPrefix: "",
  origin: OMNITRANSIT_CLIENT_PORTAL_ORIGIN,
  routes: OMNITRANSIT_PORTAL_ROUTES,
  accessPolicy: {
    externalOnly: true,
    allowStaffPreview: false,
    staffPreviewBlockedKinds: ["board", "client"],
  },
  matcher: {
    matchPathname: matchOmnitransitPortalPathname,
    getRouteByPath: getOmnitransitPortalByPath,
    getRouteByClientId: getOmnitransitPortalByClientId,
    absoluteUrl: omnitransitPortalRouteAbsoluteUrl,
  },
  briefing: {
    isAllowedUsername: isOmnitransitPortalsAllowedUsername,
    isAdminUsername: isOmnitransitPortalsAllowedUsername,
    sharedPassword: process.env.OMNITRANSIT_PORTALS_SHARED_PASSWORD ?? "",
    loginPath: "/login",
    usesDedicatedPortalsLogin: false,
    contentTable: "saec_portals_page_content",
    defaultContent: () => ({ majorModules: [], customModules: [] }),
    sanitizeContent: (raw) => ({
      majorModules: Array.isArray((raw as { majorModules?: unknown }).majorModules)
        ? (raw as { majorModules: [] }).majorModules
        : [],
      customModules: Array.isArray((raw as { customModules?: unknown }).customModules)
        ? (raw as { customModules: [] }).customModules
        : [],
    }),
  },
};
