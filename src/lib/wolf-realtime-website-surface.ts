/**
 * WOLF REALTIME public marketing website — wolfrealtime.com
 * Draft preview: wolf-website.unit311central.com
 * Product workspace (unchanged): wolf.unit311central.com
 */

import { normalizeHost, UNIT311_SITE_HOST } from "@/lib/app-domains";

export const WOLF_REALTIME_WEBSITE_PRODUCTION_DOMAIN = "wolfrealtime.com";

export const WOLF_REALTIME_WEBSITE_SUBDOMAIN = "wolf-website";

export const WOLF_REALTIME_WEBSITE_HOST = `${WOLF_REALTIME_WEBSITE_SUBDOMAIN}.${UNIT311_SITE_HOST}`;

export const WOLF_REALTIME_WEBSITE_URL = `https://${WOLF_REALTIME_WEBSITE_PRODUCTION_DOMAIN}`;

export const WOLF_REALTIME_CONTACT_EMAIL = "info@wolfrealtime.com";

export const WOLF_REALTIME_WEBSITE_ROUTE_PREFIX = "/sites/wolf-realtime";

export function isWolfRealtimeWebsiteHost(host: string | null | undefined): boolean {
  const normalized = normalizeHost(host);
  if (!normalized) return false;
  if (normalized === WOLF_REALTIME_WEBSITE_PRODUCTION_DOMAIN) return true;
  if (normalized === `www.${WOLF_REALTIME_WEBSITE_PRODUCTION_DOMAIN}`) return true;
  if (normalized === WOLF_REALTIME_WEBSITE_HOST) return true;
  if (normalized === "wolfrealtime.localhost") return true;
  if (normalized === "wolf-website.localhost") return true;
  return false;
}

/** Map a browser path on wolfrealtime.com to the App Router implementation path. */
export function wolfRealtimeWebsiteImplPath(pathname: string): string {
  const path = pathname === "/" || pathname === "" ? "/" : pathname.replace(/\/$/, "");
  if (path === "/") return WOLF_REALTIME_WEBSITE_ROUTE_PREFIX;
  return WOLF_REALTIME_WEBSITE_ROUTE_PREFIX;
}
