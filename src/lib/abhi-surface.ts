/**
 * ABHI customer host detection (abhi.unit311central.com).
 */

export const ABHI_SLUG = "abhi";

export const ABHI_LOGO_SRC = "/images/workspaces/abhi.jpg";

export function isAbhiSlug(slug: string | null | undefined): boolean {
  return (
    String(slug ?? "")
      .trim()
      .toLowerCase() === ABHI_SLUG
  );
}

export function getBrowserWorkspaceSlug(): string {
  if (typeof window === "undefined") return "";
  const host = window.location.hostname.toLowerCase();
  const match = host.match(/^([a-z0-9-]+)\.unit311central\.com$/i);
  if (match?.[1]) return match[1];
  if (host.includes("abhi")) return ABHI_SLUG;
  return "";
}

export function isBrowserAbhiSurface(): boolean {
  return isAbhiSlug(getBrowserWorkspaceSlug());
}
