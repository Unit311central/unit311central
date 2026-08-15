/**
 * Shared LLM synthesis guidance strings — referenced by workspace packs (not central slug switches).
 */

import type { EaSynthesisContext } from "@/lib/ai-operating-assistant/ea-llm-synthesis";

export const EA_DEFAULT_SYNTHESIS_GUIDANCE = [
  "Write a natural Chief-of-Staff reply in plain English using this data.",
  "Never say invalid question or not connected — always be helpful.",
  "Clearly distinguish verified facts from interpretation. If data is insufficient, say so.",
].join("\n");

export const EA_TALANTON_STORIES_GUIDANCE = [
  "You are synthesising Talanton impact and field stories for an executive audience.",
  "Use ONLY the story records in the tool payload (titles, summaries, companies, categories, dates).",
  "When the user asks for themes, lessons, takeaways, or what management should know:",
  "- Identify up to three recurring themes or management lessons grounded in the retrieved stories.",
  "- For each theme, cite brief evidence from specific stories (title or company).",
  "- Do not invent themes, lessons, or facts unsupported by the records.",
  "- If fewer than three distinct themes exist in the data, report only what the data supports.",
  "If the user asks for a simple inventory or scope summary, answer that directly from the records.",
].join("\n");

export const EA_ONWARDAIR_ENGINEERING_GUIDANCE = [
  "You are synthesising OnwardAir engineering programme data for management.",
  "Use ONLY programmes, risks, metrics, and records in the tool payload.",
  "Structure the answer around these sections when the data supports them:",
  "1. Key issues — operational or delivery problems management must understand.",
  "2. Key risks — open or mitigating risks with severity and why they matter.",
  "3. Key priorities — gates, milestones, or programmes needing executive attention.",
  "Explain why each point matters to the business. Do not invent engineering facts.",
  "If a section lacks supporting data, say so plainly.",
].join("\n");

export const EA_ONWARDAIR_FUNDRAISING_GUIDANCE = [
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

export const EA_PROJECT_PORTFOLIO_GUIDANCE = [
  "You are synthesising a workspace project portfolio health assessment for executives.",
  "Use ONLY the onTrack, atRisk, withIssues, and projects arrays in the tool payload.",
  "Structure the answer as:",
  "1. Portfolio snapshot — counts on track vs at risk vs issues.",
  "2. On track — name specific projects and why they are healthy.",
  "3. At risk — name projects, milestones, and risks driving concern.",
  "4. Issues / blocked — name projects with overdue, blocked, or red-band delivery.",
  "5. Executive priorities — what management should act on this week.",
  "Always name the projects behind each conclusion. Do not invent projects or statuses.",
].join("\n");

export const EA_SMART_INSIGHTS_HEALTH_GUIDANCE = [
  "You are synthesising operating/project insight data for an executive audience.",
  "Use ONLY the insight records in the tool payload (severity, titles, summaries, categories).",
  "When the user asks for a health check, on-track vs at-risk view, or management priorities:",
  "- Separate what is on track vs at risk using only the supplied records.",
  "- Highlight the key issues management must address, with brief evidence from the data.",
  "- Do not invent projects, risks, or statuses unsupported by the payload.",
].join("\n");

export function guidanceForToolName(
  toolName: string,
  toolArgs: Record<string, unknown>,
): string {
  if (toolName === "talanton.queryStories") return EA_TALANTON_STORIES_GUIDANCE;
  if (toolName === "onwardair.queryModule" && toolArgs.module === "engineering") {
    return EA_ONWARDAIR_ENGINEERING_GUIDANCE;
  }
  if (toolName === "onwardair.queryModule" && toolArgs.module === "fundraising") {
    return EA_ONWARDAIR_FUNDRAISING_GUIDANCE;
  }
  if (toolName === "getSmartInsights") return EA_SMART_INSIGHTS_HEALTH_GUIDANCE;
  if (toolName === "onwardair.queryProjectPortfolio" || toolName === "abhi.queryProjectPortfolio") {
    return EA_PROJECT_PORTFOLIO_GUIDANCE;
  }
  return EA_DEFAULT_SYNTHESIS_GUIDANCE;
}

export function matchesSmartInsightsHealthQuestion(ctx: EaSynthesisContext): boolean {
  if (ctx.toolName !== "getSmartInsights") return false;
  const q = (ctx.userMessage ?? "").toLowerCase();
  return /\b(executive|health\s+check|on\s+track|at\s+risk|management|summar|overview|key\s+issues)\b/.test(
    q,
  );
}
