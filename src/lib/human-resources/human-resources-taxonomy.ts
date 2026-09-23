/**
 * Human Resources — agreed product taxonomy (Core Module → Core Features).
 *
 *   1 Core Module · 8 Core Features · 0 Core Sub-features · 0 Custom
 */

import type { InternalOperationsView } from "@/lib/internal-operations-data";

export const HUMAN_RESOURCES_MODULE_ID = "human-resources" as const;

export const HUMAN_RESOURCES_MODULE_LABEL = "Human Resources" as const;

export type HumanResourcesCoreFeature = {
  label: string;
  viewId: InternalOperationsView;
};

export const HUMAN_RESOURCES_CORE_FEATURES: readonly HumanResourcesCoreFeature[] = [
  { label: "Dashboard", viewId: "hr-dashboard" },
  { label: "Employees", viewId: "hr" },
  { label: "Org Chart", viewId: "hr-org-chart" },
  { label: "Recruitment", viewId: "hr-recruitment" },
  { label: "Time & Attendance", viewId: "hr-leave" },
  { label: "Payroll", viewId: "hr-payroll" },
  { label: "Performance", viewId: "hr-performance" },
  { label: "HR Reports", viewId: "hr-reports" },
] as const;

export const HUMAN_RESOURCES_CUSTOM_FEATURES: readonly string[] = [];

export const HUMAN_RESOURCES_CUSTOM_SUB_FEATURES: readonly string[] = [];

export function humanResourcesCoreFeatureCount(): number {
  return HUMAN_RESOURCES_CORE_FEATURES.length;
}

export function humanResourcesCoreSubFeatureCount(): number {
  return 0;
}
