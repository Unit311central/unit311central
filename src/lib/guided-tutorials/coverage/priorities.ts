import { isFinancesShellView } from "@/lib/finances-nav";

import type { TutorialCoverageStatus } from "./types";

export type TutorialCoveragePriority = "P0" | "P1" | "P2";

export type TutorialPresentationTier = "A" | "B" | "C";

const P0_MODULES = new Set([
  "home",
  "executive-assistant",
  "business-central",
  "sales-management",
  "intelligence",
  "financials",
]);

const P1_MODULES = new Set([
  "fundraising",
  "board",
  "corporate-information",
  "operations",
  "marketing-events",
  "technology-management",
  "human-resources",
  "business-productivity",
  "support-desk",
  "project-management",
  "settings",
]);

/** Frozen rich-media reference tutorials (workspace-independent tutorialId). */
const TIER_C_TUTORIAL_IDS = new Set([
  "financials.dashboard",
  "sales-management.commissions",
]);

const P0_TUTORIAL_IDS = new Set([
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
]);

export function resolveCoveragePriority(input: {
  moduleSlug: string;
}): TutorialCoveragePriority {
  if (P0_MODULES.has(input.moduleSlug)) return "P0";
  if (P1_MODULES.has(input.moduleSlug)) return "P1";
  return "P2";
}

export function resolvePresentationTier(input: {
  tutorialId: string;
  functionSlug: string;
  status: TutorialCoverageStatus;
}): TutorialPresentationTier {
  if (TIER_C_TUTORIAL_IDS.has(input.tutorialId)) return "C";
  if (input.status === "shell") return "A";
  if (P0_TUTORIAL_IDS.has(input.tutorialId)) return "B";
  if (input.functionSlug === "dashboard") return "A";
  return "B";
}

export function isShellCoverageView(viewId: string): boolean {
  return isFinancesShellView(viewId);
}
