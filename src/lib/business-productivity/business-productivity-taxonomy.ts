/**
 * Business Productivity — agreed product taxonomy (Core Module → Core Features → Core Sub-features).
 *
 * Verification-only formalisation. Maps taxonomy levels to EXISTING view IDs and nav labels —
 * it does not introduce new routes, provisioning keys, or pages.
 *
 * Standard product: 1 Core Module · 9 Core Features · 3 Core Sub-features · 0 Custom
 *
 * File Explorer is a Core Feature with three Core Sub-features (not three additional Core Features).
 * Catalogue/provisioning lists eleven flat submodule leaves; workspace nav overlays (ABHI, OnwardAir,
 * Talanton, internal raw nav) may differ without redefining this canonical taxonomy.
 */

import type { InternalOperationsView } from "@/lib/internal-operations-data";

export const BUSINESS_PRODUCTIVITY_MODULE_ID = "business-productivity" as const;

export const BUSINESS_PRODUCTIVITY_MODULE_LABEL = "Business Productivity" as const;

export type BusinessProductivitySubFeature = {
  label: string;
  viewId: InternalOperationsView;
};

export type BusinessProductivityCoreFeature = {
  label: string;
  /** Omitted for nav-only group features (File Explorer). */
  viewId?: InternalOperationsView;
  subFeatures?: readonly BusinessProductivitySubFeature[];
};

/** Nine Core Features in central Business Productivity nav order. */
export const BUSINESS_PRODUCTIVITY_CORE_FEATURES: readonly BusinessProductivityCoreFeature[] = [
  { label: "Dashboard", viewId: "productivity-dashboard" },
  { label: "Content Studio", viewId: "content-studio" },
  { label: "Internal Work Packages", viewId: "internal-work-packages" },
  {
    label: "File Explorer",
    subFeatures: [
      { label: "Internal Files", viewId: "files-internal" },
      { label: "External Files", viewId: "files-external" },
      { label: "Client Explorer", viewId: "files-client" },
    ],
  },
  { label: "Email", viewId: "info-email" },
  { label: "Calendar", viewId: "calendar" },
  { label: "Messaging", viewId: "messaging" },
  { label: "Communications", viewId: "communications" },
  { label: "Whiteboard", viewId: "whiteboard" },
] as const;

export const BUSINESS_PRODUCTIVITY_CUSTOM_FEATURES: readonly string[] = [];

export const BUSINESS_PRODUCTIVITY_CUSTOM_SUB_FEATURES: readonly string[] = [];

/** Views excluded from the canonical Business Productivity taxonomy (owned elsewhere or legacy). */
export const BUSINESS_PRODUCTIVITY_EXCLUDED_VIEW_IDS = [
  "social",
  "management",
  "files",
] as const satisfies readonly InternalOperationsView[];

export function businessProductivityCoreFeatureCount(): number {
  return BUSINESS_PRODUCTIVITY_CORE_FEATURES.length;
}

export function businessProductivityCoreSubFeatureCount(): number {
  return BUSINESS_PRODUCTIVITY_CORE_FEATURES.reduce(
    (total, feature) => total + (feature.subFeatures?.length ?? 0),
    0,
  );
}

export function businessProductivityTaxonomyViewIds(): InternalOperationsView[] {
  const viewIds: InternalOperationsView[] = [];
  for (const feature of BUSINESS_PRODUCTIVITY_CORE_FEATURES) {
    if (feature.viewId) viewIds.push(feature.viewId);
    for (const sub of feature.subFeatures ?? []) {
      viewIds.push(sub.viewId);
    }
  }
  return viewIds;
}
