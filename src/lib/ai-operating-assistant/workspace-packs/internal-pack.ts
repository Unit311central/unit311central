/**
 * Internal Unit311 workspace EA pack — generic central EA (configuration-focused).
 */

import { internalSurveyNavSections } from "@/lib/internal-operations-data";
import {
  EA_DEFAULT_SYNTHESIS_GUIDANCE,
  EA_SMART_INSIGHTS_HEALTH_GUIDANCE,
  matchesSmartInsightsHealthQuestion,
} from "@/lib/ai-operating-assistant/workspace-packs/synthesis-guidance";

import type { EaWorkspacePack } from "./types";

const INTERNAL_SLUG = "unit311";

const INTERNAL_DEFAULT_PROMPTS = [
  "Summarise this page",
  "What needs attention?",
  "Draft an executive update",
  "Find related records",
] as const;

const INTERNAL_LLM_SYNTHESIS_TOOLS = new Set([
  "queryBusiness",
  "getCashPosition",
  "getSmartInsights",
  "searchInvoices",
  "searchClients",
  "searchCRM",
  "searchApplications",
  "listPlatformModules",
  "getDailyBrief",
]);

export const internalWorkspacePack: EaWorkspacePack = {
  id: "internal",
  label: "Unit311 Internal",
  matchesSlug: (slug) => String(slug ?? "").trim().toLowerCase() === INTERNAL_SLUG,
  navProvider: () => internalSurveyNavSections,
  defaultSuggestedPrompts: INTERNAL_DEFAULT_PROMPTS,
  synthesisRules: [
    {
      id: "internal-llm-synthesis-tools",
      matches: (ctx) => INTERNAL_LLM_SYNTHESIS_TOOLS.has(ctx.toolName),
      guidance: EA_DEFAULT_SYNTHESIS_GUIDANCE,
    },
    {
      id: "internal-smart-insights-health",
      matches: matchesSmartInsightsHealthQuestion,
      guidance: EA_SMART_INSIGHTS_HEALTH_GUIDANCE,
    },
  ],
};
