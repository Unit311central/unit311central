import {
  ONWARDAIR_CLIENT_PORTAL_ORIGIN,
  ONWARDAIR_CLIENT_PORTAL_ROUTES,
  getOnwardAirClientPortalByClientId,
  getOnwardAirClientPortalByPath,
  matchOnwardAirClientPortalPathname,
} from "@/lib/onwardair/client-portal-routes";
import {
  defaultOnwardAirPortalsContent,
  isOnwardAirPortalsAllowedUsername,
  isOnwardAirPortalsAdminUsername,
  ONWARDAIR_PORTALS_SHARED_PASSWORD,
  sanitizePortalsContent,
} from "@/lib/onwardair/portals-demo";
import { ONWARDAIR_SLUG } from "@/lib/onwardair-surface";
import type { PortalRouteDefinition, PortalWorkspacePack } from "@/lib/portals/types";

function onwardAirPortalAbsoluteUrl(route: PortalRouteDefinition): string {
  return `${ONWARDAIR_CLIENT_PORTAL_ORIGIN}${route.redirectPath}`;
}

export const onwardAirPortalPack: PortalWorkspacePack = {
  slug: ONWARDAIR_SLUG,
  slugAliases: ["onward"],
  implBase: "/client-portal",
  publicPathPrefix: "",
  origin: ONWARDAIR_CLIENT_PORTAL_ORIGIN,
  routes: ONWARDAIR_CLIENT_PORTAL_ROUTES,
  accessPolicy: {
    externalOnly: true,
    allowStaffPreview: false,
    staffPreviewBlockedKinds: ["board", "client", "overview"],
    extraGates: ["overview"],
  },
  matcher: {
    matchPathname: matchOnwardAirClientPortalPathname,
    getRouteByPath: getOnwardAirClientPortalByPath,
    getRouteByClientId: getOnwardAirClientPortalByClientId,
    absoluteUrl: onwardAirPortalAbsoluteUrl,
  },
  briefing: {
    isAllowedUsername: isOnwardAirPortalsAllowedUsername,
    isAdminUsername: isOnwardAirPortalsAdminUsername,
    sharedPassword: ONWARDAIR_PORTALS_SHARED_PASSWORD,
    loginPath: "/login?next=/portals",
    usesDedicatedPortalsLogin: false,
    contentTable: "onwardair_portals_page_content",
    defaultContent: defaultOnwardAirPortalsContent,
    sanitizeContent: sanitizePortalsContent,
  },
};
