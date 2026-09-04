/**
 * Green Desert customer workspace surface.
 */

import { normalizeHost } from "@/lib/app-domains";

/** Database / tenancy slug for Green Desert. */
export const GREENDESERT_SLUG = "greendesert";

export const GREENDESERT_DISPLAY_NAME = "Green Desert";

/** Green Desert operational reporting currency (USD). */
export const GREENDESERT_REPORTING_CURRENCY = "USD";

export const GREENDESERT_WORKSPACE_LOGO_SRC = "/images/workspaces/greendesert/logo.png";

export const GREENDESERT_WORKSPACE_LOGO_INTRINSIC_WIDTH = 336;
export const GREENDESERT_WORKSPACE_LOGO_INTRINSIC_HEIGHT = 382;

export function isGreenDesertSlug(slug: string | null | undefined): boolean {
  return String(slug ?? "").trim().toLowerCase() === GREENDESERT_SLUG;
}

export function isGreenDesertHost(host: string | null | undefined): boolean {
  const normalized = normalizeHost(host);
  if (!normalized) return false;
  if (normalized === `${GREENDESERT_SLUG}.unit311central.com`) return true;
  if (normalized === `${GREENDESERT_SLUG}.localhost`) return true;
  return false;
}

export function isBrowserGreenDesertSurface(): boolean {
  if (typeof window === "undefined") return false;
  return isGreenDesertHost(window.location.hostname);
}
