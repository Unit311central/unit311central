import { isEaGeneralIntentMode } from "./ea-general-mode";
import type { OrchestrationRoute } from "./orchestration-route";

/** Open business reads defer to the model in real EA mode (getOrgContext / queryBusiness via tools). */
export function assertOpenBusinessReadRoute(
  route: OrchestrationRoute,
  legacyTool = "queryBusiness",
): void {
  if (isEaGeneralIntentMode()) {
    if (route.kind !== "none") {
      throw new Error(`real EA: expected orchestration none, got ${route.kind}`);
    }
    return;
  }
  if (route.kind !== "tool" || route.intent.tool !== legacyTool) {
    throw new Error(`expected ${legacyTool}, got ${JSON.stringify(route)}`);
  }
}
