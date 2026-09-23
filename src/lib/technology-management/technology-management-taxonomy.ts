/**
 * Technology Management — agreed product taxonomy (Core Module → Core Features).
 *
 *   1 Core Module · 6 Core Features · 0 Core Sub-features · 0 Custom
 */

import type { InternalOperationsView } from "@/lib/internal-operations-data";

export const TECHNOLOGY_MANAGEMENT_MODULE_ID = "technology-management" as const;

export const TECHNOLOGY_MANAGEMENT_MODULE_LABEL = "Technology Management" as const;

export type TechnologyManagementCoreFeature = {
  label: string;
  viewId: InternalOperationsView;
};

export const TECHNOLOGY_MANAGEMENT_CORE_FEATURES: readonly TechnologyManagementCoreFeature[] = [
  { label: "Dashboard", viewId: "technology-dashboard" },
  { label: "Architecture Diagrams", viewId: "technology-architecture" },
  { label: "Technology Assets", viewId: "technology-devices" },
  { label: "Software & SaaS Dashboard", viewId: "technology-software-dashboard" },
  { label: "Software & SaaS", viewId: "technology-software" },
  { label: "Telecommunications", viewId: "technology-telecommunications" },
] as const;

export const TECHNOLOGY_MANAGEMENT_CUSTOM_FEATURES: readonly string[] = [];

export const TECHNOLOGY_MANAGEMENT_CUSTOM_SUB_FEATURES: readonly string[] = [];

export function technologyManagementCoreFeatureCount(): number {
  return TECHNOLOGY_MANAGEMENT_CORE_FEATURES.length;
}

export function technologyManagementCoreSubFeatureCount(): number {
  return 0;
}
