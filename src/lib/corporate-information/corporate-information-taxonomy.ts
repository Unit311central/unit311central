/**
 * Corporate Information — agreed product taxonomy (Core Module → Core Features → Core Sub-features).
 *
 * Verification-only formalisation. Maps taxonomy levels to the EXISTING view IDs, routes,
 * tabs, and catalogue submodule keys — it does not introduce new routes or pages.
 *
 *   1 Core Module · 6 Core Features · 5 Core Sub-features · 0 Custom
 */

import type { InternalOperationsView } from "@/lib/internal-operations-data";

export const CORPORATE_INFORMATION_MODULE_ID = "corporate-information" as const;

export const CORPORATE_INFORMATION_MODULE_LABEL = "Corporate Information" as const;

/** ABHI-facing nav label for the Company Information Core Feature (product taxonomy unchanged). */
export const CORPORATE_INFORMATION_ABHI_COMPANY_LABEL = "Company Details" as const;

export type CorporateInformationCoreFeature = {
  /** Product taxonomy label (canonical). */
  label: string;
  /** Existing platform view id — unchanged. */
  viewId: InternalOperationsView;
  /** Optional workspace-facing nav label override (e.g. ABHI). */
  abhiNavLabel?: string;
  /** When present, the single Core Sub-feature under this Core Feature. */
  subFeature?: {
    label: string;
    /** CorporateInformationWorkspace tab key when applicable. */
    tab: string;
  };
};

/**
 * Six Core Features in agreed order. Dashboard has no sub-feature; the other five each
 * have exactly one Core Sub-feature mapped to the same view/tab implementation.
 */
export const CORPORATE_INFORMATION_CORE_FEATURES: readonly CorporateInformationCoreFeature[] = [
  {
    label: "Dashboard",
    viewId: "corporate-dashboard",
  },
  {
    label: "Company Information",
    viewId: "corporate-company-details",
    abhiNavLabel: CORPORATE_INFORMATION_ABHI_COMPANY_LABEL,
    subFeature: {
      label: "Company Profile / Legal Entity Records",
      tab: "company-details",
    },
  },
  {
    label: "Office Locations",
    viewId: "office-locations",
    subFeature: {
      label: "Office Directory & Locations",
      tab: "office-locations",
    },
  },
  {
    label: "Bank Accounts",
    viewId: "corporate-bank-accounts",
    subFeature: {
      label: "Corporate Banking Register",
      tab: "bank-accounts",
    },
  },
  {
    label: "Professional Advisors",
    viewId: "corporate-advisers",
    subFeature: {
      label: "Advisor / Firm Register",
      tab: "professional-advisors",
    },
  },
  {
    label: "Contracts",
    viewId: "corporate-contracts",
    subFeature: {
      label: "Contract Register",
      tab: "contracts",
    },
  },
] as const;

/** Views that must NOT appear under Corporate Information (split to Board / Fundraising). */
export const CORPORATE_INFORMATION_EXCLUDED_VIEW_IDS = [
  "corporate-cap-table",
  "corporate-board-directors",
  "board-meetings",
  "board-pack",
  "corporate-risk-register",
  "unit311-details",
  "module-go-live",
] as const satisfies readonly InternalOperationsView[];

export const CORPORATE_INFORMATION_CUSTOM_FEATURES: readonly string[] = [];
export const CORPORATE_INFORMATION_CUSTOM_SUB_FEATURES: readonly string[] = [];

export function corporateInformationCoreFeatureCount(): number {
  return CORPORATE_INFORMATION_CORE_FEATURES.length;
}

export function corporateInformationCoreSubFeatureCount(): number {
  return CORPORATE_INFORMATION_CORE_FEATURES.filter((feature) => feature.subFeature).length;
}
