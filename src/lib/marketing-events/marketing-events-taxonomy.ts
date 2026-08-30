/**
 * Marketing & Events — agreed product taxonomy (Core Module → Core Features).
 *
 * Verification-only formalisation. Maps taxonomy levels to EXISTING view IDs, routes,
 * and workspace nav labels — it does not introduce new routes or pages.
 *
 * Standard product: 1 Core Module · 7 Core Features · 0 Core Sub-features · 0 Custom
 *
 * ABHI workspace extension (not part of standard product counts):
 * four Custom Features under the same Marketing & Events Core Module (see ABHI_MARKETING_CUSTOM_FEATURES).
 */

import type { InternalOperationsView } from "@/lib/internal-operations-data";

export const MARKETING_EVENTS_MODULE_ID = "marketing-events" as const;

export const MARKETING_EVENTS_MODULE_LABEL = "Marketing & Events" as const;

/** ABHI-facing nav label for the Mailing List Core Feature (product taxonomy unchanged). */
export const MARKETING_EVENTS_ABHI_MAILING_LIST_LABEL = "Mailing List Management" as const;

export type MarketingEventsCoreFeature = {
  /** Product taxonomy label (canonical). */
  label: string;
  /** Existing platform view id — unchanged. */
  viewId: InternalOperationsView;
  /** Optional workspace-facing nav label override (e.g. ABHI). */
  abhiNavLabel?: string;
};

/**
 * Seven Core Features in central Marketing & Events nav order (flat leaves — no Core Sub-features).
 * Event Management workspace tabs are implementation UI, not taxonomy sub-features.
 */
export const MARKETING_EVENTS_CORE_FEATURES: readonly MarketingEventsCoreFeature[] = [
  { label: "Dashboard", viewId: "oa-marketing-dashboard" },
  { label: "Digital Newsletter", viewId: "marketing-newsletter" },
  { label: "External Events", viewId: "marketing-events" },
  { label: "Event Management", viewId: "marketing-event-management" },
  {
    label: "Mailing List",
    viewId: "marketing-mailing-list",
    abhiNavLabel: MARKETING_EVENTS_ABHI_MAILING_LIST_LABEL,
  },
  { label: "Client Stories", viewId: "portfolio-stories" },
  { label: "Social", viewId: "social" },
] as const;

export const MARKETING_EVENTS_CUSTOM_FEATURES: readonly string[] = [];

export const MARKETING_EVENTS_CUSTOM_SUB_FEATURES: readonly string[] = [];

export type AbhiMarketingCustomFeature = {
  label: string;
  viewId: InternalOperationsView;
};

/** ABHI-only Custom Features under Marketing & Events (not in central module catalogue). */
export const ABHI_MARKETING_CUSTOM_FEATURES: readonly AbhiMarketingCustomFeature[] = [
  { label: "ABHI Events", viewId: "marketing-abhi-events" },
  { label: "ABHI Working Groups", viewId: "marketing-working-groups" },
  { label: "ABHI US Accelerator", viewId: "marketing-us-accelerator" },
  { label: "ABHI Middle East Accelerator", viewId: "marketing-me-accelerator" },
] as const;

/** Standard Core Features exposed on ABHI (subset of central taxonomy — no Dashboard, no Client Stories). */
export const ABHI_MARKETING_CORE_FEATURE_VIEW_IDS = [
  "marketing-newsletter",
  "social",
  "marketing-events",
  "marketing-event-management",
  "marketing-mailing-list",
] as const satisfies readonly InternalOperationsView[];

const ABHI_MARKETING_CUSTOM_VIEW_IDS = new Set<string>(
  ABHI_MARKETING_CUSTOM_FEATURES.map((feature) => feature.viewId),
);

export function isAbhiMarketingCustomFeatureView(
  viewId: string | null | undefined,
): boolean {
  return ABHI_MARKETING_CUSTOM_VIEW_IDS.has(String(viewId ?? ""));
}

/** Views excluded from standard Marketing & Events taxonomy (hidden, orphaned, or Talanton-only). */
export const MARKETING_EVENTS_EXCLUDED_VIEW_IDS = [
  "marketing-training",
  "journey-stories",
  "stories-newsletter",
  "stories-media-library",
  "stories-mailing-list",
] as const satisfies readonly InternalOperationsView[];

export function marketingEventsCoreFeatureCount(): number {
  return MARKETING_EVENTS_CORE_FEATURES.length;
}

export function marketingEventsCoreSubFeatureCount(): number {
  return 0;
}

export function getMarketingEventsCoreFeatureByViewId(
  viewId: string,
): MarketingEventsCoreFeature | undefined {
  return MARKETING_EVENTS_CORE_FEATURES.find((feature) => feature.viewId === viewId);
}
