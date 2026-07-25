/**
 * Instant CEO writes — execute registered actions without Approve UI.
 * Keep replies short: completed + any follow-up question only.
 */

import { getAssistantAction } from "./registry";
import { formatActionSuccess } from "../action-ui-messages";
import type { AssistantBusinessContext } from "../types";
import type { AssistantActionExecuteResult } from "./types";

export function shortCeoActionMessage(input: {
  actionId: string;
  result: AssistantActionExecuteResult;
  stepInput?: Record<string, unknown>;
}): string {
  const definition = getAssistantAction(input.actionId);
  const raw = (input.result.message || "").trim();

  // Prefer the handler's own short message when it's CEO-friendly.
  if (
    raw &&
    raw.length <= 320 &&
    !/\bapprove\b/i.test(raw) &&
    !/\bplan viewer\b/i.test(raw) &&
    !/\bmedium risk\b/i.test(raw)
  ) {
    return raw;
  }

  if (definition && input.result.ok) {
    const formatted = formatActionSuccess({
      definition,
      result: input.result,
      stepInput: input.stepInput,
    }).trim();
    if (
      formatted &&
      formatted.length <= 320 &&
      !/\bapprove\b/i.test(formatted)
    ) {
      return formatted;
    }
  }

  if (input.result.ok) {
    const label = input.result.recordLabel?.trim();
    return label ? `Completed — ${label}.` : "Completed.";
  }

  return raw || "I couldn't complete that.";
}

export async function executeRegisteredActionNow(input: {
  actionId: string;
  actionInput: Record<string, unknown>;
  business: AssistantBusinessContext;
}): Promise<{ ok: boolean; message: string; result: AssistantActionExecuteResult | null }> {
  const definition = getAssistantAction(input.actionId);
  if (!definition) {
    return {
      ok: false,
      message: "I don't have a registered action for that yet.",
      result: null,
    };
  }

  const ctx = {
    business: input.business,
    planId: `auto_${Date.now()}`,
    stepId: "1",
    priorOutputs: {},
  };

  try {
    const validation = await definition.handler.validate(input.actionInput, ctx);
    if (!validation.ok) {
      const ask =
        validation.errors.filter(Boolean).join(" ") ||
        "I still need a bit more detail.";
      return { ok: false, message: ask, result: null };
    }

    const result = await definition.handler.execute(input.actionInput, ctx);
    return {
      ok: result.ok,
      message: shortCeoActionMessage({
        actionId: input.actionId,
        result,
        stepInput: input.actionInput,
      }),
      result,
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "I couldn't complete that just now.",
      result: null,
    };
  }
}
