/**
 * Executive Assistant — LLM synthesis after deterministic tool retrieval.
 *
 * Pattern: user question → workspace routing → structured tool result → GPT synthesis → executive answer.
 * Tool-specific guidance only — never exact-question routing.
 */

import { isAbhiSlug } from "@/lib/abhi-surface";
import { isOnwardAirSlug } from "@/lib/onwardair-surface";
import { isTalantonImpactSlug } from "@/lib/talanton-surface";

export type EaSynthesisContext = {
  workspaceSlug: string;
  toolName: string;
  toolArgs: Record<string, unknown>;
  userMessage: string;
  toolResult: unknown;
};

/** ABHI platform tools that pass raw JSON to the model for natural-language answers. */
const ABHI_LLM_SYNTHESIS_TOOLS = new Set([
  "queryBusiness",
  "getCashPosition",
  "getSmartInsights",
  "searchInvoices",
  "searchClients",
  "searchCRM",
  "searchApplications",
  "listPlatformModules",
  "getDailyBrief",
]);

/** OnwardAir module reads that benefit from executive synthesis (not inventory-style bullets). */
const ONWARDAIR_SYNTHESIS_MODULES = new Set(["engineering", "fundraising"]);

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

function synthesisGuidanceForTool(toolName: string, toolArgs: Record<string, unknown>): string {
  if (toolName === "talanton.queryStories") {
    return [
      "You are synthesising Talanton impact and field stories for an executive audience.",
      "Use ONLY the story records in the tool payload (titles, summaries, companies, categories, dates).",
      "When the user asks for themes, lessons, takeaways, or what management should know:",
      "- Identify up to three recurring themes or management lessons grounded in the retrieved stories.",
      "- For each theme, cite brief evidence from specific stories (title or company).",
      "- Do not invent themes, lessons, or facts unsupported by the records.",
      "- If fewer than three distinct themes exist in the data, report only what the data supports.",
      "If the user asks for a simple inventory or scope summary, answer that directly from the records.",
    ].join("\n");
  }

  if (toolName === "onwardair.queryModule" && toolArgs.module === "engineering") {
    return [
      "You are synthesising OnwardAir engineering programme data for management.",
      "Use ONLY programmes, risks, metrics, and records in the tool payload.",
      "Structure the answer around these sections when the data supports them:",
      "1. Key issues — operational or delivery problems management must understand.",
      "2. Key risks — open or mitigating risks with severity and why they matter.",
      "3. Key priorities — gates, milestones, or programmes needing executive attention.",
      "Explain why each point matters to the business. Do not invent engineering facts.",
      "If a section lacks supporting data, say so plainly.",
    ].join("\n");
  }

  if (toolName === "getSmartInsights") {
    return [
      "You are synthesising operating/project insight data for an executive audience.",
      "Use ONLY the insight records in the tool payload (severity, titles, summaries, categories).",
      "When the user asks for a health check, on-track vs at-risk view, or management priorities:",
      "- Separate what is on track vs at risk using only the supplied records.",
      "- Highlight the key issues management must address, with brief evidence from the data.",
      "- Do not invent projects, risks, or statuses unsupported by the payload.",
    ].join("\n");
  }

  if (toolName === "onwardair.queryModule" && toolArgs.module === "fundraising") {
    return [
      "You are synthesising OnwardAir fundraising data for management.",
      "Use ONLY pipeline deals, targets, metrics, and records in the tool payload.",
      "Structure the answer around these sections when the data supports them:",
      "1. Current fundraising position — target vs active pipeline, stage spread.",
      "2. Key issues — gaps, concentration, or process concerns visible in the data.",
      "3. Key risks/blockers — only where supported by deal notes, stages, or metrics.",
      "4. Management priorities/actions — concrete next steps implied by the pipeline state.",
      "Do not simply list deals. Do not invent investor sentiment, diligence status, or timing",
      "that is not in the source data. If the data is primarily a pipeline snapshot, say what",
      "can and cannot be concluded.",
    ].join("\n");
  }

  return [
    "Write a natural Chief-of-Staff reply in plain English using this data.",
    "Never say invalid question or not connected — always be helpful.",
    "Clearly distinguish verified facts from interpretation. If data is insufficient, say so.",
  ].join("\n");
}

/**
 * Whether a deterministic tool result should be re-passed to the model for synthesis
 * instead of returning pre-formatted prose directly to the user.
 */
export function shouldSynthesizeExecutiveToolResult(ctx: EaSynthesisContext): boolean {
  if (toolResultHasError(ctx.toolResult)) return false;

  const { workspaceSlug, toolName, toolArgs } = ctx;

  if (isAbhiSlug(workspaceSlug) && ABHI_LLM_SYNTHESIS_TOOLS.has(toolName)) {
    return true;
  }

  if (isTalantonImpactSlug(workspaceSlug) && toolName === "talanton.queryStories") {
    return true;
  }

  if (isOnwardAirSlug(workspaceSlug) && toolName === "onwardair.queryModule") {
    const moduleId = String(toolArgs.module ?? "").trim();
    return ONWARDAIR_SYNTHESIS_MODULES.has(moduleId);
  }

  if (toolName === "getSmartInsights") {
    const q = (ctx.userMessage ?? "").toLowerCase();
    return /\b(executive|health\s+check|on\s+track|at\s+risk|management|summar|overview|key\s+issues)\b/.test(
      q,
    );
  }

  return false;
}

export function buildExecutiveSynthesisDeveloperMessage(ctx: EaSynthesisContext): string {
  const guidance = synthesisGuidanceForTool(ctx.toolName, ctx.toolArgs);
  return [
    `Tool ${ctx.toolName} returned the following workspace data for the user's question.`,
    guidance,
    toolResultPayloadForSynthesis(ctx.toolResult),
  ].join("\n\n");
}
