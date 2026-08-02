/**
 * OnwardAir customer host detection (onwardair.unit311central.com).
 */

export const ONWARDAIR_SLUG = "onwardair";

export function isOnwardAirSlug(slug: string | null | undefined): boolean {
  return (
    String(slug ?? "")
      .trim()
      .toLowerCase() === ONWARDAIR_SLUG
  );
}

export function getBrowserOnwardAirWorkspaceSlug(): string {
  if (typeof window === "undefined") return "";
  const host = window.location.hostname.toLowerCase();
  const match = host.match(/^([a-z0-9-]+)\.unit311central\.com$/i);
  if (match?.[1]) return match[1];
  if (host === "onwardair.localhost" || host.startsWith("onwardair.")) return ONWARDAIR_SLUG;
  return "";
}

export function isBrowserOnwardAirSurface(): boolean {
  return isOnwardAirSlug(getBrowserOnwardAirWorkspaceSlug());
}
