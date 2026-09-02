import {
  getWolfPailexPortalByClientId,
  getWolfPailexPortalByPath,
  matchWolfPailexPortalPathname,
  wolfPailexPortalAbsoluteUrl,
  WOLF_PAILEX_PORTAL_ROUTES,
} from "@/lib/wolf/wolf-pailex-portal-routes";
import { WOLF_CENTRAL_HOST_ALIAS, WOLF_CENTRAL_ORIGIN, WOLF_CENTRAL_SLUG } from "@/lib/wolf/wolf-surface";
import type { PortalWorkspacePack } from "@/lib/portals/types";

export const wolfCentralPortalPack: PortalWorkspacePack = {
  slug: WOLF_CENTRAL_SLUG,
  slugAliases: [WOLF_CENTRAL_HOST_ALIAS, "wolf"],
  implBase: "/wolf-client-portal",
  publicPathPrefix: "",
  origin: WOLF_CENTRAL_ORIGIN,
  routes: WOLF_PAILEX_PORTAL_ROUTES,
  accessPolicy: {
    externalOnly: true,
    allowStaffPreview: true,
    staffPreviewBlockedKinds: [],
  },
  matcher: {
    matchPathname: matchWolfPailexPortalPathname,
    getRouteByPath: getWolfPailexPortalByPath,
    getRouteByClientId: getWolfPailexPortalByClientId,
    absoluteUrl: wolfPailexPortalAbsoluteUrl,
  },
};
