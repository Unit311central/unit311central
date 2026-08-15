import { customerWorkspaceOrigin, parseSafePostLoginNext } from "@/lib/app-domains";
import {
  canonicalizePortalRedirect,
  getPortalPackBySlug,
  listPortalWorkspacePacks,
} from "@/lib/portals/registry";
import type { PortalRouteDefinition } from "@/lib/portals/types";

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

function portalRouteForUsername(
  packRoutes: readonly PortalRouteDefinition[],
  username: string | null | undefined,
): PortalRouteDefinition | null {
  const normalized = String(username ?? "")
    .trim()
    .toLowerCase();
  if (!normalized) return null;
  return packRoutes.find((route) => route.username === normalized) ?? null;
}

/**
 * Canonical session redirect_path for an external portal login.
 */
export function resolvePortalSessionRedirect(options: {
  workspaceSlug: string;
  redirectPath: string | null | undefined;
  nextRaw?: string | null;
  username?: string | null;
}): string | null {
  const pack = getPortalPackBySlug(options.workspaceSlug);
  if (!pack) return null;

  const byUsername = portalRouteForUsername(pack.routes, options.username);
  const nextMatch = pack.matcher.matchPathname(extractPathCandidate(options.nextRaw) ?? "");
  const storedMatch = pack.matcher.matchPathname(options.redirectPath ?? "");

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
 * Resolve the public portal URL an external user should land on after login.
 * Never returns an admin /dashboard shell.
 */
export function resolvePortalPostLoginUrl(options: {
  workspaceSlug: string;
  redirectPath: string | null | undefined;
  nextRaw?: string | null;
  returnToRaw?: string | null;
  requestHost?: string | null;
  username?: string | null;
}): string | null {
  const pack = getPortalPackBySlug(options.workspaceSlug);
  if (!pack) return null;

  const sessionPath = resolvePortalSessionRedirect({
    workspaceSlug: options.workspaceSlug,
    redirectPath: options.redirectPath,
    nextRaw: options.nextRaw,
    username: options.username,
  });
  if (!sessionPath) return null;

  const sessionMatch = pack.matcher.matchPathname(sessionPath);
  if (!sessionMatch) return null;

  const candidates = [options.nextRaw, options.returnToRaw]
    .map((value) => extractPathCandidate(value))
    .filter(Boolean) as string[];

  let rest = "";
  for (const candidate of candidates) {
    const match = pack.matcher.matchPathname(candidate);
    if (match && match.route.path === sessionMatch.route.path) {
      rest = match.rest || "";
      break;
    }
  }

  const path = `/${sessionMatch.route.path}${rest}`;
  const origin = customerWorkspaceOrigin(pack.slug) ?? pack.origin;
  return origin ? `${origin.replace(/\/$/, "")}${path}` : path;
}

/**
 * Resolve external portal post-login across all registered workspace packs.
 * Used by the central auth login route.
 */
export function resolveAnyPortalPostLoginUrl(options: {
  redirectPath: string | null | undefined;
  nextRaw?: string | null;
  returnToRaw?: string | null;
  requestHost?: string | null;
  username?: string | null;
}): string | null {
  for (const pack of listPortalWorkspacePacks()) {
    const url = resolvePortalPostLoginUrl({
      workspaceSlug: pack.slug,
      redirectPath: options.redirectPath,
      nextRaw: options.nextRaw,
      returnToRaw: options.returnToRaw,
      requestHost: options.requestHost,
      username: options.username,
    });
    if (url) return url;
  }
  return null;
}

/**
 * Resolve session redirect_path for external login across packs (first match).
 */
export function resolveAnyPortalSessionRedirect(options: {
  redirectPath: string | null | undefined;
  nextRaw?: string | null;
  username?: string | null;
}): string | null {
  const canonical = canonicalizePortalRedirect(options.redirectPath);
  if (canonical) {
    for (const pack of listPortalWorkspacePacks()) {
      const match = pack.matcher.matchPathname(canonical);
      if (match) {
        return resolvePortalSessionRedirect({
          workspaceSlug: pack.slug,
          redirectPath: options.redirectPath,
          nextRaw: options.nextRaw,
          username: options.username,
        });
      }
    }
  }

  for (const pack of listPortalWorkspacePacks()) {
    const resolved = resolvePortalSessionRedirect({
      workspaceSlug: pack.slug,
      redirectPath: options.redirectPath,
      nextRaw: options.nextRaw,
      username: options.username,
    });
    if (resolved) return resolved;
  }
  return null;
}
