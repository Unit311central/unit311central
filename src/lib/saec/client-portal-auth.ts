import { SAEC_SLUG } from "@/lib/saec-surface";
import {
  getOmnitransitPortalByPath,
  type OmnitransitPortalRoute,
} from "@/lib/saec/client-portal-routes";
import { requirePortalAccess } from "@/lib/portals/require-portal-access";
import type { PortalSession } from "@/lib/portals/types";

export type OmnitransitPortalSession = {
  userId: string;
  username: string;
  displayName: string;
  userType: string;
  redirectPath: string;
  clientId: string | null;
};

export async function requireOmnitransitPortalAccess(
  companyPath: string,
): Promise<{ route: OmnitransitPortalRoute; session: OmnitransitPortalSession }> {
  const { route, session } = await requirePortalAccess(SAEC_SLUG, companyPath);
  return {
    route: route as OmnitransitPortalRoute,
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

export { getOmnitransitPortalByPath };
