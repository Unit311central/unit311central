/**
 * Wave 1 — highest-value central Unit311Central product functions (P0).
 *
 * Ten central tutorials across core modules. Two were shipped earlier (Finances dashboard,
 * Sales Commissions); Wave 1 authoring completes the remaining eight P0 functions.
 *
 * Identity is workspace-independent: each tutorialId maps to one central product function
 * with a primary runtime binding; additional bindings may be added in the catalogue without
 * duplicating tutorial content.
 */

export const WAVE_1_TUTORIAL_IDS = [
  "home",
  "executive-assistant",
  "business-central.clients",
  "business-central.pipeline",
  "sales-management.dashboard",
  "sales-management.pipeline",
  "intelligence.competitor-intelligence",
  "financials.journal",
  "financials.accounts-receivable",
  "financials.wise",
] as const;

export type Wave1TutorialId = (typeof WAVE_1_TUTORIAL_IDS)[number];

/** Wave 1 tutorials that existed before this authoring batch (frozen reference content). */
export const WAVE_1_PREEXISTING_TUTORIAL_IDS = [
  "financials.dashboard",
  "sales-management.commissions",
] as const;

/** Newly authored in Wave 1 (all ten P0 central functions in WAVE_1_TUTORIAL_IDS). */
export const WAVE_1_NEWLY_AUTHORED_TUTORIAL_IDS = [...WAVE_1_TUTORIAL_IDS];
