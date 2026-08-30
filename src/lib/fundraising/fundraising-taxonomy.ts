/**
 * Fundraising — agreed product taxonomy (Core Module → Core Features → Core Sub-features).
 *
 * Verification-only formalisation. Maps taxonomy levels to the EXISTING view IDs, routes,
 * and GrantsWorkspace dashboard sections — it does not introduce new routes or pages.
 *
 *   1 Core Module · 8 Core Features · 5 Core Sub-features · 0 Custom
 */

import type { InternalOperationsView } from "@/lib/internal-operations-data";

export const FUNDRAISING_MODULE_ID = "fundraising" as const;

export const FUNDRAISING_MODULE_LABEL = "Fundraising" as const;

/** GrantsWorkspace `DashboardSection` keys — preserved implementation identifiers. */
export type GrantManagementSectionId =
  | "kpis"
  | "pipelineChart"
  | "programmeChart"
  | "submissionsChart"
  | "applicationsTable";

export type FundraisingCoreFeature = {
  /** Product taxonomy label (canonical). */
  label: string;
  /** Existing platform view id — unchanged. */
  viewId: InternalOperationsView;
  /** Core Sub-features under Grant Management only. */
  subFeatures?: readonly {
    label: string;
    sectionId: GrantManagementSectionId;
  }[];
};

/**
 * Eight Core Features in agreed order. Grant Management is the only feature with
 * formal Core Sub-features (GrantsWorkspace dashboard sections).
 */
export const FUNDRAISING_CORE_FEATURES: readonly FundraisingCoreFeature[] = [
  { label: "Dashboard", viewId: "fundraising-dashboard" },
  { label: "Investors", viewId: "fundraising-investors" },
  { label: "Cap Table Management", viewId: "fundraising-cap-table" },
  { label: "Pipeline", viewId: "fundraising-pipeline" },
  { label: "Meetings", viewId: "fundraising-meetings" },
  { label: "Pitch Decks", viewId: "fundraising-pitch-decks" },
  { label: "Data Rooms", viewId: "fundraising-data-rooms" },
  {
    label: "Grant Management",
    viewId: "grants",
    subFeatures: [
      { label: "KPI Summary", sectionId: "kpis" },
      { label: "Pipeline by Status", sectionId: "pipelineChart" },
      { label: "Funding by Programme", sectionId: "programmeChart" },
      { label: "Submissions vs Approvals", sectionId: "submissionsChart" },
      { label: "Grant Applications", sectionId: "applicationsTable" },
    ],
  },
] as const;

export const FUNDRAISING_CUSTOM_FEATURES: readonly string[] = [];
export const FUNDRAISING_CUSTOM_SUB_FEATURES: readonly string[] = [];

/** Talanton-only views that must never appear in standard Fundraising taxonomy. */
export const FUNDRAISING_EXCLUDED_TALANTON_VIEW_IDS = [
  "funds-dashboard",
  "funds-impact",
  "funds-momentum",
  "funds-stewards",
  "funds-investors",
  "funds-commitments",
  "funds-performance",
  "portfolio-dashboard",
  "portfolio-directory",
  "portfolio-portal-overview",
] as const satisfies readonly InternalOperationsView[];

export function fundraisingCoreFeatureCount(): number {
  return FUNDRAISING_CORE_FEATURES.length;
}

export function fundraisingCoreSubFeatureCount(): number {
  return FUNDRAISING_CORE_FEATURES.reduce(
    (total, feature) => total + (feature.subFeatures?.length ?? 0),
    0,
  );
}

export function getFundraisingCoreFeatureByViewId(
  viewId: string,
): FundraisingCoreFeature | undefined {
  return FUNDRAISING_CORE_FEATURES.find((feature) => feature.viewId === viewId);
}
