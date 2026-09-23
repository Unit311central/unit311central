/**
 * Project Management — agreed product taxonomy (Core Module → Core Features).
 *
 * Central catalogue uses buildProjectManagementNavSection() without Grants or Work Packages.
 *
 *   1 Core Module · 3 Core Features · 0 Core Sub-features · 0 Custom
 */

import type { InternalOperationsView } from "@/lib/internal-operations-data";
import { PROJECT_MANAGEMENT_MODULE_LABEL } from "@/lib/project-management-nav";

export const PROJECT_MANAGEMENT_MODULE_ID = "project-management" as const;

export const PROJECT_MANAGEMENT_MODULE_LABEL_CANONICAL = PROJECT_MANAGEMENT_MODULE_LABEL;

export type ProjectManagementCoreFeature = {
  label: string;
  viewId: InternalOperationsView;
};

export const PROJECT_MANAGEMENT_CORE_FEATURES: readonly ProjectManagementCoreFeature[] = [
  { label: "Dashboard", viewId: "projects-dashboard" },
  { label: "Internal Projects", viewId: "projects-internal" },
  { label: "External Projects", viewId: "projects-external" },
] as const;

/** Grants belong to Core Fundraising — not Project Management. */
export const PROJECT_MANAGEMENT_EXCLUDED_VIEW_IDS = [
  "grants",
  "internal-work-packages",
] as const satisfies readonly InternalOperationsView[];

export const PROJECT_MANAGEMENT_CUSTOM_FEATURES: readonly string[] = [];

export const PROJECT_MANAGEMENT_CUSTOM_SUB_FEATURES: readonly string[] = [];

export function projectManagementCoreFeatureCount(): number {
  return PROJECT_MANAGEMENT_CORE_FEATURES.length;
}

export function projectManagementCoreSubFeatureCount(): number {
  return 0;
}
