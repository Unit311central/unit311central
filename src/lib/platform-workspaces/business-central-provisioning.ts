/**
 * Business Central workspace provisioning rules.
 *
 * Grant Management is not a Business Central capability — it will be classified under
 * Fundraising (future). Legacy `business-central:grants` keys are stripped from nav
 * enablement so historical workspace metadata cannot re-surface it in BC LHS.
 */

/** Legacy catalogue submodule key — no longer part of Business Central product taxonomy. */
export const BUSINESS_CENTRAL_GRANT_MANAGEMENT_SUBMODULE_KEY =
  "business-central:grants" as const;

/** Grant Management must not appear under Business Central for any workspace. */
export function workspaceExcludesBusinessCentralGrantManagement(
  _slug?: string | null,
): boolean {
  return true;
}

export function filterBusinessCentralProvisioningSubModules(
  _slug: string | null | undefined,
  subModules: readonly string[],
): string[] {
  return subModules.filter((key) => key !== BUSINESS_CENTRAL_GRANT_MANAGEMENT_SUBMODULE_KEY);
}
