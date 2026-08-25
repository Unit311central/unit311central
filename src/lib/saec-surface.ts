/**
 * SAEC customer workspace — saec.unit311central.com
 * Elevators / Escalators / Vertical Transportation (South Africa).
 */

import { normalizeHost } from "@/lib/app-domains";

export const SAEC_SLUG = "saec";

export const SAEC_REPORTING_CURRENCY = "ZAR" as const;

export const SAEC_COMPANY_NAME = "SAEC";

export const SAEC_COUNTRY = "South Africa";

export const SAEC_TIMEZONE = "Africa/Johannesburg";

export const SAEC_INDUSTRY = "Elevators / Escalators / Vertical Transportation";

export function isSaecSlug(slug: string | null | undefined): boolean {
  return (
    String(slug ?? "")
      .trim()
      .toLowerCase() === SAEC_SLUG
  );
}

export function isBrowserSaecSurface(): boolean {
  if (typeof window === "undefined") return false;
  const host = normalizeHost(window.location.hostname);
  if (host === `${SAEC_SLUG}.unit311central.com`) return true;
  if (host === `${SAEC_SLUG}.localhost`) return true;
  return false;
}
