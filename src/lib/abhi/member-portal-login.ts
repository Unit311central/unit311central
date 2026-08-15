/**
 * ABHI member portal — post-login URL resolution (thin adapter over central portals).
 */

import {
  matchAbhiMemberPortalPathname,
  type AbhiMemberPortalRoute,
} from "@/lib/abhi/member-portal-routes";
import { ABHI_SLUG } from "@/lib/abhi-surface";
import { resolvePortalPostLoginUrl, resolvePortalSessionRedirect } from "@/lib/portals/post-login";

export function resolveAbhiMemberPortalSessionRedirect(options: {
  redirectPath: string | null | undefined;
  nextRaw?: string | null;
  username?: string | null;
}): string | null {
  return resolvePortalSessionRedirect({
    workspaceSlug: ABHI_SLUG,
    ...options,
  });
}

export function resolveAbhiMemberPortalPostLoginUrl(options: {
  redirectPath: string | null | undefined;
  nextRaw?: string | null;
  returnToRaw?: string | null;
  requestHost?: string | null;
  username?: string | null;
}): string | null {
  return resolvePortalPostLoginUrl({
    workspaceSlug: ABHI_SLUG,
    ...options,
  });
}

export function isAbhiMemberPortalRoute(
  value: string | null | undefined,
): AbhiMemberPortalRoute | null {
  return matchAbhiMemberPortalPathname(value ?? "")?.route ?? null;
}
