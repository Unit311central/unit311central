/**
 * Board — agreed product taxonomy (Core Module → Core Features).
 *
 * Verification-only formalisation. Maps taxonomy levels to the EXISTING view IDs and routes —
 * it introduces no new routes, pages, navigation, components, permissions, or provisioning.
 *
 * Board is intentionally Core-Features-only: no Core Sub-features, and no Custom Features or
 * Custom Sub-features. Canonical taxonomy labels ("Board Deck", "Risk Register") may differ
 * from the existing implementation nav labels ("Board deck") and view IDs (e.g.
 * `corporate-risk-register`); the implementation identifiers are preserved unchanged.
 *
 *   1 Core Module · 6 Core Features · 0 Core Sub-features · 0 Custom
 */

import type { InternalOperationsView } from "@/lib/internal-operations-data";

export const BOARD_MODULE_ID = "board" as const;

export const BOARD_MODULE_LABEL = "Board" as const;

export type BoardCoreFeature = {
  /** Product taxonomy label (canonical). */
  label: string;
  /** Existing platform view id — unchanged. */
  viewId: InternalOperationsView;
};

/**
 * Six Core Features in agreed order.
 * - Board Members (`board-members`) is the canonical Board feature.
 * - `corporate-board-directors` is legacy/orphaned and deliberately excluded (see below).
 * - "Board Deck" is the canonical label; the implementation nav label remains "Board deck"
 *   and its view id remains `board-pack`.
 * - "Risk Register" is the canonical label; its view id remains `corporate-risk-register`.
 */
export const BOARD_CORE_FEATURES: readonly BoardCoreFeature[] = [
  { label: "Dashboard", viewId: "board-dashboard" },
  { label: "Meetings", viewId: "board-meetings" },
  { label: "Minutes & Decisions", viewId: "board-minutes" },
  { label: "Board Members", viewId: "board-members" },
  { label: "Board Deck", viewId: "board-pack" },
  { label: "Risk Register", viewId: "corporate-risk-register" },
] as const;

export const BOARD_CUSTOM_FEATURES: readonly string[] = [];
export const BOARD_CUSTOM_SUB_FEATURES: readonly string[] = [];

/** Legacy/orphaned Internal view that is NOT part of the canonical Board taxonomy. */
export const BOARD_EXCLUDED_VIEW_IDS = [
  "corporate-board-directors",
] as const satisfies readonly InternalOperationsView[];

export function boardCoreFeatureCount(): number {
  return BOARD_CORE_FEATURES.length;
}

export function boardCoreSubFeatureCount(): number {
  return 0;
}

export function getBoardCoreFeatureByViewId(viewId: string): BoardCoreFeature | undefined {
  return BOARD_CORE_FEATURES.find((feature) => feature.viewId === viewId);
}
