/**
 * Shared helpers for workspace pack intent resolvers.
 */

import type { DirectAssistantIntent } from "@/lib/ai-operating-assistant/intent-router";
import type { OrchestrationRoute } from "@/lib/ai-operating-assistant/orchestration-route";
import type { AssistantBusinessContext } from "@/lib/ai-operating-assistant/types";

export function packToolRoute(
  intent: {
    tool: string;
    args: Record<string, unknown>;
    reason: string;
  },
): OrchestrationRoute {
  return {
    kind: "tool",
    intent: {
      tool: intent.tool as DirectAssistantIntent["tool"],
      args: intent.args,
      reason: intent.reason,
    },
  };
}

export function packLmsCourseRoute(
  business: AssistantBusinessContext,
  reason: string,
): OrchestrationRoute {
  return packToolRoute({
    tool: "lms.generateCourseFromDocument",
    args: {
      fileId: business.selection?.fileId ?? undefined,
      fileName: business.selection?.fileName ?? undefined,
      title: undefined,
    },
    reason,
  });
}
