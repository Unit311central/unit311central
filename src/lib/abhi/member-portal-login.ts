import { customerWorkspaceOrigin, parseSafePostLoginNext } from "@/lib/app-domains";
import { ABHI_SLUG } from "@/lib/abhi-surface";
import {
  matchAbhiMemberPortalPathname,
  type AbhiMemberPortalRoute,
} from "@/lib/abhi/member-portal-routes";

/**
 * Resolve the public member-portal URL an external ABHI user should land on after login.
 * Never returns the ABHI admin /dashboard shell.
 */
export function resolveAbhiMemberPortalPostLoginUrl(options: {
  redirectPath: string | null | undefined;
  nextRaw?: string | null;
  returnToRaw?: string | null;
  requestHost?: string | null;
}): string | null {
  const sessionMatch = matchAbhiMemberPortalPathname(options.redirectPath ?? "");
  if (!sessionMatch) return null;

  const candidates = [options.nextRaw, options.returnToRaw]
    .map((value) => {
      const trimmed = value?.trim() ?? "";
      if (!trimmed) return null;
      if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return trimmed;
      try {
        const url = new URL(trimmed);
        return `${url.pathname}${url.search}` || null;
      } catch {
        return parseSafePostLoginNext(trimmed);
      }
    })
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
