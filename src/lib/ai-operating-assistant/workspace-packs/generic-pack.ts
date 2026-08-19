/**
 * Generic workspace EA pack — automatic Central EA for new/unknown workspaces.
 */

import { internalSurveyNavSections } from "@/lib/internal-operations-data";
import { injectIntelligenceNavIfMissing } from "@/lib/intelligence/nav";
import { bootstrapIntelligenceWorkspacePacks } from "@/lib/intelligence/workspace-packs";
import type { EaWorkspacePack } from "./types";
import { EA_DEFAULT_SYNTHESIS_GUIDANCE } from "./synthesis-guidance";

function matchesAnyWorkspace(slug: string | null | undefined): boolean {
  return Boolean(String(slug ?? "").trim());
}

export const genericWorkspacePack: EaWorkspacePack = {
  id: "generic",
  label: "Standard Workspace",
  matchesSlug: matchesAnyWorkspace,
  navProvider: (slug) => {
    bootstrapIntelligenceWorkspacePacks();
    return injectIntelligenceNavIfMissing(
      internalSurveyNavSections,
      slug ?? "generic",
    );
  },
  promptExtensions: () => ({
    systemHint: EA_DEFAULT_SYNTHESIS_GUIDANCE,
  }),
  synthesisRules: [
    {
      id: "generic-query-business",
      matches: (ctx) => ctx.toolName === "queryBusiness",
      guidance: EA_DEFAULT_SYNTHESIS_GUIDANCE,
    },
  ],
  defaultSuggestedPrompts: [
    "What is our bank balance?",
    "How many employees do we have?",
    "What are our overdue invoices?",
    "Create an invoice for a client",
  ],
};
