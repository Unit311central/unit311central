/**
 * Northstar Demo workspace EA pack — Chief-of-Staff executive tools + central EA.
 */

import { resolveAbhiBoardPackIntent } from "@/lib/abhi/board-pack-intent";
import { DEMO_WORKSPACE_SLUG } from "@/lib/app-domains";
import { isBrowserDemoSurface } from "@/lib/demo-enterprise";
import { resolveNorthstarExecutiveIntelligenceIntent } from "@/lib/demo/executive-intelligence-intent";
import { injectDemoNavSections } from "@/lib/demo/nav";
import { injectIntelligenceNavIfMissing } from "@/lib/intelligence/nav";
import { internalSurveyNavSections } from "@/lib/internal-operations-data";
import type { EaSynthesisContext } from "@/lib/ai-operating-assistant/ea-llm-synthesis";
import {
  EA_DEFAULT_SYNTHESIS_GUIDANCE,
  EA_SMART_INSIGHTS_HEALTH_GUIDANCE,
  matchesSmartInsightsHealthQuestion,
} from "@/lib/ai-operating-assistant/workspace-packs/synthesis-guidance";

import { packToolRoute } from "./orchestration-helpers";
import type { EaWorkspacePack } from "./types";

const DEMO_DEFAULT_PROMPTS = [
  "Why did margin fall?",
  "Which customers are at risk?",
  "What projects are over budget?",
  "What is our cash position?",
  "What are our top risks?",
  "Summarise our funding history",
  "Which supplier caused Atlas delays?",
  "Show pipeline by region",
] as const;

const DEMO_LLM_SYNTHESIS_TOOLS = new Set([
  "getOrgContext",
  "queryBusiness",
  "getCashPosition",
  "getSmartInsights",
  "searchInvoices",
  "searchClients",
  "searchCRM",
  "searchApplications",
  "listPlatformModules",
  "getDailyBrief",
  "northstar.getExecutiveBriefing",
  "northstar.getOrgHealth",
  "northstar.queryActions",
  "northstar.getBoardInsights",
  "northstar.queryModule",
]);

const NORTHSTAR_SYNTHESIS_MODULES = new Set(["engineering", "financials", "fundraising", "clients"]);

const NORTHSTAR_TOOLS_HINT = `
Northstar Industrial Technologies — reporting currency is GBP. Use industrial IoT / manufacturing / edge monitoring language (not ABHI membership, Talanton portfolio, or OnwardAir aviation).
Platform structure: listPlatformModules / searchApplications know every Northstar sidebar module — Business Central, Northstar Intelligence (Company / Client / Market), Financials, Fundraising, Board, Engineering, Operations, Marketing & Events, HR, Training, QMS, etc.
Executive intelligence tools (prefer for briefing, health, actions, board Q&A, module depth):
- northstar.getExecutiveBriefing — Chief-of-Staff overview across financial, commercial, delivery, governance
- northstar.getOrgHealth — RAG health across financial, commercial, operational, governance
- northstar.queryActions — overdue / due this week / by owner board actions
- northstar.getBoardInsights — risks, decisions, financial, engineering, clients (analysis only — not a PDF)
- northstar.queryModule — live read for financials, engineering, fundraising, grants, board, intelligence, clients, support, qms
Intelligence tools: intelligence.getBriefing / intelligence.searchRecords for Company, Client, and Market Intelligence domains.
Document tools: boardpack.generate — Northstar board pack PDF + PowerPoint (margin recovery, Atlas, Sheffield, cash runway).
For module navigation ("where is …") always use searchApplications. For any cross-domain executive question start with getOrgContext; also queryBusiness / getCashPosition for focused reads.

CONVERSATIONAL STANDARD (Northstar — every message is valid):
- Never say "invalid question", "I can't answer that", or stop at "not connected" / "no data". Always respond as Northstar's Chief-of-Staff.
- For any question: call the best tools (getOrgContext, northstar executive tools, intelligence.*, searchApplications, queryBusiness, getCashPosition) and synthesise one helpful answer in plain English.
- Lead with the direct answer, then supporting facts, then a practical next step or navigation link.
- If detail is thin in one module, combine catalogue navigation with executive briefing / queryModule context — do not dead-end.
- For writes you cannot execute instantly, explain what happens in Northstar and offer to open the right module — never refuse outright.`;

export const demoWorkspacePack: EaWorkspacePack = {
  id: "demo",
  label: "Northstar",
  matchesSlug: (slug) => String(slug ?? "").trim().toLowerCase() === DEMO_WORKSPACE_SLUG,
  matchesBrowserSurface: isBrowserDemoSurface,
  clientSupportsBoardPack: true,
  navProvider: () =>
    injectIntelligenceNavIfMissing(injectDemoNavSections(internalSurveyNavSections), DEMO_WORKSPACE_SLUG),
  promptExtensions: () => ({
    systemHint: NORTHSTAR_TOOLS_HINT,
    reportingCurrency: "GBP",
  }),
  artifactBranding: {
    workspacePrefix: ({ slug }) => (slug === DEMO_WORKSPACE_SLUG ? "Northstar" : "Organisation"),
  },
  proactiveInsightMapping: {
    resolveSnapshotDomain(raw, _workspaceSlug, defaultResolve) {
      const value = (raw || "all").toLowerCase();
      if (/fundraising|investor|seed\s+round|grant|pipeline/.test(value)) return "fundraising";
      if (/engineering|atlas|voltex|firmware|programme|program|delivery/.test(value)) return "engineering";
      if (/intelligence|competitor|senseforge|market|client/.test(value)) return "intelligence";
      return defaultResolve(raw);
    },
  },
  defaultSuggestedPrompts: DEMO_DEFAULT_PROMPTS,
  synthesisRules: [
    {
      id: "demo-northstar-query-module",
      matches: (ctx: EaSynthesisContext) => {
        if (ctx.toolName !== "northstar.queryModule") return false;
        const moduleId = String(ctx.toolArgs.module ?? "").trim();
        return NORTHSTAR_SYNTHESIS_MODULES.has(moduleId);
      },
      guidance: EA_DEFAULT_SYNTHESIS_GUIDANCE,
    },
    {
      id: "demo-northstar-executive-tools",
      matches: (ctx: EaSynthesisContext) =>
        ctx.toolName.startsWith("northstar.") && ctx.toolName !== "northstar.queryModule",
      guidance: EA_DEFAULT_SYNTHESIS_GUIDANCE,
    },
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
  intentResolvers: [
    ({ message }) => {
      const lower = message.toLowerCase();
      if (
        /\bpayroll\b/i.test(lower) &&
        (/\b(last|past|previous)\s+(\d+|six|6)\s+months?\b/i.test(lower) ||
          /\b(history|trend|month\s+by\s+month)\b/i.test(lower)) &&
        !/\b(pdf|export|download|report)\b/i.test(lower)
      ) {
        return packToolRoute({
          tool: "queryPayroll",
          args: { intent: "trend" },
          reason: "northstar_payroll_trend",
        });
      }
      return null;
    },
    ({ message }) => {
      const execIntel = resolveNorthstarExecutiveIntelligenceIntent(message);
      if (execIntel) return packToolRoute(execIntel);
      return null;
    },
    ({ message }) => {
      const boardPack = resolveAbhiBoardPackIntent(message);
      if (boardPack) return packToolRoute(boardPack);
      return null;
    },
  ],
  unsupportedWriteMessage: (registered) =>
    [
      "I can take care of that through the right Northstar module — here's the fastest path:",
      "",
      "Registered actions I can run for you today:",
      registered,
      "",
      "Tell me which client, programme, or module to use and I'll proceed — or ask me to open the screen.",
    ].join("\n"),
};
