import { ABHI_SLUG } from "@/lib/abhi-surface";
import {
  getMemberPortalByPath,
  type AbhiMemberPortalRoute,
} from "@/lib/abhi/member-portal-routes";
import { requirePortalAccess } from "@/lib/portals/require-portal-access";
import type { PortalSession } from "@/lib/portals/types";

export type AbhiMemberPortalSession = {
  userId: string;
  username: string;
  displayName: string;
  userType: string;
  redirectPath: string;
  clientId: string | null;
  isStaffPreview: boolean;
};

export async function requireAbhiMemberPortalAccess(
  companyPath: string,
): Promise<{ route: AbhiMemberPortalRoute; session: AbhiMemberPortalSession }> {
  const { route, session } = await requirePortalAccess(ABHI_SLUG, companyPath);
  return {
    route: route as AbhiMemberPortalRoute,
    session: session as AbhiMemberPortalSession,
  };
}

/** @deprecated Prefer central registry matcher */
export { getMemberPortalByPath };
