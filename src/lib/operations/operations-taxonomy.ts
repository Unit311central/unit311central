/**
 * Operations — agreed product taxonomy (Core Module → Core Features).
 *
 * Verification-only formalisation. Maps taxonomy levels to EXISTING view IDs and nav
 * labels — it does not introduce new routes, provisioning keys, or pages.
 *
 * Standard product: 1 Core Module · 5 Core Features · 0 Core Sub-features · 0 Custom
 *
 * OmniTransit / SAEC workspace extension (not part of standard product counts):
 * Installations — Custom Feature with three Custom Sub-features (see SAEC_INSTALLATIONS_*).
 */

import type { InternalOperationsView } from "@/lib/internal-operations-data";

export const OPERATIONS_MODULE_ID = "operations" as const;

export const OPERATIONS_MODULE_LABEL = "Operations" as const;

export type OperationsCoreFeature = {
  label: string;
  viewId: InternalOperationsView;
};

/** Five Core Features in central Operations nav order (flat leaves — no Core Sub-features). */
export const OPERATIONS_CORE_FEATURES: readonly OperationsCoreFeature[] = [
  { label: "Dashboard", viewId: "operations-dashboard" },
  { label: "Assets", viewId: "assets" },
  { label: "Inventory", viewId: "inventory-management" },
  { label: "Procurement", viewId: "procurement" },
  { label: "Logistics", viewId: "logistics" },
] as const;

export const OPERATIONS_CUSTOM_FEATURES: readonly string[] = [];

export const OPERATIONS_CUSTOM_SUB_FEATURES: readonly string[] = [];

/** OmniTransit / SAEC-only Operations nav extension (not in central module catalogue). */
export const SAEC_INSTALLATIONS_CUSTOM_FEATURE_LABEL = "Installations" as const;

export type SaecInstallationsCustomSubFeature = {
  label: string;
  viewId: InternalOperationsView;
};

export const SAEC_INSTALLATIONS_CUSTOM_SUB_FEATURES: readonly SaecInstallationsCustomSubFeature[] =
  [
    { label: "Dashboard", viewId: "saec-installations-dashboard" },
    { label: "Elevators", viewId: "saec-installations-elevators" },
    { label: "Escalators", viewId: "saec-installations-escalators" },
  ] as const;

export function operationsCoreFeatureCount(): number {
  return OPERATIONS_CORE_FEATURES.length;
}

export function operationsCoreSubFeatureCount(): number {
  return 0;
}
