/**
 * Deterministic ABHI EA routing — must run before central semantic / evidence plans
 * so executive briefing, board insights, and action queries reach ABHI tools.
 */

import { resolveAbhiBoardPackIntent } from "@/lib/abhi/board-pack-intent";
import { resolveAbhiExecutiveIntelligenceIntent } from "@/lib/abhi/executive-intelligence-intent";
import type { OrchestrationRoute } from "@/lib/ai-operating-assistant/orchestration-route";
import { packToolRoute } from "@/lib/ai-operating-assistant/workspace-packs/orchestration-helpers";
import type { AssistantBusinessContext } from "@/lib/ai-operating-assistant/types";
import { isAbhiSlug } from "@/lib/abhi-surface";

export function resolveAbhiEarlyOrchestrationRoute(
  message: string,
  business: AssistantBusinessContext,
): OrchestrationRoute | null {
  if (!isAbhiSlug(business.workspace.slug)) return null;

  const execIntel = resolveAbhiExecutiveIntelligenceIntent(message);
  if (execIntel) return packToolRoute(execIntel);

  const boardPack = resolveAbhiBoardPackIntent(message);
  if (boardPack) return packToolRoute(boardPack);

  return null;
}
