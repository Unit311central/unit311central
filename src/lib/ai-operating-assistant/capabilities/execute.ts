/**
 * Execute a resolved read capability — permissions already checked.
 */

import { executeAssistantTool } from "@/lib/ai-operating-assistant/tool-service";
import type { AssistantBusinessContext } from "@/lib/ai-operating-assistant/types";
import type { AssistantToolResult } from "@/lib/ai-operating-assistant/tool-result";

import type { EaFormattedCapabilityAnswer, EaReadCapabilityDefinition } from "./types";

export type EaCapabilityExecutionResult = {
  capabilityId: string;
  tool: string;
  toolResult: AssistantToolResult;
  answer: EaFormattedCapabilityAnswer;
  deterministic: boolean;
  skipSynthesis: boolean;
};

export async function executeReadCapability(
  capability: EaReadCapabilityDefinition,
  input: {
    message: string;
    normalized: string;
    business: AssistantBusinessContext;
  },
): Promise<EaCapabilityExecutionResult> {
  const args = capability.buildArgs(input);
  const toolResult = (await executeAssistantTool(
    capability.tool,
    args,
    input.business,
  )) as AssistantToolResult;

  const formatted =
    capability.formatAnswer(toolResult, {
      message: input.message,
      business: input.business,
    }) ?? {
      text:
        typeof (toolResult as { summary?: { message?: string } }).summary?.message === "string"
          ? String((toolResult as { summary?: { message?: string } }).summary?.message)
          : "Done.",
    };

  return {
    capabilityId: capability.id,
    tool: capability.tool,
    toolResult,
    answer: formatted,
    deterministic: capability.deterministic,
    skipSynthesis: capability.skipSynthesis,
  };
}
