/**
 * WOLF Central workspace surface — isolated from other verticals.
 */

import { normalizeHost } from "@/lib/app-domains";

/** Database / tenancy slug for WOLF Central. */
export const WOLF_CENTRAL_SLUG = "wolf-central";

/** Public host subdomain: wolf.unit311central.com */
export const WOLF_CENTRAL_HOST_ALIAS = "wolf";

export const WOLF_PRODUCT_LINE = "wolf";

export const WOLF_DISPLAY_NAME = "WOLF";

export const WOLF_TAGLINE = "WILDLIFE | OPERATIONS | LIVE | FLIGHT";

export const WOLF_CENTRAL_ORIGIN = `https://${WOLF_CENTRAL_HOST_ALIAS}.unit311central.com`;

/** WOLF Central operational reporting currency (USD). */
export const WOLF_REPORTING_CURRENCY = "USD";

export function canonicalizeWolfCentralSlug(
  slug: string | null | undefined,
): typeof WOLF_CENTRAL_SLUG | null {
  const normalized = String(slug ?? "")
    .trim()
    .toLowerCase();
  if (normalized === WOLF_CENTRAL_SLUG || normalized === WOLF_CENTRAL_HOST_ALIAS) {
    return WOLF_CENTRAL_SLUG;
  }
  return null;
}

export function isWolfCentralSlug(slug: string | null | undefined): boolean {
  return canonicalizeWolfCentralSlug(slug) !== null;
}

export function isWolfCentralHost(host: string | null | undefined): boolean {
  const normalized = normalizeHost(host);
  if (!normalized) return false;
  if (normalized === `${WOLF_CENTRAL_HOST_ALIAS}.unit311central.com`) return true;
  if (normalized === `${WOLF_CENTRAL_HOST_ALIAS}.localhost`) return true;
  if (normalized === `${WOLF_CENTRAL_SLUG}.unit311central.com`) return true;
  if (normalized === `${WOLF_CENTRAL_SLUG}.localhost`) return true;
  return false;
}

/** True when this request is aimed at the WOLF host, including the browser Origin. */
export function requestTargetsWolfCentral(headerList: {
  get(name: string): string | null;
}): boolean {
  const raw = [
    headerList.get("x-forwarded-host"),
    headerList.get("host"),
    headerList.get("origin"),
    headerList.get("x-unit311-workspace-slug"),
  ];
  for (const value of raw) {
    if (!value) continue;
    for (const part of value.split(",")) {
      const token = part.trim();
      if (!token) continue;
      if (isWolfCentralHost(token) || isWolfCentralSlug(token)) return true;
      if (!token.includes("://")) continue;
      try {
        if (isWolfCentralHost(new URL(token).host)) return true;
      } catch {
        // Ignore values that are not URLs.
      }
    }
  }
  return false;
}

export function isBrowserWolfCentralSurface(): boolean {
  if (typeof window === "undefined") return false;
  if (isWolfCentralHost(window.location.hostname)) return true;
  if (!window.location.hostname.endsWith(".vercel.app")) return false;
  const pathname = window.location.pathname.replace(/\/+$/, "") || "/";
  return (
    pathname === "/ws/wolf-central" ||
    pathname.startsWith("/ws/wolf-central/") ||
    pathname === "/ws/wolf" ||
    pathname.startsWith("/ws/wolf/")
  );
}
