import {
  getOnwardAirBoardInsightsTool,
  getOnwardAirExecutiveBriefingTool,
  getOnwardAirOrgHealthTool,
  queryOnwardAirActionsTool,
  queryOnwardAirModuleTool,
  queryOnwardAirProjectPortfolioTool,
} from "@/lib/ai-operating-assistant/onwardair-executive-tools";

import type { EaPackToolHandler } from "../handlers-registry";

export const onwardAirPackToolHandlers: Record<string, EaPackToolHandler> = {
  "onwardair.getExecutiveBriefing": getOnwardAirExecutiveBriefingTool,
  "onwardair.getOrgHealth": getOnwardAirOrgHealthTool,
  "onwardair.queryActions": queryOnwardAirActionsTool,
  "onwardair.getBoardInsights": getOnwardAirBoardInsightsTool,
  "onwardair.queryModule": queryOnwardAirModuleTool,
  "onwardair.queryProjectPortfolio": queryOnwardAirProjectPortfolioTool,
};
