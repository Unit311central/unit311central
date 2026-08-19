import { isEaGeneralIntentMode } from "./ea-general-mode";
import type { OrchestrationRoute } from "./orchestration-route";

/** Open business reads must resolve deterministically via the central semantic model. */
export function assertOpenBusinessReadRoute(
  route: OrchestrationRoute,
  legacyTool = "queryBusiness",
): void {
  if (isEaGeneralIntentMode()) {
    const deterministicSemantic =
      route.kind === "semantic_answer" ||
      (route.kind === "tool" && Boolean(route.capabilityId) && route.deterministic !== false);
    if (deterministicSemantic) return;
    if (route.kind === "none") return;
    throw new Error(
      `real EA: expected deterministic semantic route or none, got ${route.kind}`,
    );
  }
  if (route.kind !== "tool" || route.intent.tool !== legacyTool) {
    throw new Error(`expected ${legacyTool}, got ${JSON.stringify(route)}`);
  }
}
