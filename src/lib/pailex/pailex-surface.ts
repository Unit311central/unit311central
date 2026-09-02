/**
 * PAILEX customer workspace — WOLF wildlife-operations deployment (South Africa).
 * Primary host: pailex.unit311central.com
 */

import { normalizeHost } from "@/lib/app-domains";

export const PAILEX_SLUG = "pailex";

export const PAILEX_HOST_ALIAS = "pailex";

export const PAILEX_DISPLAY_NAME = "PAILEX";

export const PAILEX_TAGLINE = "WOLF Wildlife Operations";

export const PAILEX_RESERVE_SEED_SLUG = "pailex-demo";

export const PAILEX_COUNTRY = "South Africa";

export const PAILEX_TIMEZONE = "Africa/Johannesburg";

export const PAILEX_ORIGIN = `https://${PAILEX_HOST_ALIAS}.unit311central.com`;

export const PAILEX_ADMIN_EMAIL = "admin@pailex.unit311central.com";

export function canonicalizePailexSlug(
  slug: string | null | undefined,
): typeof PAILEX_SLUG | null {
  const normalized = String(slug ?? "")
    .trim()
    .toLowerCase();
  if (normalized === PAILEX_SLUG || normalized === PAILEX_HOST_ALIAS) {
    return PAILEX_SLUG;
  }
  return null;
}

export function isPailexSlug(slug: string | null | undefined): boolean {
  return canonicalizePailexSlug(slug) !== null;
}

export function isPailexHost(host: string | null | undefined): boolean {
  const normalized = normalizeHost(host);
  if (!normalized) return false;
  if (normalized === `${PAILEX_HOST_ALIAS}.unit311central.com`) return true;
  if (normalized === `${PAILEX_HOST_ALIAS}.localhost`) return true;
  if (normalized === `${PAILEX_SLUG}.unit311central.com`) return true;
  if (normalized === `${PAILEX_SLUG}.localhost`) return true;
  return false;
}

export function isBrowserPailexSurface(): boolean {
  if (typeof window === "undefined") return false;
  return isPailexHost(window.location.hostname);
}
