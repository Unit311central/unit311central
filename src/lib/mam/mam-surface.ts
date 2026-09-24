/**
 * MAM (Moroccan Advanced Manufacturing) customer workspace surface.
 */

import { normalizeHost } from "@/lib/app-domains";

/** Canonical `public.workspaces.slug` / tenancy slug. */
export const MAM_SLUG = "mam";

export const MAM_DISPLAY_NAME = "MAM";

/** Public customer host: mam.unit311central.com */
export const MAM_HOST_ALIAS = "mam";

export const MAM_COMPANY_NAME = "Moroccan Advanced Manufacturing";

export function isMamSlug(slug: string | null | undefined): boolean {
  return String(slug ?? "").trim().toLowerCase() === MAM_SLUG;
}

export function isMamHost(host: string | null | undefined): boolean {
  const normalized = normalizeHost(host);
  if (!normalized) return false;
  if (normalized === `${MAM_HOST_ALIAS}.unit311central.com`) return true;
  if (normalized === `${MAM_HOST_ALIAS}.localhost`) return true;
  return false;
}

export function isBrowserMamSurface(): boolean {
  if (typeof window === "undefined") return false;
  return isMamHost(window.location.hostname);
}
