/**
 * CorpCentre customer host detection (corpcentre.unit311central.com).
 * Used to gate AU-only fixtures and nav for that workspace only.
 */

export function getBrowserWorkspaceSlug(): string {
  if (typeof window === "undefined") return "";
  const host = window.location.hostname.toLowerCase();
  const match = host.match(/^([a-z0-9-]+)\.unit311central\.com$/i);
  return match?.[1] ?? "";
}

export function isBrowserCorpCentreSurface(): boolean {
  const slug = getBrowserWorkspaceSlug();
  return slug === "corpcentre" || slug === "corporatecentre";
}
