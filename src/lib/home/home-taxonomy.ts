/**
 * Home — agreed product taxonomy (Core Module only).
 *
 * Verification-only formalisation. Home is the user's/workspace landing module.
 * It does not decompose into Core Features, Core Sub-features, Custom Features,
 * or Custom Sub-features — and dashboard tiles, role/access controls, and
 * workspace-specific landing content are implementation details, not taxonomy.
 *
 *   1 Core Module · 0 Core Features · 0 Core Sub-features · 0 Custom
 */

import type { InternalOperationsView } from "@/lib/internal-operations-data";

export const HOME_MODULE_ID = "home" as const;

export const HOME_MODULE_LABEL = "Home" as const;

/** Existing platform view id for the Home landing surface — unchanged. */
export const HOME_VIEW_ID = "home" as const satisfies InternalOperationsView;

export const HOME_CORE_FEATURES: readonly string[] = [];

export const HOME_CORE_SUB_FEATURES: readonly string[] = [];

export const HOME_CUSTOM_FEATURES: readonly string[] = [];

export const HOME_CUSTOM_SUB_FEATURES: readonly string[] = [];

export function homeCoreFeatureCount(): number {
  return HOME_CORE_FEATURES.length;
}

export function homeCoreSubFeatureCount(): number {
  return HOME_CORE_SUB_FEATURES.length;
}
