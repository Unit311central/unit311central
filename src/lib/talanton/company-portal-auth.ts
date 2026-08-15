import { TALANTON_IMPACT_SLUG } from "@/lib/talanton-surface";
import {
  getCompanyPortalByPath,
  type TalantonCompanyPortalRoute,
} from "@/lib/talanton/company-portal-routes";
import { requirePortalAccess } from "@/lib/portals/require-portal-access";
import type { PortalSession } from "@/lib/portals/types";

export type CompanyPortalSession = {
  userId: string;
  username: string;
  displayName: string;
  userType: string;
  redirectPath: string;
  clientId: string | null;
  isStaffPreview: boolean;
};

export async function requireCompanyPortalAccess(
  companyPath: string,
): Promise<{ route: TalantonCompanyPortalRoute; session: CompanyPortalSession }> {
  const { route, session } = await requirePortalAccess(TALANTON_IMPACT_SLUG, companyPath);
  return {
    route: route as TalantonCompanyPortalRoute,
    session: session as CompanyPortalSession,
  };
}

/** @deprecated Prefer central registry matcher */
export { getCompanyPortalByPath };
