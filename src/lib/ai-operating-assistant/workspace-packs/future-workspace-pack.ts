/**
 * Test-only FutureWorkspaceX pack — proves central EA inheritance without central slug branches.
 * Registered only from ea-inheritance.check.ts (not production bootstrap).
 */

import { internalSurveyNavSections } from "@/lib/internal-operations-data";
import {
  EA_DEFAULT_SYNTHESIS_GUIDANCE,
  EA_SMART_INSIGHTS_HEALTH_GUIDANCE,
  matchesSmartInsightsHealthQuestion,
} from "@/lib/ai-operating-assistant/workspace-packs/synthesis-guidance";

import type { EaWorkspacePack } from "./types";

export const FUTURE_WORKSPACE_SLUG = "futureworkspacex";

const FUTURE_DEFAULT_PROMPTS = [
  "Summarise this page",
  "What needs attention?",
  "Draft an executive update",
  "Find related records",
] as const;

const FUTURE_LLM_SYNTHESIS_TOOLS = new Set([
  "queryBusiness",
  "getCashPosition",
  "getSmartInsights",
  "searchApplications",
  "getDailyBrief",
]);

export const futureWorkspacePack: EaWorkspacePack = {
  id: "futureworkspacex",
  label: "Future Workspace X",
  matchesSlug: (slug) => String(slug ?? "").trim().toLowerCase() === FUTURE_WORKSPACE_SLUG,
  navProvider: () => internalSurveyNavSections,
  defaultSuggestedPrompts: FUTURE_DEFAULT_PROMPTS,
  synthesisRules: [
    {
      id: "future-llm-synthesis-tools",
      matches: (ctx) => FUTURE_LLM_SYNTHESIS_TOOLS.has(ctx.toolName),
      guidance: EA_DEFAULT_SYNTHESIS_GUIDANCE,
    },
    {
      id: "future-smart-insights-health",
      matches: matchesSmartInsightsHealthQuestion,
      guidance: EA_SMART_INSIGHTS_HEALTH_GUIDANCE,
    },
  ],
};
