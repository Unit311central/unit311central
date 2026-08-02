import { customerWorkspaceOrigin, parseSafePostLoginNext } from "@/lib/app-domains";
import { ABHI_SLUG } from "@/lib/abhi-surface";
import {
  ABHI_MEMBER_PORTAL_ROUTES,
  matchAbhiMemberPortalPathname,
  type AbhiMemberPortalRoute,
} from "@/lib/abhi/member-portal-routes";

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

function portalRouteForUsername(username: string | null | undefined): AbhiMemberPortalRoute | null {
  const normalized = String(username ?? "")
    .trim()
    .toLowerCase();
  if (!normalized) return null;
  return ABHI_MEMBER_PORTAL_ROUTES.find((route) => route.username === normalized) ?? null;
}

/**
 * Canonical session redirect for an ABHI member-portal external login.
 * Prefer the portal the user just signed into (`next`), then stored redirect, then username map.
 */
export function resolveAbhiMemberPortalSessionRedirect(options: {
  redirectPath: string | null | undefined;
  nextRaw?: string | null;
  username?: string | null;
}): string | null {
  const byUsername = portalRouteForUsername(options.username);
  const nextMatch = matchAbhiMemberPortalPathname(extractPathCandidate(options.nextRaw) ?? "");
  const storedMatch = matchAbhiMemberPortalPathname(options.redirectPath ?? "");

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

/**
 * Resolve the public member-portal URL an external ABHI user should land on after login.
 * Never returns the ABHI admin /dashboard shell.
 */
export function resolveAbhiMemberPortalPostLoginUrl(options: {
  redirectPath: string | null | undefined;
  nextRaw?: string | null;
  returnToRaw?: string | null;
  requestHost?: string | null;
  username?: string | null;
}): string | null {
  const sessionPath = resolveAbhiMemberPortalSessionRedirect({
    redirectPath: options.redirectPath,
    nextRaw: options.nextRaw,
    username: options.username,
  });
  if (!sessionPath) return null;

  const sessionMatch = matchAbhiMemberPortalPathname(sessionPath);
  if (!sessionMatch) return null;

  const candidates = [options.nextRaw, options.returnToRaw]
    .map((value) => extractPathCandidate(value))
    .filter(Boolean) as string[];

  let rest = "";
  for (const candidate of candidates) {
    const match = matchAbhiMemberPortalPathname(candidate);
    if (match && match.route.path === sessionMatch.route.path) {
      rest = match.rest || "";
      break;
    }
  }

  const path = `/${sessionMatch.route.path}${rest}`;
  const origin = customerWorkspaceOrigin(ABHI_SLUG);
  return origin ? `${origin}${path}` : path;
}

export function isAbhiMemberPortalRoute(
  value: string | null | undefined,
): AbhiMemberPortalRoute | null {
  return matchAbhiMemberPortalPathname(value ?? "")?.route ?? null;
}
