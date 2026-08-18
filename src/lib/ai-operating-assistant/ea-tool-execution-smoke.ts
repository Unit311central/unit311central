import { resolveOrchestrationRoute } from "./action-orchestration";
import { isEaGeneralIntentMode } from "./ea-general-mode";
import { assertOpenBusinessReadRoute } from "./ea-route-assertions";
import type { AssistantBusinessContext, AssistantChatMessage } from "./types";
import { executeAssistantTool, getOpenAIToolSchemas } from "./tool-service";

export type EaToolSmokeCase = {
  id: string;
  prompt: string;
  expectedTool?: string;
  /** Real EA defers open business reads to the model — assert none + tool availability. */
  realEaDefer?: boolean;
};

export async function runEaToolExecutionSmoke(input: {
  business: AssistantBusinessContext;
  cases: EaToolSmokeCase[];
}): Promise<Array<{ id: string; ok: boolean; error?: string }>> {
  const results: Array<{ id: string; ok: boolean; error?: string }> = [];
  const history: AssistantChatMessage[] = [];

  for (const testCase of input.cases) {
    try {
      const route = await resolveOrchestrationRoute(testCase.prompt, history, input.business);
      if (testCase.realEaDefer && isEaGeneralIntentMode()) {
        assertOpenBusinessReadRoute(route, testCase.expectedTool ?? "queryBusiness");
        const schemas = getOpenAIToolSchemas(input.business.workspace.slug ?? undefined);
        const names = new Set(schemas.map((schema) => schema.name));
        const required = testCase.expectedTool ?? "queryBusiness";
        if (
          !names.has(required) &&
          !names.has("getOrgContext") &&
          !names.has("queryBusiness")
        ) {
          throw new Error(`real EA missing ${required} / getOrgContext / queryBusiness tools`);
        }
        results.push({ id: testCase.id, ok: true });
        continue;
      }
      if (route.kind !== "tool") {
        throw new Error(`expected tool route, got ${route.kind}`);
      }
      if (testCase.expectedTool && route.intent.tool !== testCase.expectedTool) {
        throw new Error(`expected ${testCase.expectedTool}, got ${route.intent.tool}`);
      }

      if (route.intent.tool === "boardpack.generate") {
        process.env.EA_SKIP_BOARDPACK_STAGES = "1";
      }
      try {
        const result = await executeAssistantTool(
          route.intent.tool,
          route.intent.args ?? {},
          input.business,
        );
        const status = String((result as { status?: string }).status ?? "");
        if (status !== "ok" && status !== "partial") {
          throw new Error(`tool ${route.intent.tool} returned ${status}`);
        }
      } finally {
        if (route.intent.tool === "boardpack.generate") {
          delete process.env.EA_SKIP_BOARDPACK_STAGES;
        }
      }

      results.push({ id: testCase.id, ok: true });
    } catch (error) {
      results.push({
        id: testCase.id,
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return results;
}
