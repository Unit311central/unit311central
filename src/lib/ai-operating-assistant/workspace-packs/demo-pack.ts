/**
 * Demo workspace EA pack — inherits generic central EA behaviour.
 */

import { DEMO_WORKSPACE_SLUG } from "@/lib/app-domains";
import { isBrowserDemoSurface } from "@/lib/demo-enterprise";
import { injectIntelligenceNavIfMissing } from "@/lib/intelligence/nav";
import { internalSurveyNavSections } from "@/lib/internal-operations-data";
import {
  EA_DEFAULT_SYNTHESIS_GUIDANCE,
  EA_SMART_INSIGHTS_HEALTH_GUIDANCE,
  matchesSmartInsightsHealthQuestion,
} from "@/lib/ai-operating-assistant/workspace-packs/synthesis-guidance";

import type { EaWorkspacePack } from "./types";

const DEMO_DEFAULT_PROMPTS = [
  "Summarise this page",
  "What needs attention?",
  "Draft an executive update",
  "Find related records",
] as const;

const DEMO_LLM_SYNTHESIS_TOOLS = new Set([
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

export const demoWorkspacePack: EaWorkspacePack = {
  id: "demo",
  label: "Demo",
  matchesSlug: (slug) => String(slug ?? "").trim().toLowerCase() === DEMO_WORKSPACE_SLUG,
  matchesBrowserSurface: isBrowserDemoSurface,
  navProvider: () => injectIntelligenceNavIfMissing(internalSurveyNavSections, DEMO_WORKSPACE_SLUG),
  defaultSuggestedPrompts: DEMO_DEFAULT_PROMPTS,
  synthesisRules: [
    {
      id: "demo-llm-synthesis-tools",
      matches: (ctx) => DEMO_LLM_SYNTHESIS_TOOLS.has(ctx.toolName),
      guidance: EA_DEFAULT_SYNTHESIS_GUIDANCE,
    },
    {
      id: "demo-smart-insights-health",
      matches: matchesSmartInsightsHealthQuestion,
      guidance: EA_SMART_INSIGHTS_HEALTH_GUIDANCE,
    },
  ],
};
