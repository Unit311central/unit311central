import { isFinancesShellView } from "@/lib/finances-nav";

import type { TutorialCoverageStatus } from "./types";

export type TutorialCoveragePriority = "P0" | "P1" | "P2";

export type TutorialPresentationTier = "A" | "B" | "C";

const P0_MODULES = new Set([
  "Pins",
  "Business Central",
  "Sales Management",
  "OnwardAir Intelligence",
  "Finances",
]);

const P1_MODULES = new Set([
  "Fundraising",
  "Board",
  "Corporate Information",
  "Operations",
  "Marketing & Events",
  "Technology Management",
  "Human Resources",
  "Business Productivity",
  "Support Desk",
  "Project Management",
  "Settings",
]);

/** Tier C reference tutorials — frozen rich-media pattern. */
const TIER_C_IDENTITIES = new Set([
  "financials:",
  "sales-management:commissions",
]);

const P0_WORKFLOW_IDENTITIES = new Set([
  "crm:",
  "sales-management:pipeline",
  "sales-management:dashboard",
  "general-ledger:journal",
  "accounts-receivable:",
  "accounts-payable:",
  "wise:",
  "oa-competitor-intelligence:",
]);

function identityKey(viewId: string, tabKey?: string): string {
  return `${viewId}:${tabKey ?? ""}`;
}

export function resolveCoveragePriority(input: {
  moduleLabel: string;
  viewId: string;
  functionLabel: string;
  tabKey?: string;
}): TutorialCoveragePriority {
  if (P0_MODULES.has(input.moduleLabel)) {
    return "P0";
  }
  if (P1_MODULES.has(input.moduleLabel)) {
    return "P1";
  }
  return "P2";
}

export function resolvePresentationTier(input: {
  viewId: string;
  tabKey?: string;
  functionLabel: string;
  status: TutorialCoverageStatus;
}): TutorialPresentationTier {
  const key = identityKey(input.viewId, input.tabKey);

  if (TIER_C_IDENTITIES.has(key)) {
    return "C";
  }

  if (input.status === "shell") {
    return "A";
  }

  if (P0_WORKFLOW_IDENTITIES.has(key)) {
    return "B";
  }

  if (/^dashboard$/i.test(input.functionLabel.trim())) {
    return "A";
  }

  return "B";
}

export function isShellCoverageView(viewId: string): boolean {
  return isFinancesShellView(viewId);
}
