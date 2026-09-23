/**
 * Tools — agreed product taxonomy (Core Module → Core Features).
 *
 *   1 Core Module · 6 Core Features · 0 Core Sub-features · 0 Custom
 */

import type { InternalOperationsView } from "@/lib/internal-operations-data";

export const TOOLS_MODULE_ID = "tools" as const;

export const TOOLS_MODULE_LABEL = "Tools" as const;

export type ToolsCoreFeature = {
  label: string;
  viewId: InternalOperationsView;
};

export const TOOLS_CORE_FEATURES: readonly ToolsCoreFeature[] = [
  { label: "Website Management", viewId: "website-management" },
  { label: "Integrations", viewId: "integrations" },
  { label: "Testing", viewId: "testing" },
  { label: "Telemetry", viewId: "telemetry" },
  { label: "Users", viewId: "users" },
  { label: "Unit311 Support", viewId: "unit311-support" },
] as const;

export const TOOLS_CUSTOM_FEATURES: readonly string[] = [];

export const TOOLS_CUSTOM_SUB_FEATURES: readonly string[] = [];

export function toolsCoreFeatureCount(): number {
  return TOOLS_CORE_FEATURES.length;
}

export function toolsCoreSubFeatureCount(): number {
  return 0;
}
