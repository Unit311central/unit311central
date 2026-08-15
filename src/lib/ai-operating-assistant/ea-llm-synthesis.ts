/**
 * Executive Assistant — LLM synthesis after deterministic tool retrieval.
 *
 * Pattern: user question → workspace routing → structured tool result → GPT synthesis → executive answer.
 * Tool-specific guidance only — never exact-question routing.
 */

import {
  ensureEaWorkspacePacksRegistered,
  getEaWorkspacePackSynthesisGuidance,
  shouldEaWorkspacePackSynthesize,
} from "@/lib/ai-operating-assistant/workspace-packs";

export type EaSynthesisContext = {
  workspaceSlug: string;
  toolName: string;
  toolArgs: Record<string, unknown>;
  userMessage: string;
  toolResult: unknown;
};

function toolResultHasError(result: unknown): boolean {
  if (!result || typeof result !== "object") return false;
  const status = String((result as { status?: string }).status ?? "");
  return status === "error" || status === "forbidden";
}

export function toolResultPayloadForSynthesis(result: unknown): string {
  try {
    return JSON.stringify(result).slice(0, 14_000);
  } catch {
    return String(result);
  }
}

/**
 * Whether a deterministic tool result should be re-passed to the model for synthesis
 * instead of returning pre-formatted prose directly to the user.
 */
export function shouldSynthesizeExecutiveToolResult(ctx: EaSynthesisContext): boolean {
  if (toolResultHasError(ctx.toolResult)) return false;

  ensureEaWorkspacePacksRegistered();
  return shouldEaWorkspacePackSynthesize(ctx);
}

export function buildExecutiveSynthesisDeveloperMessage(ctx: EaSynthesisContext): string {
  ensureEaWorkspacePacksRegistered();
  const guidance = getEaWorkspacePackSynthesisGuidance(ctx);
  return [
    `Tool ${ctx.toolName} returned the following workspace data for the user's question.`,
    guidance,
    toolResultPayloadForSynthesis(ctx.toolResult),
  ].join("\n\n");
}
