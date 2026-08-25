/**
 * Workspaces that use curated accounting fixtures (Northstar-shaped) instead of live tables.
 */

import { DEMO_WORKSPACE_SLUG } from "@/lib/app-domains";
import { isAbhiSlug } from "@/lib/abhi-surface";
import { isSaecSlug } from "@/lib/saec-surface";

export function usesNorthstarStyleAccountingFixtures(
  workspaceSlug: string | null | undefined,
): boolean {
  const normalized = String(workspaceSlug ?? "")
    .trim()
    .toLowerCase();
  if (!normalized) return false;
  return normalized === "demo" || normalized === DEMO_WORKSPACE_SLUG || isAbhiSlug(normalized);
}

export function usesSaecAccountingFixtures(workspaceSlug: string | null | undefined): boolean {
  return isSaecSlug(workspaceSlug);
}

export function usesFixtureAccountingWorkspace(workspaceSlug: string | null | undefined): boolean {
  return usesNorthstarStyleAccountingFixtures(workspaceSlug) || usesSaecAccountingFixtures(workspaceSlug);
}

export type AccountingFixtureSource = "saec" | "northstar" | null;

export function resolveAccountingFixtureSource(
  workspaceSlug: string | null | undefined,
): AccountingFixtureSource {
  if (usesSaecAccountingFixtures(workspaceSlug)) return "saec";
  if (usesNorthstarStyleAccountingFixtures(workspaceSlug)) return "northstar";
  return null;
}
