/**
 * OmniTransit board portal brand domain — omnitransit.unit311.com
 * Maps to the existing `saec` workspace (not a separate tenant).
 */

import { normalizeHost } from "@/lib/app-domains";
import { OMNITRANSIT_HOST_ALIAS_SLUG, SAEC_SLUG } from "@/lib/saec-surface";

export const OMNITRANSIT_BRAND_SITE_HOST = "unit311.com";

export const OMNITRANSIT_BOARD_PORTAL_ORIGIN = `https://${OMNITRANSIT_HOST_ALIAS_SLUG}.${OMNITRANSIT_BRAND_SITE_HOST}`;

export const OMNITRANSIT_CLIENT_PORTAL_ORIGIN = `https://${OMNITRANSIT_HOST_ALIAS_SLUG}.unit311central.com`;

export type OmnitransitBrandPortalHost = {
  workspaceSlug: typeof SAEC_SLUG;
  origin: typeof OMNITRANSIT_BOARD_PORTAL_ORIGIN;
};

export function isOmnitransitBrandPortalHost(host: string | null | undefined): boolean {
  const normalized = normalizeHost(host);
  if (!normalized) return false;
  if (normalized === `${OMNITRANSIT_HOST_ALIAS_SLUG}.${OMNITRANSIT_BRAND_SITE_HOST}`) {
    return true;
  }
  if (normalized === `${OMNITRANSIT_HOST_ALIAS_SLUG}.localhost`) {
    return true;
  }
  return false;
}

export function resolveOmnitransitBrandPortalHost(
  host: string | null | undefined,
): OmnitransitBrandPortalHost | null {
  if (!isOmnitransitBrandPortalHost(host)) return null;
  return {
    workspaceSlug: SAEC_SLUG,
    origin: OMNITRANSIT_BOARD_PORTAL_ORIGIN,
  };
}
