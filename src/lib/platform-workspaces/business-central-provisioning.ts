/**
 * Business Central workspace provisioning rules — grant management exclusions.
 */

import { ABHI_SLUG } from "@/lib/abhi-surface";
import { isSaecSlug, OMNITRANSIT_HOST_ALIAS_SLUG } from "@/lib/saec-surface";

/** Catalogue submodule key for Business Central → Grant Management. */
export const BUSINESS_CENTRAL_GRANT_MANAGEMENT_SUBMODULE_KEY =
  "business-central:grants" as const;

/** Workspaces that must not receive Grant Management (ABHI, OmniTransit/SAEC). */
export function workspaceExcludesBusinessCentralGrantManagement(
  slug: string | null | undefined,
): boolean {
  const normalized = String(slug ?? "").trim().toLowerCase();
  if (!normalized) return false;
  if (normalized === ABHI_SLUG) return true;
  if (isSaecSlug(normalized) || normalized === OMNITRANSIT_HOST_ALIAS_SLUG) return true;
  return false;
}

export function filterBusinessCentralProvisioningSubModules(
  slug: string | null | undefined,
  subModules: readonly string[],
): string[] {
  if (!workspaceExcludesBusinessCentralGrantManagement(slug)) {
    return [...subModules];
  }
  return subModules.filter((key) => key !== BUSINESS_CENTRAL_GRANT_MANAGEMENT_SUBMODULE_KEY);
}
