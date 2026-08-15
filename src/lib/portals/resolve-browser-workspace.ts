import { parseClientPlatformSubdomainSafe } from "@/lib/app-domains";
import { getPortalPackBySlug } from "@/lib/portals/registry";

/**
 * Resolve the canonical portal workspace slug from the browser host via the central registry.
 * Used by ECA and other admin surfaces — no per-workspace browser-surface branches.
 */
export function resolvePortalWorkspaceSlugFromBrowser(): string | null {
  if (typeof window === "undefined") return null;

  const host = window.location.hostname.toLowerCase();
  const fromUnit311Host = parseClientPlatformSubdomainSafe(host);
  if (fromUnit311Host) {
    const pack = getPortalPackBySlug(fromUnit311Host);
    if (pack) return pack.slug;
  }

  if (host.endsWith(".localhost")) {
    const sub = host.slice(0, -".localhost".length);
    const pack = getPortalPackBySlug(sub);
    if (pack) return pack.slug;
  }

  const localMatch = host.match(/^([a-z0-9-]+)\.local$/i);
  if (localMatch?.[1]) {
    const pack = getPortalPackBySlug(localMatch[1]);
    if (pack) return pack.slug;
  }

  return null;
}
