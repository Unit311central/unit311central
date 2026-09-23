/**
 * External Client Access — agreed product taxonomy (Core Module → Core Features).
 *
 *   1 Core Module · 2 Core Features · 0 Core Sub-features · 0 Custom
 */

import type { InternalOperationsView } from "@/lib/internal-operations-data";

export const EXTERNAL_CLIENT_ACCESS_MODULE_ID = "external-client-access" as const;

export const EXTERNAL_CLIENT_ACCESS_MODULE_LABEL = "External Client Access" as const;

export type ExternalClientAccessCoreFeature = {
  label: string;
  viewId: InternalOperationsView;
};

export const EXTERNAL_CLIENT_ACCESS_CORE_FEATURES: readonly ExternalClientAccessCoreFeature[] = [
  { label: "Dashboard", viewId: "external-client-access" },
  { label: "External Users", viewId: "users-external" },
] as const;

export const EXTERNAL_CLIENT_ACCESS_CUSTOM_FEATURES: readonly string[] = [];

export const EXTERNAL_CLIENT_ACCESS_CUSTOM_SUB_FEATURES: readonly string[] = [];

export function externalClientAccessCoreFeatureCount(): number {
  return EXTERNAL_CLIENT_ACCESS_CORE_FEATURES.length;
}

export function externalClientAccessCoreSubFeatureCount(): number {
  return 0;
}
