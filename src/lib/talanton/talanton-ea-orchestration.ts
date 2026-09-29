/**
 * Deterministic Talanton EA routing — must run before central semantic / evidence plans
 * so portfolio, executive briefing, and field-stories PDF requests reach Talanton tools.
 */

import type { OrchestrationRoute } from "@/lib/ai-operating-assistant/orchestration-route";
import { packToolRoute } from "@/lib/ai-operating-assistant/workspace-packs/orchestration-helpers";
import type { AssistantBusinessContext } from "@/lib/ai-operating-assistant/types";
import { resolveAbhiBoardPackIntent } from "@/lib/abhi/board-pack-intent";
import { resolveTalantonExecutiveIntelligenceIntent } from "@/lib/talanton/executive-intelligence-intent";
import {
  resolveTalantonStoriesRoute,
  resolveTalantonViewAwareTool,
} from "@/lib/talanton/executive-stories-intent";
import { isTalantonImpactSlug } from "@/lib/talanton-surface";

export function resolveTalantonEarlyOrchestrationRoute(
  message: string,
  business: AssistantBusinessContext,
): OrchestrationRoute | null {
  if (!isTalantonImpactSlug(business.workspace.slug)) return null;

  const viewTool = resolveTalantonViewAwareTool(message, business.page.activeView);
  if (viewTool) return packToolRoute(viewTool);

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

  const execIntel = resolveTalantonExecutiveIntelligenceIntent(message);
  if (execIntel) return packToolRoute(execIntel);

  const boardPack = resolveAbhiBoardPackIntent(message);
  if (boardPack) {
    return packToolRoute({
      ...boardPack,
      reason: "Talanton Impact board pack generation",
    });
  }

  return null;
}
