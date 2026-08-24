import {
  DEMO_WORKSPACE_SLUG,
  isDemoDomainHost,
  parseClientPlatformSubdomainSafe,
} from "@/lib/app-domains";
import {
  isBrowserDemoPreviewActive,
  isOnDemoHostBrowser,
  readBrowserDemoPreviewSlug,
} from "@/lib/demo/workspace-preview";
import { isDemoWorkspaceSlug } from "@/lib/demo/read-only";
import {
  PLATFORM_CACHE_KEYS,
  peekCachedJson,
  scopedPlatformCacheKey,
} from "@/lib/platform-fetch-cache";

/** Host slug used to scope platform client caches (whoami, etc.). */
export function resolveBrowserPlatformCacheHostSlug(): string | null {
  if (typeof window === "undefined") return null;
  if (isDemoDomainHost(window.location.hostname)) return DEMO_WORKSPACE_SLUG;
  return parseClientPlatformSubdomainSafe(window.location.hostname);
}

function readCachedWhoamiPayload(): { workspaceSlug?: string | null; roles?: string[] | null; role?: string | null } | null {
  const hostSlug = resolveBrowserPlatformCacheHostSlug();
  return peekCachedJson<{ workspaceSlug?: string | null; roles?: string[] | null; role?: string | null }>(
    scopedPlatformCacheKey(PLATFORM_CACHE_KEYS.whoami, hostSlug),
  );
}

/** Cached whoami workspace slug for the active customer host (client-only). */
export function readBrowserWorkspaceSlugFromWhoami(): string | null {
  if (typeof window === "undefined") return null;
  const slug = String(readCachedWhoamiPayload()?.workspaceSlug ?? "")
    .trim()
    .toLowerCase();
  return slug || null;
}

function isBrowserDemoPreviewAuthorized(): boolean {
  const payload = readCachedWhoamiPayload();
  const roles = payload?.roles?.length
    ? payload.roles
    : payload?.role
      ? [payload.role]
      : [];
  return roles.some((role) => String(role).trim().toLowerCase() === "admin");
}

/**
 * True when the browser session is on the Northstar Demo workspace tenancy.
 * Authenticated Demo tenancy wins over stale admin preview cookies unless an
 * authorized admin is actively previewing another tenant on the Demo host.
 */
export function isBrowserNorthstarDemoTenancy(): boolean {
  if (typeof window === "undefined") return false;

  const whoamiSlug = readBrowserWorkspaceSlugFromWhoami();
  if (isDemoWorkspaceSlug(whoamiSlug)) return true;

  if (!isDemoDomainHost(window.location.hostname)) return false;

  if (isBrowserDemoPreviewActive() && isBrowserDemoPreviewAuthorized()) {
    return readBrowserDemoPreviewSlug() === DEMO_WORKSPACE_SLUG;
  }

  return true;
}

/**
 * Effective workspace slug in the browser — authenticated Demo tenancy wins on the
 * Demo host so stale admin preview cookies cannot route Talanton/OnwardAir fixtures.
 */
export function readEffectiveBrowserWorkspaceSlug(): string {
  if (typeof window === "undefined") return "";

  const whoamiSlug = readBrowserWorkspaceSlugFromWhoami();
  if (isOnDemoHostBrowser()) {
    if (isDemoWorkspaceSlug(whoamiSlug)) return DEMO_WORKSPACE_SLUG;
    if (isBrowserDemoPreviewActive() && isBrowserDemoPreviewAuthorized()) {
      return readBrowserDemoPreviewSlug();
    }
    return DEMO_WORKSPACE_SLUG;
  }

  if (whoamiSlug) return whoamiSlug;

  return parseClientPlatformSubdomainSafe(window.location.hostname) ?? "";
}
