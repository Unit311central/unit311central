/**
 * Fundraising workspace provisioning — OmniTransit Corporate Shareholding subset.
 */

import {
  FUNDRAISING_CORPORATE_SHAREHOLDING_EXCLUDED_FEATURE_VIEW_IDS,
} from "@/lib/fundraising/fundraising-taxonomy";
import { subModuleKey } from "@/lib/platform-workspaces/module-catalogue";
import { SAEC_SLUG } from "@/lib/saec-surface";

/** Fundraising sub-modules excluded from OmniTransit Corporate Shareholding presentation. */
export const FUNDRAISING_CORPORATE_SHAREHOLDING_EXCLUDED_SUBMODULE_KEYS = [
  ...FUNDRAISING_CORPORATE_SHAREHOLDING_EXCLUDED_FEATURE_VIEW_IDS.map((viewId) =>
    subModuleKey("fundraising", viewId),
  ),
] as const;

const CORPORATE_SHAREHOLDING_EXCLUDED_KEYS = new Set<string>(
  FUNDRAISING_CORPORATE_SHAREHOLDING_EXCLUDED_SUBMODULE_KEYS,
);

export function workspacePresentsFundraisingAsCorporateShareholding(
  slug: string | null | undefined,
): boolean {
  return String(slug ?? "").trim().toLowerCase() === SAEC_SLUG;
}

export function filterFundraisingProvisioningSubModules(
  slug: string | null | undefined,
  subModules: readonly string[],
): string[] {
  if (!workspacePresentsFundraisingAsCorporateShareholding(slug)) {
    return [...subModules];
  }
  return subModules.filter((key) => !CORPORATE_SHAREHOLDING_EXCLUDED_KEYS.has(key));
}
