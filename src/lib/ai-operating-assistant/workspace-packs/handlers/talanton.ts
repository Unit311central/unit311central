import {
  getTalantonBoardInsightsTool,
  getTalantonExecutiveBriefingTool,
  getTalantonOrgHealthTool,
  generateTalantonStoriesLessonsPdfTool,
  generateTalantonStoriesReportTool,
  queryTalantonActionsTool,
  queryTalantonFundsTool,
  queryTalantonImpactTool,
  queryTalantonPortfolioTool,
  queryTalantonStoriesTool,
} from "@/lib/ai-operating-assistant/talanton-executive-tools";

import type { EaPackToolHandler } from "../handlers-registry";

export const talantonPackToolHandlers: Record<string, EaPackToolHandler> = {
  "talanton.getExecutiveBriefing": getTalantonExecutiveBriefingTool,
  "talanton.getOrgHealth": getTalantonOrgHealthTool,
  "talanton.queryActions": queryTalantonActionsTool,
  "talanton.getBoardInsights": getTalantonBoardInsightsTool,
  "talanton.queryPortfolio": queryTalantonPortfolioTool,
  "talanton.queryFunds": queryTalantonFundsTool,
  "talanton.queryImpact": queryTalantonImpactTool,
  "talanton.queryStories": queryTalantonStoriesTool,
  "talanton.generateStoriesReport": generateTalantonStoriesReportTool,
  "talanton.generateStoriesLessonsPdf": generateTalantonStoriesLessonsPdfTool,
};
