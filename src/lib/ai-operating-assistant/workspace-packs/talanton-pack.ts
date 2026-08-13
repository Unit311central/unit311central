/**
 * Talanton Impact workspace EA pack — Phase 1 registration only (behaviour unchanged).
 */

import { resolveAbhiBoardPackIntent } from "@/lib/abhi/board-pack-intent";
import { resolveAbhiLmsCourseIntent } from "@/lib/abhi/lms-course-intent";
import { getTalantonImpactNavSections } from "@/lib/internal-role-views";
import { isTalantonImpactSlug } from "@/lib/talanton-surface";
import { resolveTalantonExecutiveIntelligenceIntent } from "@/lib/talanton/executive-intelligence-intent";
import {
  resolveTalantonStoriesRoute,
  resolveTalantonViewAwareTool,
} from "@/lib/talanton/executive-stories-intent";
import type { EaSynthesisContext } from "@/lib/ai-operating-assistant/ea-llm-synthesis";
import { TALANTON_EXECUTIVE_TOOL_DEFINITIONS } from "@/lib/ai-operating-assistant/talanton-executive-tools";

import { packLmsCourseRoute, packToolRoute } from "./orchestration-helpers";
import type { EaWorkspacePack } from "./types";

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
  toolDefinitions: [...TALANTON_EXECUTIVE_TOOL_DEFINITIONS] as EaWorkspacePack["toolDefinitions"],
  navProvider: () => getTalantonImpactNavSections(),
  promptExtensions: () => ({
    systemHint: TALANTON_TOOLS_HINT,
    reportingCurrency: "USD",
  }),
  orgState: {
    requestField: "talantonOrgState",
    label: "Talanton org state",
  },
  artifactBranding: {
    workspacePrefix: ({ slug }) =>
      slug === "talantonimpact" ? "Talanton Impact" : "Organisation",
  },
  synthesisRules: [
    {
      id: "talanton-stories",
      matches: (ctx: EaSynthesisContext) =>
        isTalantonImpactSlug(ctx.workspaceSlug) && ctx.toolName === "talanton.queryStories",
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
