import { isDemoDomainHost } from "@/lib/app-domains";
import { readBrowserDemoPreviewSlug, DEMO_WORKSPACE_SLUG } from "@/lib/demo/workspace-preview";

/** Client-side Demo host detection for mock-store fixture gating. */
export function isBrowserDemoSurface(): boolean {
  if (typeof window === "undefined") return false;
  if (!isDemoDomainHost(window.location.hostname)) return false;
  return readBrowserDemoPreviewSlug() === DEMO_WORKSPACE_SLUG;
}
