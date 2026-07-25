import { isDemoDomainHost } from "@/lib/app-domains";

/** Client-side Demo host detection for mock-store fixture gating. */
export function isBrowserDemoSurface(): boolean {
  if (typeof window === "undefined") return false;
  return isDemoDomainHost(window.location.hostname);
}
