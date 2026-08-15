/**
 * Talanton Impact workspace EA pack.
 */

import { resolveAbhiBoardPackIntent } from "@/lib/abhi/board-pack-intent";
import { resolveAbhiLmsCourseIntent } from "@/lib/abhi/lms-course-intent";
import { getTalantonImpactNavSections } from "@/lib/internal-role-views";
import {
  buildTalantonLeaveRequests,
  buildTalantonPerformanceReviews,
} from "@/lib/talanton/hr-ops-data";
import { isTalantonImpactSlug, isBrowserTalantonImpactSurface } from "@/lib/talanton-surface";
import { resolveTalantonExecutiveIntelligenceIntent } from "@/lib/talanton/executive-intelligence-intent";
import {
  resolveTalantonStoriesRoute,
  resolveTalantonViewAwareTool,
} from "@/lib/talanton/executive-stories-intent";
import type { EaSynthesisContext } from "@/lib/ai-operating-assistant/ea-llm-synthesis";

import { packLmsCourseRoute, packToolRoute } from "./orchestration-helpers";
import {
  EA_DEFAULT_SYNTHESIS_GUIDANCE,
  EA_TALANTON_STORIES_GUIDANCE,
} from "./synthesis-guidance";
import type { EaWorkspacePack } from "./types";

const TALANTON_HOME_PROMPTS = [
  "Review today's priorities",
  "Summarise portfolio companies requiring attention",
  "Draft an impact briefing for the board",
  "What board actions are overdue?",
  "Explain cash position in USD",
] as const;

const TALANTON_BOARD_PACK_PROMPTS = [
  "Create Board Pack",
  "Summarise the next board meeting",
  "What are the open board actions?",
  "Highlight portfolio risks for the board",
] as const;

const TALANTON_TOOLS_HINT = `
Talanton Impact — reporting currency is USD. Never use ABHI, membership, WHX, or HealthTech industry language.
Executive intelligence tools (prefer these for portfolio, funds, impact, governance questions):
- talanton.getExecutiveBriefing — stewardship overview across portfolio, funds, impact, governance
- talanton.getOrgHealth — RAG health across portfolio, funds, impact, governance
- talanton.queryPortfolio — companies requiring attention, compliance/reporting gaps
- talanton.queryFunds — capital committed, deployed, available across funds
- talanton.queryImpact — jobs created, people served, impact health
- talanton.queryActions — open/overdue board & governance actions
- talanton.getBoardInsights — board discussion topics (not a PDF)
- talanton.queryStories — portfolio & journey impact story inventory and narrative summaries
- talanton.generateStoriesReport — PDF inventory catalogue of stories (sensible scope defaults)
- talanton.generateStoriesLessonsPdf — synthesised management lessons/themes from field stories as a Talanton PDF
Document tools: boardpack.generate — Talanton board deck PDF (10 slides: cover, exec summary, previous minutes, risk register, fund performance, portfolio summary, impact intelligence & external access, journey stories, training, strategic discussion & AOB); lms.generateCourseFromDocument — training from uploaded policies.
For generic cash/P&L also use queryBusiness / getCashPosition / generateScopedBusinessPdf / generateFinancialReportPdf. Execute story requests with sensible defaults — do not ask filter questionnaires unless execution is impossible.`;

export const talantonWorkspacePack: EaWorkspacePack = {
  id: "talanton",
  label: "Talanton Impact",
  matchesSlug: isTalantonImpactSlug,
  matchesBrowserSurface: isBrowserTalantonImpactSurface,
  clientSupportsBoardPack: true,
  navProvider: () => getTalantonImpactNavSections(),
  promptExtensions: () => ({
    systemHint: TALANTON_TOOLS_HINT,
    reportingCurrency: "USD",
  }),
  orgState: {
    requestField: "talantonOrgState",
    label: "Talanton org state",
    matchesBrowserSurface: isBrowserTalantonImpactSurface,
    collectClientState: () => {
      if (typeof window === "undefined") return null;
      const { getTalantonGovernanceSnapshot } =
        require("@/lib/talanton/governance-store") as typeof import("@/lib/talanton/governance-store");
      const { getTiRiskRegisterState } =
        require("@/lib/talanton/risk-register-store") as typeof import("@/lib/talanton/risk-register-store");
      return {
        governance: getTalantonGovernanceSnapshot(),
        risks: getTiRiskRegisterState(),
      };
    },
  },
  artifactBranding: {
    workspacePrefix: ({ slug }) =>
      slug === "talantonimpact" ? "Talanton Impact" : "Organisation",
  },
  operationalDataProvider: {
    loadLeaveRequests: () => buildTalantonLeaveRequests(),
    loadPerformanceReviews: () => buildTalantonPerformanceReviews(),
  },
  defaultSuggestedPrompts: TALANTON_HOME_PROMPTS,
  suggestedPromptsByView: {
    home: { label: "Home", suggestedPrompts: [...TALANTON_HOME_PROMPTS] },
    "executive-assistant": {
      label: "Executive Assistant",
      suggestedPrompts: [...TALANTON_HOME_PROMPTS],
    },
    "board-pack": { label: "Board Pack", suggestedPrompts: [...TALANTON_BOARD_PACK_PROMPTS] },
    "board-meetings": {
      label: "Board Meetings",
      suggestedPrompts: [...TALANTON_BOARD_PACK_PROMPTS],
    },
    "board-dashboard": {
      label: "Board Dashboard",
      suggestedPrompts: [...TALANTON_BOARD_PACK_PROMPTS],
    },
    "board-minutes": {
      label: "Board Minutes",
      suggestedPrompts: [...TALANTON_BOARD_PACK_PROMPTS],
    },
    "board-members": {
      label: "Board Members",
      suggestedPrompts: [...TALANTON_BOARD_PACK_PROMPTS],
    },
    "corporate-risk-register": {
      label: "Risk Register",
      suggestedPrompts: [...TALANTON_BOARD_PACK_PROMPTS],
    },
  },
  proactiveInsightMapping: {
    resolveSnapshotDomain(raw, workspaceSlug, defaultResolve) {
      const value = (raw || "all").toLowerCase();
      if (
        isTalantonImpactSlug(workspaceSlug) &&
        /\b(portfolio\s+compan|holdings?|fund|impact|governance|stewardship)\b/.test(value)
      ) {
        return "overview";
      }
      const resolved = defaultResolve(raw);
      if (resolved === "projects" && /\bportfolio\b/.test(value)) {
        return "overview";
      }
      return resolved;
    },
  },
  synthesisRules: [
    {
      id: "talanton-stories",
      matches: (ctx: EaSynthesisContext) =>
        isTalantonImpactSlug(ctx.workspaceSlug) && ctx.toolName === "talanton.queryStories",
      guidance: EA_TALANTON_STORIES_GUIDANCE,
    },
    {
      id: "talanton-llm-tools",
      matches: (ctx: EaSynthesisContext) =>
        isTalantonImpactSlug(ctx.workspaceSlug) &&
        ["queryBusiness", "getCashPosition", "getDailyBrief"].includes(ctx.toolName),
      guidance: EA_DEFAULT_SYNTHESIS_GUIDANCE,
    },
  ],
  intentResolvers: [
    ({ message, business }) => {
      const viewTool = resolveTalantonViewAwareTool(message, business.page.activeView);
      if (viewTool) return packToolRoute(viewTool);
      return null;
    },
    ({ message, business }) => {
      const storiesRoute = resolveTalantonStoriesRoute(message, business.page.activeView);
      if (storiesRoute?.kind === "clarify") {
        return {
          kind: "need_info",
          message: storiesRoute.message,
          actionId: "talanton.storiesScope",
          missingFields: ["companies", "categories"],
          input: {},
          executionCards: [],
        };
      }
      if (storiesRoute?.kind === "tool") {
        return packToolRoute(storiesRoute);
      }
      return null;
    },
    ({ message }) => {
      const execIntel = resolveTalantonExecutiveIntelligenceIntent(message);
      if (execIntel) return packToolRoute(execIntel);
      return null;
    },
    ({ message }) => {
      const boardPack = resolveAbhiBoardPackIntent(message);
      if (boardPack) {
        return packToolRoute({
          ...boardPack,
          reason: "Talanton Impact board pack generation",
        });
      }
      return null;
    },
    ({ message, business }) => {
      if (resolveAbhiLmsCourseIntent(message)) {
        return packLmsCourseRoute(
          business,
          "Talanton Impact AI course generator from document",
        );
      }
      return null;
    },
  ],
};
