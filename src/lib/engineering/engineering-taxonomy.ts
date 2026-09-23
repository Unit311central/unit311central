/**
 * Engineering — agreed product taxonomy (Core Module → Core Features → Core Sub-features).
 *
 * SOPs is a Core Feature with seven Core Sub-features (central product nav).
 *
 *   1 Core Module · 6 Core Features · 7 Core Sub-features · 0 Custom
 */

import type { InternalOperationsView } from "@/lib/internal-operations-data";

export const ENGINEERING_MODULE_ID = "engineering" as const;

export const ENGINEERING_MODULE_LABEL = "Engineering" as const;

export type EngineeringSubFeature = {
  label: string;
  viewId: InternalOperationsView;
};

export type EngineeringCoreFeature = {
  label: string;
  viewId?: InternalOperationsView;
  subFeatures?: readonly EngineeringSubFeature[];
};

export const ENGINEERING_SOPS_SUB_FEATURES: readonly EngineeringSubFeature[] = [
  { label: "Dashboard", viewId: "engineering-sops-dashboard" },
  { label: "SOP Library", viewId: "engineering-sops-library" },
  { label: "My Tasks", viewId: "engineering-sops-tasks" },
  { label: "Active Runs", viewId: "engineering-sops-runs" },
  { label: "Reviews & Approvals", viewId: "engineering-sops-reviews" },
  { label: "SOP Templates", viewId: "engineering-sops-templates" },
  { label: "Reports", viewId: "engineering-sops-reports" },
] as const;

export const ENGINEERING_CORE_FEATURES: readonly EngineeringCoreFeature[] = [
  { label: "Dashboard", viewId: "engineering-dashboard" },
  { label: "Programs & Milestones", viewId: "engineering-programs" },
  { label: "Team & Capacity", viewId: "engineering-capacity" },
  { label: "Risks", viewId: "engineering-risks" },
  { label: "Technical Files", viewId: "engineering-technical-files" },
  { label: "SOPs", subFeatures: ENGINEERING_SOPS_SUB_FEATURES },
] as const;

export const ENGINEERING_CUSTOM_FEATURES: readonly string[] = [];

export const ENGINEERING_CUSTOM_SUB_FEATURES: readonly string[] = [];

export function engineeringCoreFeatureCount(): number {
  return ENGINEERING_CORE_FEATURES.length;
}

export function engineeringCoreSubFeatureCount(): number {
  return ENGINEERING_CORE_FEATURES.reduce(
    (total, feature) => total + (feature.subFeatures?.length ?? 0),
    0,
  );
}
