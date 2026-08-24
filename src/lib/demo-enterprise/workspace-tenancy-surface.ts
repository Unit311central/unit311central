import { DEMO_WORKSPACE_SLUG, isDemoDomainHost, parseClientPlatformSubdomainSafe } from "@/lib/app-domains";
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

/** Cached whoami workspace slug for the active customer host (client-only). */
export function readBrowserWorkspaceSlugFromWhoami(): string | null {
  if (typeof window === "undefined") return null;
  const hostSlug = parseClientPlatformSubdomainSafe(window.location.hostname);
  const cached = peekCachedJson<{ workspaceSlug?: string | null }>(
    scopedPlatformCacheKey(PLATFORM_CACHE_KEYS.whoami, hostSlug),
  );
  const slug = String(cached?.workspaceSlug ?? "")
    .trim()
    .toLowerCase();
  return slug || null;
}

/**
 * True when the browser session is on the Northstar Demo workspace tenancy.
 * Uses whoami workspace claim first; on the demo host, ignores stale admin preview
 * cookies unless the active workspace is not Demo.
 */
export function isBrowserNorthstarDemoTenancy(): boolean {
  if (typeof window === "undefined") return false;

  const whoamiSlug = readBrowserWorkspaceSlugFromWhoami();
  if (isDemoWorkspaceSlug(whoamiSlug)) return true;

  if (!isDemoDomainHost(window.location.hostname)) return false;

  if (isBrowserDemoPreviewActive()) {
    return readBrowserDemoPreviewSlug() === DEMO_WORKSPACE_SLUG;
  }

  return true;
}

/**
 * Effective workspace slug in the browser — whoami claim wins on the Demo host so stale
 * admin preview cookies cannot route Talanton/OnwardAir fixtures while logged into Demo.
 */
export function readEffectiveBrowserWorkspaceSlug(): string {
  if (typeof window === "undefined") return "";

  const whoamiSlug = readBrowserWorkspaceSlugFromWhoami();
  if (isOnDemoHostBrowser()) {
    if (isDemoWorkspaceSlug(whoamiSlug)) return DEMO_WORKSPACE_SLUG;
    if (isBrowserDemoPreviewActive()) return readBrowserDemoPreviewSlug();
    return DEMO_WORKSPACE_SLUG;
  }

  if (whoamiSlug) return whoamiSlug;

  const hostSlug = parseClientPlatformSubdomainSafe(window.location.hostname);
  return hostSlug ?? "";
}
