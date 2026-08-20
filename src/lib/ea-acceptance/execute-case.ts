import { resolveOrchestrationRoute } from "@/lib/ai-operating-assistant/action-orchestration";
import { getReadCapability } from "@/lib/ai-operating-assistant/capabilities/read-registry";
import type { EaResponseBlock } from "@/lib/ai-operating-assistant/capabilities/types";
import { executeAssistantTool } from "@/lib/ai-operating-assistant/tool-service";
import type { AssistantBusinessContext } from "@/lib/ai-operating-assistant/types";
import type { AssistantToolResult } from "@/lib/ai-operating-assistant/tool-result";
import { getSemanticCapability } from "@/lib/central-application-model/registry";
import { executeSemanticCapability, executeEvidencePlan } from "@/lib/central-application-model/orchestrate";

import {
  acceptanceChecksPassed,
  formatFailedChecks,
  promptExpectsChart,
  runEaAcceptanceAssertions,
} from "./assertions";
import type { EaAcceptanceCaseInput, EaAcceptanceCaseResult, EaAcceptanceExecution } from "./types";

export type EaAcceptanceExecuteOptions = {
  /** Execute tools and validate live answers. Default true for API routes. */
  executeTools?: boolean;
};

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

function extractArtifactByteLength(result: unknown): number | undefined {
  if (!result || typeof result !== "object") return undefined;
  const summary = (result as { summary?: { byteLength?: number } }).summary;
  return typeof summary?.byteLength === "number" ? summary.byteLength : undefined;
}

function extractArtifactFromToolResults(results: AssistantToolResult[]): {
  toolResult?: AssistantToolResult;
  byteLength?: number;
} {
  for (let i = results.length - 1; i >= 0; i -= 1) {
    const bytes = extractArtifactByteLength(results[i]);
    if (bytes != null) return { toolResult: results[i], byteLength: bytes };
  }
  const last = results[results.length - 1];
  return last ? { toolResult: last } : {};
}

function mapQuestionKind(
  kind: EaAcceptanceCaseInput["kind"],
  prompt: string,
): EaAcceptanceCaseInput["kind"] {
  if (kind === "data" && promptExpectsChart(prompt)) return "chart";
  return kind;
}

export async function executeEaAcceptanceCase(
  question: EaAcceptanceCaseInput,
  business: AssistantBusinessContext,
  options: EaAcceptanceExecuteOptions = {},
): Promise<EaAcceptanceExecution> {
  const executeTools = options.executeTools !== false;
  const kind = mapQuestionKind(question.kind, question.prompt);
  const route = await resolveOrchestrationRoute(question.prompt, [], business);

  let tool: string | undefined;
  let capabilityId: string | undefined;
  let deterministic: boolean | undefined;
  let gptRequired = false;
  let text = "";
  let responseBlocks: EaResponseBlock[] | undefined;
  let toolResult: AssistantToolResult | undefined;
  let artifactByteLength: number | undefined;
  let evidencePlan: import("@/lib/central-application-model/types").EaEvidencePlan | undefined;
  let executed = false;

  try {
    if (route.kind === "semantic_answer") {
      text = route.message;
      responseBlocks = route.responseBlocks;
      capabilityId = route.capabilityId;
      deterministic = route.deterministic;
      executed = true;
    } else if (route.kind === "tool") {
      tool = route.intent.tool;
      capabilityId = route.capabilityId;
      deterministic = route.deterministic;

      if (executeTools) {
        const args = { ...(route.intent.args ?? {}) } as Record<string, unknown>;
        if (question.viewId) args.viewId = question.viewId;
        if (question.subModuleLabel) args.pageLabel = question.subModuleLabel;

        if (tool === "boardpack.generate") process.env.EA_SKIP_BOARDPACK_STAGES = "1";
        try {
          toolResult = (await executeAssistantTool(tool, args, business)) as AssistantToolResult;
          artifactByteLength = extractArtifactByteLength(toolResult);
          executed = true;

          const readCap = capabilityId ? getReadCapability(capabilityId) : null;
          const semanticCap = capabilityId ? getSemanticCapability(capabilityId) : null;
          const formatter = readCap ?? semanticCap;
          if (formatter?.formatAnswer) {
            const formatted = formatter.formatAnswer(toolResult, {
              message: question.prompt,
              business,
            });
            if (formatted?.text) text = formatted.text;
            if (formatted?.blocks) responseBlocks = formatted.blocks;
          }
          if (!text) text = extractSummary(toolResult);
        } finally {
          if (tool === "boardpack.generate") delete process.env.EA_SKIP_BOARDPACK_STAGES;
        }
      }
    } else if (route.kind === "semantic_capability") {
      const binding = getSemanticCapability(route.capabilityId);
      if (!binding) throw new Error(`Unknown semantic capability ${route.capabilityId}`);
      const semanticExecuted = await executeSemanticCapability(binding, {
        message: question.prompt,
        business,
      });
      capabilityId = semanticExecuted.capabilityId;
      deterministic = semanticExecuted.deterministic;
      text = semanticExecuted.answer.text;
      responseBlocks = semanticExecuted.answer.blocks;
      toolResult = semanticExecuted.toolResults[semanticExecuted.toolResults.length - 1];
      tool = binding.tool;
      artifactByteLength = extractArtifactByteLength(toolResult);
      executed = true;
    } else if (route.kind === "capability_answer" || route.kind === "platform_answer") {
      text = route.message;
    } else if (route.kind === "evidence_gpt") {
      gptRequired = true;
      evidencePlan = route.plan;
      if (executeTools) {
        const evidenceExecuted = await executeEvidencePlan(route.plan, {
          message: question.prompt,
          business,
        });
        capabilityId = evidenceExecuted.capabilityId;
        deterministic = evidenceExecuted.deterministic;
        text = evidenceExecuted.answer.text;
        responseBlocks = evidenceExecuted.answer.blocks;
        const artifactPick = extractArtifactFromToolResults(evidenceExecuted.toolResults);
        toolResult = artifactPick.toolResult ?? evidenceExecuted.toolResults[evidenceExecuted.toolResults.length - 1];
        tool = toolResult?.tool;
        artifactByteLength = artifactPick.byteLength;
        executed = true;
      } else {
        text = route.message;
      }
    } else if (route.kind === "need_info") {
      text = route.message;
    } else if (route.kind === "workflow_read") {
      text = route.message;
    } else if (route.kind === "none") {
      text = "";
    } else {
      text = "";
    }

    const checks = runEaAcceptanceAssertions({
      prompt: question.prompt,
      kind,
      routeKind: route.kind,
      capabilityId,
      tool,
      deterministic,
      gptRequired,
      text,
      responseBlocks,
      toolResult,
      artifactByteLength,
      expectTool: question.expectTool,
      expectCapabilityId: question.expectCapabilityId,
      expectDeterministic: question.expectDeterministic,
      executed,
    });

    return {
      route,
      routeKind: route.kind,
      capabilityId,
      tool,
      deterministic,
      gptRequired,
      evidencePlan,
      text,
      responseBlocks,
      toolResult,
      artifactByteLength,
      checks,
      status: acceptanceChecksPassed(checks) ? "pass" : "fail",
      error: acceptanceChecksPassed(checks) ? undefined : formatFailedChecks(checks),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const checks = runEaAcceptanceAssertions({
      prompt: question.prompt,
      kind,
      routeKind: route.kind,
      capabilityId,
      tool,
      deterministic,
      gptRequired,
      text,
      responseBlocks,
      toolResult,
      artifactByteLength,
      expectTool: question.expectTool,
      expectCapabilityId: question.expectCapabilityId,
      expectDeterministic: question.expectDeterministic,
      executed,
    });
    return {
      route,
      routeKind: route.kind,
      capabilityId,
      tool,
      deterministic,
      gptRequired,
      evidencePlan,
      text,
      responseBlocks,
      toolResult,
      artifactByteLength,
      checks,
      status: "fail",
      error: message,
    };
  }
}

export async function runEaAcceptanceCase(
  question: EaAcceptanceCaseInput,
  business: AssistantBusinessContext,
  options?: EaAcceptanceExecuteOptions,
): Promise<EaAcceptanceCaseResult> {
  const t0 = Date.now();
  const execution = await executeEaAcceptanceCase(question, business, options);
  return {
    id: question.id,
    prompt: question.prompt,
    moduleLabel: question.moduleLabel,
    subModuleLabel: question.subModuleLabel,
    status: execution.status,
    routeKind: execution.routeKind,
    capabilityId: execution.capabilityId,
    tool: execution.tool,
    deterministic: execution.deterministic,
    gptRequired: execution.gptRequired,
    summary: execution.text.slice(0, 500) || execution.error,
    checks: execution.checks,
    durationMs: Date.now() - t0,
    error: execution.error,
  };
}
