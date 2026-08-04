/**
 * OnwardAir client portal — post-login URL resolution.
 */

import { customerWorkspaceOrigin, parseSafePostLoginNext } from "@/lib/app-domains";
import { ONWARDAIR_SLUG } from "@/lib/onwardair-surface";
import {
  ONWARDAIR_CLIENT_PORTAL_ROUTES,
  matchOnwardAirClientPortalPathname,
  type OnwardAirClientPortalRoute,
} from "@/lib/onwardair/client-portal-routes";

function extractPathCandidate(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return null;
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return trimmed;
  try {
    const url = new URL(trimmed);
    return `${url.pathname}${url.search}` || null;
  } catch {
    return parseSafePostLoginNext(trimmed);
  }
}

function portalRouteForUsername(username: string | null | undefined): OnwardAirClientPortalRoute | null {
  const normalized = String(username ?? "")
    .trim()
    .toLowerCase();
  if (!normalized) return null;
  return ONWARDAIR_CLIENT_PORTAL_ROUTES.find((route) => route.username === normalized) ?? null;
}

export function resolveOnwardAirClientPortalSessionRedirect(options: {
  redirectPath: string | null | undefined;
  nextRaw?: string | null;
  username?: string | null;
}): string | null {
  const byUsername = portalRouteForUsername(options.username);
  const nextMatch = matchOnwardAirClientPortalPathname(extractPathCandidate(options.nextRaw) ?? "");
  const storedMatch = matchOnwardAirClientPortalPathname(options.redirectPath ?? "");

  if (nextMatch && (!byUsername || nextMatch.route.path === byUsername.path)) {
    return `/${nextMatch.route.path}`;
  }
  if (storedMatch && (!byUsername || storedMatch.route.path === byUsername.path)) {
    return `/${storedMatch.route.path}`;
  }
  if (byUsername) {
    return `/${byUsername.path}`;
  }
  return null;
}

export function resolveOnwardAirClientPortalPostLoginUrl(options: {
  redirectPath: string | null | undefined;
  nextRaw?: string | null;
  returnToRaw?: string | null;
  requestHost?: string | null;
  username?: string | null;
}): string | null {
  const sessionPath = resolveOnwardAirClientPortalSessionRedirect({
    redirectPath: options.redirectPath,
    nextRaw: options.nextRaw,
    username: options.username,
  });
  if (!sessionPath) return null;

  const sessionMatch = matchOnwardAirClientPortalPathname(sessionPath);
  if (!sessionMatch) return null;

  const candidates = [options.nextRaw, options.returnToRaw]
    .map((value) => extractPathCandidate(value))
    .filter(Boolean) as string[];

  let rest = "";
  for (const candidate of candidates) {
    const match = matchOnwardAirClientPortalPathname(candidate);
    if (match && match.route.path === sessionMatch.route.path) {
      rest = match.rest || "";
      break;
    }
  }

  const path = `/${sessionMatch.route.path}${rest}`;
  const origin = customerWorkspaceOrigin(ONWARDAIR_SLUG);
  return origin ? `${origin}${path}` : path;
}
