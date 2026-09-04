import {
  getGreenDesertClientPortalByClientId,
  getGreenDesertClientPortalByPath,
  greenDesertClientPortalAbsoluteUrl,
  GREENDESERT_CLIENT_PORTAL_ROUTES,
  matchGreenDesertClientPortalPathname,
} from "@/lib/greendesert/client-portal-routes";
import { GREENDESERT_SLUG } from "@/lib/greendesert-surface";
import { GREENDESERT_CLIENT_PORTAL_ORIGIN } from "@/lib/greendesert/client-portal-routes";
import type { PortalRouteDefinition, PortalWorkspacePack } from "@/lib/portals/types";

function absoluteUrl(route: PortalRouteDefinition): string {
  return greenDesertClientPortalAbsoluteUrl(
    route as Parameters<typeof greenDesertClientPortalAbsoluteUrl>[0],
  );
}

export const greendesertPortalPack: PortalWorkspacePack = {
  slug: GREENDESERT_SLUG,
  implBase: "/greendesert-portal",
  publicPathPrefix: "",
  origin: GREENDESERT_CLIENT_PORTAL_ORIGIN,
  routes: GREENDESERT_CLIENT_PORTAL_ROUTES,
  accessPolicy: {
    externalOnly: true,
    allowStaffPreview: false,
    staffPreviewBlockedKinds: ["client"],
  },
  matcher: {
    matchPathname: matchGreenDesertClientPortalPathname,
    getRouteByPath: getGreenDesertClientPortalByPath,
    getRouteByClientId: getGreenDesertClientPortalByClientId,
    absoluteUrl,
  },
};
