import {
  ABHI_MEMBER_PORTAL_ORIGIN,
  ABHI_MEMBER_PORTAL_ROUTES,
  getMemberPortalByClientId,
  getMemberPortalByPath,
  matchAbhiMemberPortalPathname,
  memberPortalAbsoluteUrl,
} from "@/lib/abhi/member-portal-routes";
import {
  defaultAbhiPortalsContent,
  sanitizePortalsContent,
} from "@/lib/abhi/portals-demo";
import {
  isAbhiPortalsAdminUsername,
  isAbhiPortalsAllowedUsername,
  ABHI_PORTALS_SHARED_PASSWORD,
} from "@/lib/abhi/portals-auth";
import { ABHI_SLUG } from "@/lib/abhi-surface";
import type { PortalRouteDefinition, PortalWorkspacePack } from "@/lib/portals/types";

function abhiPortalAbsoluteUrl(route: PortalRouteDefinition): string {
  return memberPortalAbsoluteUrl(route as Parameters<typeof memberPortalAbsoluteUrl>[0]);
}

export const abhiPortalPack: PortalWorkspacePack = {
  slug: ABHI_SLUG,
  implBase: "/member-portal",
  publicPathPrefix: "",
  origin: ABHI_MEMBER_PORTAL_ORIGIN,
  routes: ABHI_MEMBER_PORTAL_ROUTES,
  accessPolicy: {
    externalOnly: true,
    allowStaffPreview: false,
    staffPreviewBlockedKinds: ["board", "member"],
  },
  matcher: {
    matchPathname: matchAbhiMemberPortalPathname,
    getRouteByPath: getMemberPortalByPath,
    getRouteByClientId: getMemberPortalByClientId,
    absoluteUrl: abhiPortalAbsoluteUrl,
  },
  briefing: {
    isAllowedUsername: isAbhiPortalsAllowedUsername,
    isAdminUsername: isAbhiPortalsAdminUsername,
    sharedPassword: ABHI_PORTALS_SHARED_PASSWORD,
    loginPath: "/login?next=/portals",
    usesDedicatedPortalsLogin: false,
    contentTable: "abhi_portals_page_content",
    defaultContent: defaultAbhiPortalsContent,
    sanitizeContent: sanitizePortalsContent,
  },
};
