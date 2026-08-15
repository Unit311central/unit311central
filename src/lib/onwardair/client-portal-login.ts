/**
 * OnwardAir client portal — post-login URL resolution (thin adapter over central portals).
 */

import {
  matchOnwardAirClientPortalPathname,
  type OnwardAirClientPortalRoute,
} from "@/lib/onwardair/client-portal-routes";
import { ONWARDAIR_SLUG } from "@/lib/onwardair-surface";
import { resolvePortalPostLoginUrl, resolvePortalSessionRedirect } from "@/lib/portals/post-login";

export function resolveOnwardAirClientPortalSessionRedirect(options: {
  redirectPath: string | null | undefined;
  nextRaw?: string | null;
  username?: string | null;
}): string | null {
  return resolvePortalSessionRedirect({
    workspaceSlug: ONWARDAIR_SLUG,
    ...options,
  });
}

export function resolveOnwardAirClientPortalPostLoginUrl(options: {
  redirectPath: string | null | undefined;
  nextRaw?: string | null;
  returnToRaw?: string | null;
  requestHost?: string | null;
  username?: string | null;
}): string | null {
  return resolvePortalPostLoginUrl({
    workspaceSlug: ONWARDAIR_SLUG,
    ...options,
  });
}

export function isOnwardAirClientPortalRoute(
  value: string | null | undefined,
): OnwardAirClientPortalRoute | null {
  return matchOnwardAirClientPortalPathname(value ?? "")?.route ?? null;
}
