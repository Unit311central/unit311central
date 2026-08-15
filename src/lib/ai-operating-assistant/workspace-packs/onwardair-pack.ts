/**
 * OnwardAir workspace EA pack.
 */

import { resolveAbhiBoardPackIntent } from "@/lib/abhi/board-pack-intent";
import { resolveAbhiLmsCourseIntent } from "@/lib/abhi/lms-course-intent";
import { getOnwardAirNavSections } from "@/lib/internal-role-views";
import { isOnwardAirSlug, isBrowserOnwardAirSurface } from "@/lib/onwardair-surface";
import { resolveOnwardAirExecutiveIntelligenceIntent } from "@/lib/onwardair/executive-intelligence-intent";
import type { EaSynthesisContext } from "@/lib/ai-operating-assistant/ea-llm-synthesis";
import { buildProjectPortfolioHealthIntent } from "@/lib/ai-operating-assistant/project-portfolio-health-intent";

import { packLmsCourseRoute, packToolRoute } from "./orchestration-helpers";
import {
  EA_DEFAULT_SYNTHESIS_GUIDANCE,
  EA_ONWARDAIR_ENGINEERING_GUIDANCE,
  EA_ONWARDAIR_FUNDRAISING_GUIDANCE,
  EA_PROJECT_PORTFOLIO_GUIDANCE,
} from "./synthesis-guidance";
import type { EaWorkspacePack } from "./types";

const ONWARDAIR_SYNTHESIS_MODULES = new Set(["engineering", "fundraising"]);

const ONWARDAIR_TOOLS_HINT = `
OnwardAir — reporting currency is USD. Use aviation / eVTOL / defence-logistics language (not ABHI membership or Talanton portfolio).
Platform structure: listPlatformModules / searchApplications know every OnwardAir sidebar module — Business Central, OnwardAir Intelligence, Financials, Fundraising, Board, Engineering, Operations, Marketing & Events, HR, Training, QMS, etc.
Executive intelligence tools (prefer for briefing, health, module questions, board Q&A):
- onwardair.getExecutiveBriefing — Chief-of-Staff overview across financial, programme, fundraising, governance
- onwardair.getOrgHealth — RAG health across financial, programme, fundraising, governance
- onwardair.queryActions — overdue / due this week / by owner board actions
- onwardair.getBoardInsights — risks, decisions, fundraising, engineering, financial (analysis only — not a PDF)
- onwardair.queryModule — live read for fundraising, engineering, board, intelligence, operations, business-central, etc.
Document tools: boardpack.generate — OnwardAir board deck (Vertex VTOL / FLEX Pod / Seed raise / cash runway); lms.generateCourseFromDocument — training from uploaded SOPs/policies.
For module navigation ("where is …") always use searchApplications. For generic cash/P&L also use queryBusiness / getCashPosition.

CONVERSATIONAL STANDARD (OnwardAir — every message is valid):
- Never say "invalid question", "I can't answer that", or stop at "not connected" / "no data". Always respond as OnwardAir's Chief-of-Staff.
- For any question: call the best tools (onwardair executive tools, searchApplications, listPlatformModules, queryBusiness, getCashPosition) and synthesise one helpful answer in plain English.
- Lead with the direct answer, then supporting facts, then a practical next step or navigation link.
- If detail is thin in one module, combine catalogue navigation with executive briefing / queryModule context — do not dead-end.`;

export const onwardAirWorkspacePack: EaWorkspacePack = {
  id: "onwardair",
  label: "OnwardAir",
  matchesSlug: isOnwardAirSlug,
  matchesBrowserSurface: isBrowserOnwardAirSurface,
  clientSupportsBoardPack: true,
  navProvider: () => getOnwardAirNavSections(),
  promptExtensions: () => ({
    systemHint: ONWARDAIR_TOOLS_HINT,
    reportingCurrency: "USD",
  }),
  artifactBranding: {
    workspacePrefix: ({ slug }) => (slug === "onwardair" ? "OnwardAir" : "Organisation"),
  },
  proactiveInsightMapping: {
    resolveSnapshotDomain(raw, _workspaceSlug, defaultResolve) {
      const value = (raw || "all").toLowerCase();
      if (/fundraising|investor|seed\s+raise|term\s+sheet|data\s+room/.test(value)) {
        return "fundraising";
      }
      if (/engineering|vtol|flex\s+pod|milestone|certification|programme|program/.test(value)) {
        return "engineering";
      }
      if (/competitor|intelligence|patent|evtols?/.test(value)) {
        return "intelligence";
      }
      return defaultResolve(raw);
    },
  },
  synthesisRules: [
    {
      id: "onwardair-query-module",
      matches: (ctx: EaSynthesisContext) => {
        if (ctx.toolName !== "onwardair.queryModule") return false;
        const moduleId = String(ctx.toolArgs.module ?? "").trim();
        return ONWARDAIR_SYNTHESIS_MODULES.has(moduleId);
      },
      guidance: (ctx) => {
        const moduleId = String(ctx.toolArgs.module ?? "").trim();
        if (moduleId === "engineering") return EA_ONWARDAIR_ENGINEERING_GUIDANCE;
        if (moduleId === "fundraising") return EA_ONWARDAIR_FUNDRAISING_GUIDANCE;
        return EA_DEFAULT_SYNTHESIS_GUIDANCE;
      },
    },
    {
      id: "onwardair-project-portfolio",
      matches: (ctx: EaSynthesisContext) => ctx.toolName === "onwardair.queryProjectPortfolio",
      guidance: EA_PROJECT_PORTFOLIO_GUIDANCE,
    },
    {
      id: "onwardair-llm-tools",
      matches: (ctx: EaSynthesisContext) =>
        ["queryBusiness", "getCashPosition", "getDailyBrief"].includes(ctx.toolName),
      guidance: EA_DEFAULT_SYNTHESIS_GUIDANCE,
    },
  ],
  intentResolvers: [
    ({ message }) => {
      const portfolioHealth = buildProjectPortfolioHealthIntent(
        message,
        "onwardair.queryProjectPortfolio",
        "onwardair_project_portfolio_health",
      );
      if (portfolioHealth) return packToolRoute(portfolioHealth);
      return null;
    },
    ({ message }) => {
      const execIntel = resolveOnwardAirExecutiveIntelligenceIntent(message);
      if (execIntel) return packToolRoute(execIntel);
      return null;
    },
    ({ message }) => {
      const boardPack = resolveAbhiBoardPackIntent(message);
      if (boardPack) {
        return packToolRoute({
          ...boardPack,
          reason: "OnwardAir board deck generation",
        });
      }
      return null;
    },
    ({ message, business }) => {
      if (resolveAbhiLmsCourseIntent(message)) {
        return packLmsCourseRoute(business, "OnwardAir AI course generator from document");
      }
      return null;
    },
  ],
};
