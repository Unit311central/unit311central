/**
 * Workspaces that use curated accounting fixtures (Northstar-shaped) instead of live tables.
 */

import { DEMO_WORKSPACE_SLUG } from "@/lib/app-domains";
import { isAbhiSlug } from "@/lib/abhi-surface";

export function usesNorthstarStyleAccountingFixtures(
  workspaceSlug: string | null | undefined,
): boolean {
  const normalized = String(workspaceSlug ?? "")
    .trim()
    .toLowerCase();
  if (!normalized) return false;
  return normalized === "demo" || normalized === DEMO_WORKSPACE_SLUG || isAbhiSlug(normalized);
}
