/**
 * Talanton stories — EA intent routing, clarification, and view-aware defaults.
 */

import {
  buildStoriesClarificationMessage,
  isStoriesLessonsPdfRequest,
  isStoriesTopicMessage,
  needsStoriesScopeClarification,
  parseStoriesScopeFromMessage,
  wantsStoriesReportMessage,
} from "@/lib/talanton/executive-stories-intelligence";

export type TalantonStoriesTool =
  | "talanton.queryStories"
  | "talanton.generateStoriesReport"
  | "talanton.generateStoriesLessonsPdf";

export type TalantonStoriesRoute =
  | {
      kind: "clarify";
      message: string;
      followUpActions: Array<{ id: string; label: string; kind: "generate" }>;
    }
  | {
      kind: "tool";
      tool: TalantonStoriesTool;
      args: Record<string, unknown>;
      reason: string;
    };

const STORY_VIEWS = new Set([
  "portfolio-stories",
  "journey-stories",
  "stories-newsletter",
  "stories-media-library",
  "annual-impact-report",
  "quarterly-portfolio-update",
]);

const VIEW_TOOL_MAP: Record<string, { tool: string; reason: string }> = {
  "portfolio-intelligence-briefing": {
    tool: "talanton.queryPortfolio",
    reason: "talanton_view_portfolio_intelligence",
  },
  "portfolio-intelligence-company": {
    tool: "talanton.queryPortfolio",
    reason: "talanton_view_portfolio_company",
  },
  "impact-intelligence-dashboard": {
    tool: "talanton.queryImpact",
    reason: "talanton_view_impact_dashboard",
  },
  "impact-intelligence-company": {
    tool: "talanton.queryImpact",
    reason: "talanton_view_impact_company",
  },
  funds: { tool: "talanton.queryFunds", reason: "talanton_view_funds" },
  "board-portal": { tool: "talanton.getBoardInsights", reason: "talanton_view_board" },
  "board-minutes": { tool: "talanton.queryActions", reason: "talanton_view_board_actions" },
};

function isOpenPageQuestion(lower: string): boolean {
  return (
    /\b(summarise|summarize|summary|overview|what needs attention|what should i know|tell me about|explain this|status update|what's here)\b/.test(
      lower,
    ) && !/\b(create|generate|make|pdf|report|board pack)\b/.test(lower)
  );
}

function clarificationFollowUps() {
  return [
    {
      id: "fu_stories_all_pdf",
      label: "All companies, all impact areas, approved only, PDF",
      kind: "generate" as const,
    },
    {
      id: "fu_stories_all_narrative",
      label: "All companies, all impact areas, narrative summary",
      kind: "generate" as const,
    },
    {
      id: "fu_stories_jobs",
      label: "All companies, Jobs & Livelihoods only",
      kind: "generate" as const,
    },
  ];
}

export function resolveTalantonStoriesRoute(
  message: string,
  activeView?: string,
): TalantonStoriesRoute | null {
  const text = message.trim();
  if (!text) return null;

  const storyTopic = isStoriesTopicMessage(text) || (activeView && STORY_VIEWS.has(activeView));
  if (!storyTopic) return null;

  if (needsStoriesScopeClarification(text)) {
    return {
      kind: "clarify",
      message: buildStoriesClarificationMessage(),
      followUpActions: clarificationFollowUps(),
    };
  }

  const scope = parseStoriesScopeFromMessage(text, activeView);
  const args = {
    companyIds: scope.companyIds,
    storyTypes: scope.storyTypes,
    statusFilter: scope.statusFilter,
    categories: scope.categories,
    outputFormat: scope.outputFormat,
    question: text,
  };

  if (isStoriesLessonsPdfRequest(text)) {
    return {
      kind: "tool",
      tool: "talanton.generateStoriesLessonsPdf",
      args,
      reason: "talanton_stories_lessons_pdf",
    };
  }

  if (scope.outputFormat === "pdf" || wantsStoriesReportMessage(text)) {
    return {
      kind: "tool",
      tool: "talanton.generateStoriesReport",
      args,
      reason: "talanton_stories_report",
    };
  }

  return {
    kind: "tool",
    tool: "talanton.queryStories",
    args,
    reason: "talanton_stories_query",
  };
}

export function resolveTalantonViewAwareTool(
  message: string,
  activeView?: string,
): { tool: string; args: Record<string, unknown>; reason: string } | null {
  if (!activeView || !isOpenPageQuestion(message.toLowerCase())) return null;

  if (STORY_VIEWS.has(activeView)) {
    const stories = resolveTalantonStoriesRoute(message, activeView);
    if (stories?.kind === "tool") {
      return {
        tool: stories.tool,
        args: stories.args,
        reason: stories.reason,
      };
    }
    if (stories?.kind === "clarify") return null;
  }

  const mapped = VIEW_TOOL_MAP[activeView];
  if (!mapped) return null;

  return {
    tool: mapped.tool,
    args: { question: message.trim() },
    reason: mapped.reason,
  };
}
