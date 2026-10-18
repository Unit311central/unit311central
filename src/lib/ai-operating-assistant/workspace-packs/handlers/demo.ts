import {
  generateMotionStudioTool,
  MOTION_STUDIO_TOOL_NAME,
} from "@/lib/motion-studio/motion-studio-tool";
import {
  getNorthstarBoardInsightsTool,
  getNorthstarExecutiveBriefingTool,
  getNorthstarOrgHealthTool,
  queryNorthstarActionsTool,
  queryNorthstarModuleTool,
} from "@/lib/ai-operating-assistant/northstar-executive-tools";

import type { EaPackToolHandler } from "../handlers-registry";

export const demoPackToolHandlers: Record<string, EaPackToolHandler> = {
  [MOTION_STUDIO_TOOL_NAME]: generateMotionStudioTool,
  "northstar.getExecutiveBriefing": getNorthstarExecutiveBriefingTool,
  "northstar.getOrgHealth": getNorthstarOrgHealthTool,
  "northstar.queryActions": queryNorthstarActionsTool,
  "northstar.getBoardInsights": getNorthstarBoardInsightsTool,
  "northstar.queryModule": queryNorthstarModuleTool,
};
