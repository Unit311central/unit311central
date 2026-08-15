import { ONWARDAIR_SLUG } from "@/lib/onwardair-surface";
import {
  getOnwardAirClientPortalByPath,
  type OnwardAirClientPortalRoute,
} from "@/lib/onwardair/client-portal-routes";
import { requirePortalAccess } from "@/lib/portals/require-portal-access";
import type { PortalSession } from "@/lib/portals/types";

export type OnwardAirClientPortalSession = {
  userId: string;
  username: string;
  displayName: string;
  userType: string;
  redirectPath: string;
  clientId: string | null;
};

export async function requireOnwardAirClientPortalAccess(
  companyPath: string,
): Promise<{ route: OnwardAirClientPortalRoute; session: OnwardAirClientPortalSession }> {
  const { route, session } = await requirePortalAccess(ONWARDAIR_SLUG, companyPath);
  return {
    route: route as OnwardAirClientPortalRoute,
    session: {
      userId: session.userId,
      username: session.username,
      displayName: session.displayName,
      userType: session.userType,
      redirectPath: session.redirectPath,
      clientId: session.clientId,
    },
  };
}

/** @deprecated Prefer central registry matcher */
export { getOnwardAirClientPortalByPath };
