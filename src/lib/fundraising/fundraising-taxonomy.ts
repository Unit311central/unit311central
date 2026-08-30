/**
 * Fundraising — agreed product taxonomy (Core Module → Core Features → Core Sub-features).
 *
 * Verification-only formalisation. Maps taxonomy levels to the EXISTING view IDs, routes,
 * and workspace dashboard sections — it does not introduce new routes or pages.
 *
 *   1 Core Module · 8 Core Features · 9 Core Sub-features · 0 Custom
 */

import type { InternalOperationsView } from "@/lib/internal-operations-data";

export const FUNDRAISING_MODULE_ID = "fundraising" as const;

export const FUNDRAISING_MODULE_LABEL = "Fundraising" as const;

/** NorthstarCapTableWorkspace tab keys — preserved implementation identifiers. */
export type CapTableManagementSectionId =
  | "overview"
  | "shareholders"
  | "options"
  | "capital";

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
  /** Core Sub-features under Cap Table Management and Grant Management only. */
  subFeatures?: readonly {
    label: string;
    sectionId: CapTableManagementSectionId | GrantManagementSectionId;
  }[];
};

/**
 * Eight Core Features in agreed order. Cap Table Management and Grant Management are the
 * only features with formal Core Sub-features (existing workspace dashboard sections).
 */
export const FUNDRAISING_CORE_FEATURES: readonly FundraisingCoreFeature[] = [
  { label: "Dashboard", viewId: "fundraising-dashboard" },
  { label: "Investors", viewId: "fundraising-investors" },
  {
    label: "Cap Table Management",
    viewId: "fundraising-cap-table",
    subFeatures: [
      { label: "Overview", sectionId: "overview" },
      { label: "Shareholders", sectionId: "shareholders" },
      { label: "Option Pool", sectionId: "options" },
      { label: "Share Capital", sectionId: "capital" },
    ],
  },
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

/** OmniTransit presents Fundraising as Corporate Shareholding with this feature subset. */
export const FUNDRAISING_CORPORATE_SHAREHOLDING_FEATURE_VIEW_IDS = [
  "fundraising-dashboard",
  "fundraising-investors",
  "fundraising-cap-table",
] as const satisfies readonly InternalOperationsView[];

/** Fundraising Core Features excluded from OmniTransit Corporate Shareholding presentation. */
export const FUNDRAISING_CORPORATE_SHAREHOLDING_EXCLUDED_FEATURE_VIEW_IDS = [
  "fundraising-pipeline",
  "fundraising-meetings",
  "fundraising-pitch-decks",
  "fundraising-data-rooms",
  "grants",
] as const satisfies readonly InternalOperationsView[];

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
