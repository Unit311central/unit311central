/**
 * Multi-capability and evidence orchestration.
 */

import { executeAssistantTool } from "@/lib/ai-operating-assistant/tool-service";
import type { AssistantBusinessContext } from "@/lib/ai-operating-assistant/types";
import type { AssistantToolResult } from "@/lib/ai-operating-assistant/tool-result";
import { normalizeEaMessage } from "@/lib/ai-operating-assistant/capabilities/message-normalize";

import type { EaSemanticCapabilityBinding } from "./types";
import type { EaEvidencePlan } from "./types";

export type EaOrchestrationResult = {
  capabilityId: string;
  answer: import("@/lib/ai-operating-assistant/capabilities/types").EaFormattedCapabilityAnswer;
  deterministic: boolean;
  skipSynthesis: boolean;
  toolResults: AssistantToolResult[];
};

export async function executeSemanticCapability(
  binding: EaSemanticCapabilityBinding,
  input: { message: string; business: AssistantBusinessContext },
): Promise<EaOrchestrationResult> {
  const normalized = normalizeEaMessage(input.message);
  const toolResults: AssistantToolResult[] = [];

  if (binding.executionStrategy === "multi_tool" && binding.compositeSteps?.length) {
    const priorResults: AssistantToolResult[] = [];
    for (const step of binding.compositeSteps) {
      const args = step.buildArgs({
        message: input.message,
        normalized,
        business: input.business,
        priorResults,
      });
      const result = (await executeAssistantTool(
        step.tool,
        args,
        input.business,
      )) as AssistantToolResult;
      priorResults.push(result);
      toolResults.push(result);
    }
    const answer =
      binding.compositeFormat?.(priorResults, input) ?? {
        text: "Combined results are ready.",
      };
    return {
      capabilityId: binding.id,
      answer,
      deterministic: binding.deterministic,
      skipSynthesis: binding.skipSynthesis,
      toolResults,
    };
  }

  const tool = binding.tool;
  if (!tool) {
    return {
      capabilityId: binding.id,
      answer: { text: binding.description },
      deterministic: binding.deterministic,
      skipSynthesis: binding.skipSynthesis,
      toolResults,
    };
  }

  const args =
    binding.buildArgs?.({
      message: input.message,
      normalized,
      business: input.business,
    }) ?? {};

  const toolResult = (await executeAssistantTool(tool, args, input.business)) as AssistantToolResult;
  toolResults.push(toolResult);

  const answer =
    binding.formatAnswer?.(toolResult, input) ?? {
      text:
        typeof (toolResult as { summary?: { message?: string } }).summary?.message === "string"
          ? String((toolResult as { summary?: { message?: string } }).summary?.message)
          : "Done.",
    };

  return {
    capabilityId: binding.id,
    answer,
    deterministic: binding.deterministic,
    skipSynthesis: binding.skipSynthesis,
    toolResults,
  };
}

export async function gatherAuthorisedEvidence(
  plan: EaEvidencePlan,
  business: AssistantBusinessContext,
): Promise<Array<{ tool: string; result: AssistantToolResult }>> {
  const evidence: Array<{ tool: string; result: AssistantToolResult }> = [];
  for (const step of plan.tools) {
    const result = (await executeAssistantTool(step.tool, step.args, business)) as AssistantToolResult;
    evidence.push({ tool: step.tool, result });
  }
  return evidence;
}

export { planEvidenceGathering, scoreReasoningIntent } from "./evidence-planner";
