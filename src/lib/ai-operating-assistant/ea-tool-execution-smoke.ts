import { resolveOrchestrationRoute } from "./action-orchestration";
import type { AssistantBusinessContext, AssistantChatMessage } from "./types";
import { executeAssistantTool } from "./tool-service";

export type EaToolSmokeCase = {
  id: string;
  prompt: string;
  expectedTool?: string;
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
