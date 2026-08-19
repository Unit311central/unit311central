import { DEMO_WORKSPACE_SLUG, isDemoDomainHost } from "@/lib/app-domains";
import { readBrowserDemoPreviewSlug } from "@/lib/demo/workspace-preview";
import { INTERNAL_WORKSPACE_SLUG } from "@/lib/workspace-host";

/** Resolve workspace slug from hostname (server-safe / test-safe). */
export function resolveWorkspaceSlugFromHost(
  hostname: string,
  demoPreviewSlug?: string | null,
): string {
  const host = hostname.trim().toLowerCase();

  if (isDemoDomainHost(host)) {
    const preview = String(demoPreviewSlug ?? DEMO_WORKSPACE_SLUG)
      .trim()
      .toLowerCase();
    return preview || DEMO_WORKSPACE_SLUG;
  }

  const match = host.match(/^([a-z0-9-]+)\.unit311central\.com$/i);
  if (match?.[1] && !["www", "app", "login"].includes(match[1])) {
    const slug = match[1].toLowerCase();
    if (slug === "internal") return INTERNAL_WORKSPACE_SLUG;
    return slug;
  }

  if (host.endsWith(".localhost") && host !== "localhost") {
    return (host.split(".")[0] || INTERNAL_WORKSPACE_SLUG).toLowerCase();
  }

  if (
    host === "internal.unit311central.com" ||
    host === "internal.localhost" ||
    host === "unit311central.com" ||
    host === "www.unit311central.com" ||
    host === "localhost" ||
    host === "127.0.0.1"
  ) {
    return INTERNAL_WORKSPACE_SLUG;
  }

  return INTERNAL_WORKSPACE_SLUG;
}

/** Browser-only slug for tutorial resolution. */
export function resolveBrowserTutorialWorkspaceSlug(): string {
  if (typeof window === "undefined") return INTERNAL_WORKSPACE_SLUG;
  const host = window.location.hostname;
  if (isDemoDomainHost(host)) {
    return readBrowserDemoPreviewSlug();
  }
  return resolveWorkspaceSlugFromHost(host);
}
