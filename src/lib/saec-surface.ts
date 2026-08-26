/**
 * SAEC workspace tenancy (slug `saec`) — customer-facing OmniTransit brand.
 * Primary host: omnitransit.unit311central.com
 */

import { normalizeHost } from "@/lib/app-domains";

export const SAEC_SLUG = "saec";

/** Public customer host alias — maps to SAEC_SLUG in tenancy. */
export const OMNITRANSIT_HOST_ALIAS_SLUG = "omnitransit";

export const OMNITRANSIT_DISPLAY_NAME = "OmniTransit";

export const SAEC_REPORTING_CURRENCY = "ZAR" as const;

/** Customer-facing company / product name. */
export const SAEC_COMPANY_NAME = OMNITRANSIT_DISPLAY_NAME;

export const SAEC_COUNTRY = "South Africa";

export const SAEC_TIMEZONE = "Africa/Johannesburg";

export const SAEC_INDUSTRY = "Elevators / Escalators / Vertical Transportation";

export const OMNITRANSIT_WORKSPACE_LOGO_SRC = "/images/workspaces/omnitransit-logo.svg";

/** Official OmniTransit wordmark for sidebar / login. */
export const SAEC_WORKSPACE_LOGO_SRC = OMNITRANSIT_WORKSPACE_LOGO_SRC;

export const SAEC_LOGO_INTRINSIC_WIDTH = 240;

export const SAEC_LOGO_INTRINSIC_HEIGHT = 48;

export function canonicalizeSaecWorkspaceSlug(
  slug: string | null | undefined,
): typeof SAEC_SLUG | null {
  const normalized = String(slug ?? "")
    .trim()
    .toLowerCase();
  if (normalized === SAEC_SLUG || normalized === OMNITRANSIT_HOST_ALIAS_SLUG) {
    return SAEC_SLUG;
  }
  return null;
}

export function isSaecSlug(slug: string | null | undefined): boolean {
  return canonicalizeSaecWorkspaceSlug(slug) !== null;
}

/** Canonical customer hostname subdomain for this workspace. */
export function resolveSaecCustomerHostSubdomain(): typeof OMNITRANSIT_HOST_ALIAS_SLUG {
  return OMNITRANSIT_HOST_ALIAS_SLUG;
}

export function isBrowserSaecSurface(): boolean {
  if (typeof window === "undefined") return false;
  const host = normalizeHost(window.location.hostname);
  if (host === `${OMNITRANSIT_HOST_ALIAS_SLUG}.unit311central.com`) return true;
  if (host === `${OMNITRANSIT_HOST_ALIAS_SLUG}.unit311.com`) return true;
  if (host === `${OMNITRANSIT_HOST_ALIAS_SLUG}.localhost`) return true;
  if (host === `${SAEC_SLUG}.unit311central.com`) return true;
  if (host === `${SAEC_SLUG}.localhost`) return true;
  return false;
}
