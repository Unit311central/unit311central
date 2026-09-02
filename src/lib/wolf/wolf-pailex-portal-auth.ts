import { WOLF_CENTRAL_SLUG } from "@/lib/wolf/wolf-surface";
import { requirePortalAccess } from "@/lib/portals/require-portal-access";
import type { PortalRouteDefinition } from "@/lib/portals/types";

export type WolfPailexPortalSession = {
  userId: string;
  username: string;
  displayName: string;
  userType: string;
  redirectPath: string;
  clientId: string | null;
};

export async function requireWolfPailexPortalAccess(
  companyPath: string,
): Promise<{ route: PortalRouteDefinition; session: WolfPailexPortalSession }> {
  const { route, session } = await requirePortalAccess(WOLF_CENTRAL_SLUG, companyPath);
  return {
    route,
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
