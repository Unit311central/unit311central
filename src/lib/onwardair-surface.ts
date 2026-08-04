/**
 * OnwardAir customer host detection (onwardair.unit311central.com).
 */

export const ONWARDAIR_SLUG = "onwardair";

/** OnwardAir reports and displays money in USD across Home, Financials, and modules. */
export const ONWARDAIR_REPORTING_CURRENCY = "USD";

/** Official wordmark from onwardair.tech (white mark on transparent). */
export const ONWARDAIR_LOGO_SRC = "/images/workspaces/onwardair-logo.png";
export const ONWARDAIR_LOGO_INTRINSIC_WIDTH = 155;
export const ONWARDAIR_LOGO_INTRINSIC_HEIGHT = 40;

/** Home LHS stripe + RHS title accent — RGB(38, 123, 144), matches onwardair.tech CTA. */
export const ONWARDAIR_HOME_ACCENT = "#267B90";

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
  if (typeof window === "undefined") return false;
  if (isOnwardAirSlug(getBrowserOnwardAirWorkspaceSlug())) return true;
  // Fallback for preview / alternate hosts that still carry the tenant name.
  return window.location.hostname.toLowerCase().includes("onwardair");
}
