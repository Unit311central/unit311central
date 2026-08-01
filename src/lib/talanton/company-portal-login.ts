import { customerWorkspaceOrigin, parseSafePostLoginNext } from "@/lib/app-domains";
import {
  matchTalantonCompanyPortalPathname,
  type TalantonCompanyPortalRoute,
} from "@/lib/talanton/company-portal-routes";
import { TALANTON_IMPACT_SLUG } from "@/lib/talanton-surface";

/**
 * Resolve the public company-portal URL an external user should land on after login.
 * Never returns the Talanton admin /dashboard shell.
 */
export function resolveTalantonCompanyPortalPostLoginUrl(options: {
  redirectPath: string | null | undefined;
  nextRaw?: string | null;
  returnToRaw?: string | null;
  requestHost?: string | null;
}): string | null {
  const sessionMatch = matchTalantonCompanyPortalPathname(options.redirectPath ?? "");
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
    const match = matchTalantonCompanyPortalPathname(candidate);
    if (match && match.route.path === sessionMatch.route.path) {
      rest = match.rest || "";
      break;
    }
  }

  const path = `/${sessionMatch.route.path}${rest}`;
  const origin = customerWorkspaceOrigin(TALANTON_IMPACT_SLUG);
  return origin ? `${origin}${path}` : path;
}

export function isTalantonCompanyPortalRoute(
  value: string | null | undefined,
): TalantonCompanyPortalRoute | null {
  return matchTalantonCompanyPortalPathname(value ?? "")?.route ?? null;
}
