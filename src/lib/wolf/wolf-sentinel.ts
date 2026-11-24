/**
 * WOLF Sentinel host (wolfsentinel.unit311central.com).
 *
 * The Postgres database stays unit311. This host is a WOLF view of that
 * database: Unit311 Central modules, WOLF clients, WOLF sales, and WOLF tickets.
 * It is not the wildlife WOLF Central workspace (wolf.unit311central.com).
 */

import { normalizeHost } from "@/lib/app-domains";

export const WOLF_SENTINEL_SLUG = "wolfsentinel";

export const WOLF_SENTINEL_HOST = "wolfsentinel.unit311central.com";

export const WOLF_SENTINEL_DISPLAY_NAME = "WOLF Sentinel";

/** Sidebar modules, in the order the Sentinel host shows them. */
export const WOLF_SENTINEL_MODULE_IDS = [
  "home",
  "business-central",
  "sales-management",
  "operations",
  "business-productivity",
  "support-desk",
  "settings",
] as const;

export function isWolfSentinelSlug(slug: string | null | undefined): boolean {
  return String(slug ?? "").trim().toLowerCase() === WOLF_SENTINEL_SLUG;
}

export function isWolfSentinelHost(host: string | null | undefined): boolean {
  const normalized = normalizeHost(host);
  if (!normalized) return false;
  if (normalized === WOLF_SENTINEL_HOST) return true;
  if (normalized === `${WOLF_SENTINEL_SLUG}.localhost`) return true;
  return false;
}

export function isBrowserWolfSentinelSurface(): boolean {
  if (typeof window === "undefined") return false;
  return isWolfSentinelHost(window.location.hostname);
}

/** True when this request is for the Sentinel host, including the middleware slug header. */
export function requestTargetsWolfSentinel(headerList: {
  get(name: string): string | null;
}): boolean {
  if (isWolfSentinelSlug(headerList.get("x-unit311-workspace-slug"))) return true;
  const raw = [
    headerList.get("x-forwarded-host"),
    headerList.get("host"),
    headerList.get("origin"),
  ];
  for (const value of raw) {
    if (!value) continue;
    for (const part of value.split(",")) {
      const token = part.trim();
      if (!token) continue;
      if (isWolfSentinelHost(token) || isWolfSentinelSlug(token)) return true;
      if (!token.includes("://")) continue;
      try {
        if (isWolfSentinelHost(new URL(token).host)) return true;
      } catch {
        // Ignore values that are not URLs.
      }
    }
  }
  return false;
}

export function supportTicketsVisibleOnWolfSentinel<T extends { clientId?: string | null }>(
  tickets: T[],
  wolfClientIds: ReadonlySet<string>,
): T[] {
  return tickets.filter((ticket) => Boolean(ticket.clientId) && wolfClientIds.has(ticket.clientId as string));
}
