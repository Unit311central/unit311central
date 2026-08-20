/**
 * Multi-capability and evidence orchestration.
 */

import { executeAssistantTool } from "@/lib/ai-operating-assistant/tool-service";
import type { AssistantBusinessContext } from "@/lib/ai-operating-assistant/types";
import type { AssistantToolResult } from "@/lib/ai-operating-assistant/tool-result";
import { normalizeEaMessage } from "@/lib/ai-operating-assistant/capabilities/message-normalize";

import type { EaSemanticCapabilityBinding } from "./types";
import type { EaEvidencePlan } from "./types";
import { synthesizeEvidenceAnswer } from "./evidence-synthesis";

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

export async function executeEvidencePlan(
  plan: EaEvidencePlan,
  input: { message: string; business: AssistantBusinessContext },
): Promise<EaOrchestrationResult> {
  const evidence = await gatherAuthorisedEvidence(plan, input.business);
  const synthesized = await synthesizeEvidenceAnswer({
    plan,
    evidence,
    message: input.message,
    business: input.business,
  });
  const toolResults = evidence.map((entry) => entry.result);
  if (synthesized.extraToolResult) {
    toolResults.push(synthesized.extraToolResult);
  }
  return {
    capabilityId:
      plan.synthesisKind === "scoped_pdf"
        ? "reports.scopedPdf.generate"
        : `ea.evidence.${plan.synthesisKind}`,
    answer: synthesized.answer,
    deterministic: true,
    skipSynthesis: true,
    toolResults,
  };
}

export { planEvidenceGathering, scoreReasoningIntent } from "./evidence-planner";
export { planInvestigation } from "./investigation-planner";
