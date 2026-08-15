/**
 * Talanton company portal — post-login URL resolution (thin adapter over central portals).
 */

import {
  matchTalantonCompanyPortalPathname,
  type TalantonCompanyPortalRoute,
} from "@/lib/talanton/company-portal-routes";
import { TALANTON_IMPACT_SLUG } from "@/lib/talanton-surface";
import { resolvePortalPostLoginUrl } from "@/lib/portals/post-login";

export function resolveTalantonCompanyPortalPostLoginUrl(options: {
  redirectPath: string | null | undefined;
  nextRaw?: string | null;
  returnToRaw?: string | null;
  requestHost?: string | null;
  username?: string | null;
}): string | null {
  return resolvePortalPostLoginUrl({
    workspaceSlug: TALANTON_IMPACT_SLUG,
    ...options,
  });
}

export function isTalantonCompanyPortalRoute(
  value: string | null | undefined,
): TalantonCompanyPortalRoute | null {
  return matchTalantonCompanyPortalPathname(value ?? "")?.route ?? null;
}
