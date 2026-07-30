/**
 * CorpCentre customer host detection (corpcentre.unit311central.com).
 * Used to gate AU-only fixtures and nav for that workspace only.
 */

export function getBrowserWorkspaceSlug(): string {
  if (typeof window === "undefined") return "";
  const host = window.location.hostname.toLowerCase();
  const match = host.match(/^([a-z0-9-]+)\.unit311central\.com$/i);
  if (match?.[1]) return match[1];
  // Fallback for alternate hosts / previews that still carry the tenant name.
  if (host.includes("corpcentre") || host.includes("corporatecentre")) {
    return "corpcentre";
  }
  return "";
}

export function isBrowserCorpCentreSurface(): boolean {
  const slug = getBrowserWorkspaceSlug();
  return slug === "corpcentre" || slug === "corporatecentre";
}
