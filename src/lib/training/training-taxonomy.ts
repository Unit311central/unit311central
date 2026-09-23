/**
 * Training — agreed product taxonomy (Core Module → Core Features → Core Sub-features).
 *
 * Central product only — Talanton portfolio / learning-library views are excluded.
 *
 *   1 Core Module · 3 Core Features · 6 Core Sub-features · 0 Custom
 */

import type { InternalOperationsView } from "@/lib/internal-operations-data";

export const TRAINING_MODULE_ID = "training" as const;

export const TRAINING_MODULE_LABEL = "Training" as const;

export type TrainingSubFeature = {
  label: string;
  viewId?: InternalOperationsView;
  /** Course Builder modes without distinct view ids. */
  modeId?: string;
};

export type TrainingCoreFeature = {
  label: string;
  viewId?: InternalOperationsView;
  subFeatures?: readonly TrainingSubFeature[];
};

export const TRAINING_CORE_FEATURES: readonly TrainingCoreFeature[] = [
  { label: "Dashboard", viewId: "training-dashboard" },
  {
    label: "Course Builder",
    viewId: "course-builder",
    subFeatures: [
      { label: "Document-to-course generation", modeId: "document-generation" },
      { label: "Manual course authoring", modeId: "manual-authoring" },
      { label: "Review & publication", modeId: "review-publication" },
    ],
  },
  {
    label: "Courses",
    subFeatures: [
      { label: "Staff Courses", viewId: "training" },
      { label: "External Courses", viewId: "training-external" },
      { label: "QMS Courses", viewId: "qms-training" },
    ],
  },
] as const;

/** Talanton / portfolio training surfaces — not Core Training taxonomy. */
export const TRAINING_EXCLUDED_VIEW_IDS = [
  "portfolio-courses",
  "portfolio-course-management",
  "learning-library",
  "funds-dashboard",
  "funds-impact",
  "funds-momentum",
  "funds-stewards",
  "funds-investors",
  "funds-commitments",
  "funds-performance",
] as const satisfies readonly InternalOperationsView[];

export const TRAINING_CUSTOM_FEATURES: readonly string[] = [];

export const TRAINING_CUSTOM_SUB_FEATURES: readonly string[] = [];

export function trainingCoreFeatureCount(): number {
  return TRAINING_CORE_FEATURES.length;
}

export function trainingCoreSubFeatureCount(): number {
  return TRAINING_CORE_FEATURES.reduce(
    (total, feature) => total + (feature.subFeatures?.length ?? 0),
    0,
  );
}
