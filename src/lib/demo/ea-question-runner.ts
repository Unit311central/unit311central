/**
 * Run a single Northstar EA test question (orchestration + tool execution).
 */

import { resolveOrchestrationRoute } from "@/lib/ai-operating-assistant/action-orchestration";
import { resolveNorthstarEaDataRoute } from "@/lib/demo/northstar-ea-route-resolver";
import { executeAssistantTool } from "@/lib/ai-operating-assistant/tool-service";
import type { AssistantBusinessContext } from "@/lib/ai-operating-assistant/types";
import type { NorthstarEaTestQuestion } from "@/lib/demo/ea-module-test-bank";

export type NorthstarEaQuestionResult = {
  id: string;
  prompt: string;
  moduleLabel: string;
  subModuleLabel?: string;
  status: "pass" | "fail";
  routeKind: string;
  tool?: string;
  summary?: string;
  durationMs: number;
  error?: string;
};

const DEAD_END = [
  /waiting for live business data/i,
  /i don'?t have data/i,
  /cannot answer that/i,
  /not connected/i,
];

function extractSummary(result: unknown): string {
  if (!result || typeof result !== "object") return "";
  const row = result as Record<string, unknown>;
  const summary = row.summary as Record<string, unknown> | undefined;
  if (typeof summary?.message === "string") return summary.message;
  if (Array.isArray(row.items) && row.items[0] && typeof row.items[0] === "object") {
    const item = row.items[0] as Record<string, unknown>;
    if (typeof item.prose === "string") return item.prose;
    if (typeof item.headline === "string") return item.headline;
  }
  return "";
}

export async function runNorthstarEaTestQuestion(
  question: NorthstarEaTestQuestion,
  business: AssistantBusinessContext,
): Promise<NorthstarEaQuestionResult> {
  const t0 = Date.now();
  try {
    const deterministic = resolveNorthstarEaDataRoute(question.prompt);
    let tool: string | undefined;
    let args: Record<string, unknown> = {};
    let routeKind = "deterministic";

    if (deterministic) {
      tool = deterministic.tool;
      args = deterministic.args;
      if (question.viewId) args.viewId = question.viewId;
      if (question.subModuleLabel) args.pageLabel = question.subModuleLabel;
    } else {
      const route = await resolveOrchestrationRoute(question.prompt, [], business);
      routeKind = route.kind;
      if (route.kind === "tool") {
        tool = route.intent.tool;
        args = (route.intent.args ?? {}) as Record<string, unknown>;
      } else if (route.kind === "platform_answer" || route.kind === "capability_answer") {
        return {
          id: question.id,
          prompt: question.prompt,
          moduleLabel: question.moduleLabel,
          subModuleLabel: question.subModuleLabel,
          status: "pass",
          routeKind: route.kind,
          summary: "Catalogue/capability answer",
          durationMs: Date.now() - t0,
        };
      } else {
        throw new Error(`No tool route (${route.kind})`);
      }
    }

    if (!tool) throw new Error("No tool resolved");

    if (tool === "boardpack.generate") {
      process.env.EA_SKIP_BOARDPACK_STAGES = "1";
    }
    try {
      const result = await executeAssistantTool(tool, args, business);
      const status = String((result as { status?: string }).status ?? "");
      if (status !== "ok" && status !== "partial") {
        throw new Error(`Tool ${tool} returned ${status}`);
      }
      const summary = extractSummary(result);
      if (!summary.trim()) throw new Error("Empty tool summary");
      if (DEAD_END.some((pattern) => pattern.test(summary))) {
        throw new Error(`Dead-end response: ${summary.slice(0, 120)}`);
      }
      return {
        id: question.id,
        prompt: question.prompt,
        moduleLabel: question.moduleLabel,
        subModuleLabel: question.subModuleLabel,
        status: "pass",
        routeKind,
        tool,
        summary: summary.slice(0, 500),
        durationMs: Date.now() - t0,
      };
    } finally {
      if (tool === "boardpack.generate") delete process.env.EA_SKIP_BOARDPACK_STAGES;
    }
  } catch (error) {
    return {
      id: question.id,
      prompt: question.prompt,
      moduleLabel: question.moduleLabel,
      subModuleLabel: question.subModuleLabel,
      status: "fail",
      routeKind: "error",
      durationMs: Date.now() - t0,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
