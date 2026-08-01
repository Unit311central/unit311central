/**
 * Talanton Impact customer host detection (talantonimpact.unit311central.com).
 * Gates Talanton-only portfolio / governance / compliance fixtures and nav.
 */

export const TALANTON_IMPACT_SLUG = "talantonimpact";

export function getBrowserWorkspaceSlug(): string {
  if (typeof window === "undefined") return "";
  const host = window.location.hostname.toLowerCase();
  const match = host.match(/^([a-z0-9-]+)\.unit311central\.com$/i);
  if (match?.[1]) return match[1];
  if (host.includes("talantonimpact") || host.includes("talanton")) {
    return TALANTON_IMPACT_SLUG;
  }
  return "";
}

export function isTalantonImpactSlug(slug: string | null | undefined): boolean {
  return String(slug ?? "")
    .trim()
    .toLowerCase() === TALANTON_IMPACT_SLUG;
}

export function isBrowserTalantonImpactSurface(): boolean {
  return isTalantonImpactSlug(getBrowserWorkspaceSlug());
}
