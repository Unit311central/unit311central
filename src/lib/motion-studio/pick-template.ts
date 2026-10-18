import { buildGenericExplainerSpec } from "./templates/generic-explainer";
import { buildSalesOpportunitySpec } from "./templates/sales-opportunity";
import type { MotionStudioSpec } from "./types";
import { assertSceneTimeline, validateMotionStudioSpec } from "./validate";

export function parseDurationSeconds(prompt: string): number {
  const m = prompt.match(/\b(\d{1,3})\s*[- ]?\s*(?:second|sec|s)\b/i);
  if (!m) return 30;
  const n = Number(m[1]);
  if (!Number.isFinite(n)) return 30;
  return Math.max(10, Math.min(90, n));
}

export function inferTopicLabel(prompt: string): string {
  const lower = prompt.toLowerCase();
  if (/\bqms\b|quality\s+management/.test(lower)) return "Quality Management (QMS)";
  if (/\bquotation|quote\b/.test(lower)) return "Quotation to order";
  if (/\bcontact|compan(y|ies)|deal|opportunit/.test(lower)) return "CRM relationships";
  if (/\bsales\s+order|order\b/.test(lower)) return "Sales order flow";
  return "Unit311Central capability";
}

export function isSalesOpportunityPrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  return (
    /\b(sales\s+)?opportunit(y|ies)\b/.test(lower) ||
    /\bsales\s+workflow\b/.test(lower) ||
    /\bdeal\s+closure\b/.test(lower) ||
    /\bfrom\s+initial\s+contact\b/.test(lower) ||
    /\bcontact\s+through\b.*\bclos/i.test(lower) ||
    /\bwalkthrough\b.*\bsales\b/.test(lower) ||
    /\bpipeline\b/.test(lower)
  );
}

export function buildMotionSpecFromPrompt(prompt: string): MotionStudioSpec {
  const durationMs = parseDurationSeconds(prompt) * 1000;
  const promptEcho = prompt.trim();
  let raw: MotionStudioSpec;
  if (isSalesOpportunityPrompt(prompt)) {
    raw = buildSalesOpportunitySpec({ promptEcho, durationMs });
  } else {
    raw = buildGenericExplainerSpec({
      promptEcho,
      topic: inferTopicLabel(prompt),
      durationMs,
    });
  }
  const spec = validateMotionStudioSpec(raw);
  assertSceneTimeline(spec);
  return spec;
}
