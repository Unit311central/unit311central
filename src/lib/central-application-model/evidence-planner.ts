/**
 * Evidence planning for strategic GPT reasoning — delegates to investigation planner.
 */

import type { AssistantBusinessContext } from "@/lib/ai-operating-assistant/types";
import type { EaEvidencePlan } from "./types";
import { scoreSemanticOverlap } from "./semantic-text";
import {
  planInvestigation,
  planCrossModuleEvidence as planCrossModuleInvestigation,
  planEvidenceGathering as planInvestigationEvidence,
} from "./investigation-planner";

const STRATEGIC_KEYWORDS = [
  "what happens if",
  "what would happen",
  "ramifications",
  "increase revenue",
  "reduce burn",
  "underperforming",
  "becoming risky",
  "how can i",
  "how do i",
  "what should we",
  "recommend",
  "strategy",
  "scenario",
];

export function planCrossModuleEvidence(
  message: string,
  business: AssistantBusinessContext,
): EaEvidencePlan | null {
  return planCrossModuleInvestigation(message, business);
}

export function planEvidenceGathering(
  message: string,
  business: AssistantBusinessContext,
): EaEvidencePlan | null {
  const direct = planInvestigation(message, business);
  if (direct) return direct;
  return planInvestigationEvidence(message, business);
}

export function scoreReasoningIntent(message: string): number {
  return scoreSemanticOverlap(message, STRATEGIC_KEYWORDS);
}
