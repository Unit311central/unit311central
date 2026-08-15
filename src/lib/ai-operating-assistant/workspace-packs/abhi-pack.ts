/**
 * ABHI workspace EA pack.
 */

import { resolveAbhiBoardPackIntent } from "@/lib/abhi/board-pack-intent";
import { resolveAbhiEaPdfIntent } from "@/lib/abhi/ea-pdf-intents";
import { resolveAbhiExecutiveIntelligenceIntent } from "@/lib/abhi/executive-intelligence-intent";
import { resolveAbhiLmsCourseIntent } from "@/lib/abhi/lms-course-intent";
import { buildAbhiLeaveRequests } from "@/lib/abhi-hr-leave";
import { buildAbhiPerformanceReviews } from "@/lib/abhi-hr-performance";
import { buildAbhiRecruitmentVacancies } from "@/lib/abhi-hr-recruitment";
import {
  isAbhiSlug,
  isBrowserAbhiSurface,
} from "@/lib/abhi-surface";
import { getAbhiNavSections } from "@/lib/internal-role-views";
import { buildProjectPortfolioHealthIntent } from "@/lib/ai-operating-assistant/project-portfolio-health-intent";
import type { EaSynthesisContext } from "@/lib/ai-operating-assistant/ea-llm-synthesis";

import { packLmsCourseRoute, packToolRoute } from "./orchestration-helpers";
import {
  EA_DEFAULT_SYNTHESIS_GUIDANCE,
  EA_PROJECT_PORTFOLIO_GUIDANCE,
} from "./synthesis-guidance";
import type { EaWorkspacePack } from "./types";

const ABHI_LLM_SYNTHESIS_TOOLS = new Set([
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

const ABHI_TOOLS_HINT = `
ABHI — reporting currency is GBP. Use membership / HealthTech industry language (not Talanton portfolio or OnwardAir aviation).
Platform structure: listPlatformModules / searchApplications know every ABHI sidebar module and subsection — ABHI Intelligence (Member + Regulatory), Business Central (Members), Financials, Board, Marketing & Events, HR, Training, QMS, etc.
Executive intelligence tools (prefer for briefing, health, actions, board Q&A):
- abhi.getExecutiveBriefing — Chief-of-Staff overview across financial, commercial, governance
- abhi.getOrgHealth — RAG health across financial, commercial, operational, governance
- abhi.queryActions — overdue / due this week / by owner board actions
- abhi.getBoardInsights — risks, decisions, sponsorship, WHX, financial, agenda (analysis only — not a PDF)
Document tools: boardpack.generate — ABHI board meeting pack PDF + PowerPoint (cover, exec summary, actions, risks, KPIs, financials, commercial, team, strategic discussion); lms.generateCourseFromDocument — training from uploaded policies.
For module navigation (“where is …”) always use searchApplications. For live figures use queryBusiness / getCashPosition with ABHI financial fixtures (£1M cash, membership AR, burn).

CONVERSATIONAL STANDARD (ABHI — every message is valid):
- Never say “invalid question”, “I can’t answer that”, or stop at “not connected” / “no data”. Always respond as ABHI’s Chief-of-Staff.
- For any question: call the best tools (abhi executive tools, searchApplications, listPlatformModules, queryBusiness, getCashPosition) and synthesise one helpful answer in plain English.
- Lead with the direct answer, then supporting facts, then a practical next step or navigation link.
- If detail is thin in one module, combine catalogue navigation with executive briefing / queryBusiness context — do not dead-end.
- For writes you cannot execute instantly, explain what happens in ABHI and offer to open the right module — never refuse outright.`;

export const abhiWorkspacePack: EaWorkspacePack = {
  id: "abhi",
  label: "ABHI",
  matchesSlug: isAbhiSlug,
  matchesBrowserSurface: isBrowserAbhiSurface,
  clientSupportsBoardPack: true,
  navProvider: () => getAbhiNavSections(),
  promptExtensions: () => ({
    systemHint: ABHI_TOOLS_HINT,
    reportingCurrency: "GBP",
  }),
  orgState: {
    requestField: "abhiOrgState",
    label: "ABHI org state",
    matchesBrowserSurface: isBrowserAbhiSurface,
    collectClientState: () => {
      if (typeof window === "undefined") return null;
      const { getAbhiBoardMeetingsState } =
        require("@/lib/abhi/board-meetings-store") as typeof import("@/lib/abhi/board-meetings-store");
      const { getAbhiRiskRegisterState } =
        require("@/lib/abhi/risk-register-store") as typeof import("@/lib/abhi/risk-register-store");
      return {
        meetings: getAbhiBoardMeetingsState(),
        risks: getAbhiRiskRegisterState(),
      };
    },
  },
  artifactBranding: {
    workspacePrefix: ({ slug }) => (slug === "abhi" ? "ABHI" : "Organisation"),
  },
  operationalDataProvider: {
    loadLeaveRequests: () => buildAbhiLeaveRequests(),
    loadPerformanceReviews: () => buildAbhiPerformanceReviews(),
    loadVacancies: () => buildAbhiRecruitmentVacancies(),
    loadCandidates: () => [],
  },
  unsupportedWriteMessage: (registered) =>
    [
      "I can take care of that through the right ABHI module — here’s the fastest path:",
      "",
      "Registered actions I can run for you today:",
      registered,
      "",
      "Tell me which member, project, or module to use and I’ll proceed — or ask me to open the screen.",
    ].join("\n"),
  synthesisRules: [
    {
      id: "abhi-llm-synthesis-tools",
      matches: (ctx: EaSynthesisContext) => ABHI_LLM_SYNTHESIS_TOOLS.has(ctx.toolName),
      guidance: EA_DEFAULT_SYNTHESIS_GUIDANCE,
    },
    {
      id: "abhi-project-portfolio",
      matches: (ctx: EaSynthesisContext) => ctx.toolName === "abhi.queryProjectPortfolio",
      guidance: EA_PROJECT_PORTFOLIO_GUIDANCE,
    },
  ],
  intentResolvers: [
    ({ message }) => {
      const portfolioHealth = buildProjectPortfolioHealthIntent(
        message,
        "abhi.queryProjectPortfolio",
        "abhi_project_portfolio_health",
      );
      if (portfolioHealth) return packToolRoute(portfolioHealth);
      return null;
    },
    ({ message }) => {
      const execIntel = resolveAbhiExecutiveIntelligenceIntent(message);
      if (execIntel) return packToolRoute(execIntel);
      return null;
    },
    ({ message }) => {
      const abhiPdf = resolveAbhiEaPdfIntent(message);
      if (abhiPdf) return packToolRoute(abhiPdf);
      return null;
    },
    ({ message }) => {
      const boardPack = resolveAbhiBoardPackIntent(message);
      if (boardPack) return packToolRoute(boardPack);
      return null;
    },
    ({ message, business }) => {
      if (resolveAbhiLmsCourseIntent(message)) {
        return packLmsCourseRoute(business, "ABHI AI course generator from document");
      }
      return null;
    },
  ],
};
