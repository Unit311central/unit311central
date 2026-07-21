import type { AssistantFollowUpAction } from "./tool-result";
import type { InsightSeverity } from "./executive-types";

/**
 * Explainability — every recommendation is transparent and traceable.
 * Additive trust layer; does not change OpenAI / registries / guided learning.
 */

export type AiEvidenceItem = {
  label: string;
  detail?: string;
  recordType?: string;
  recordId?: string;
  href?: string;
};

export type AiDrillDown = {
  label: string;
  href: string;
  entityType?: string;
  entityId?: string;
};

export type AiExplanation = {
  /** 0–100 */
  confidence: number;
  evidence: AiEvidenceItem[];
  dataSources: string[];
  reasoningSummary: string;
  assumptions: string[];
  recommendedActions: AssistantFollowUpAction[];
  drillDown?: AiDrillDown;
};

export type FeedbackVerdict = "helpful" | "not_helpful" | "incorrect" | "missing_data";

export type AssistantFeedbackRecord = {
  id: string;
  verdict: FeedbackVerdict;
  targetType: "insight" | "brief" | "health" | "message" | "recommendation" | "other";
  targetId: string;
  comment?: string | null;
  anonymousSessionId: string;
  contextView?: string | null;
  createdAt: string;
};

export type QualityEventKind =
  | "turn"
  | "tool_success"
  | "tool_error"
  | "data_gap"
  | "hallucination_guard"
  | "feedback"
  | "confirmation_blocked";

export type AssistantQualityEvent = {
  id: string;
  kind: QualityEventKind;
  toolName?: string | null;
  durationMs?: number | null;
  success?: boolean | null;
  meta?: Record<string, unknown>;
  createdAt: string;
};

export function confidenceFromSeverity(
  severity: InsightSeverity,
  dataGapCount = 0,
): number {
  const base =
    severity === "critical"
      ? 92
      : severity === "high"
        ? 86
        : severity === "medium"
          ? 74
          : 62;
  return Math.max(35, Math.min(98, base - dataGapCount * 8));
}

export function buildExplanation(input: {
  confidence?: number;
  severity?: InsightSeverity;
  evidence: AiEvidenceItem[];
  dataSources: string[];
  reasoningSummary: string;
  assumptions?: string[];
  recommendedActions: AssistantFollowUpAction[];
  drillDown?: AiDrillDown;
  dataGaps?: string[];
}): AiExplanation {
  const gapCount = input.dataGaps?.length ?? 0;
  const confidence =
    input.confidence ??
    confidenceFromSeverity(input.severity ?? "medium", gapCount);

  return {
    confidence,
    evidence: input.evidence,
    dataSources: input.dataSources,
    reasoningSummary: input.reasoningSummary,
    assumptions: [
      ...(input.assumptions ?? []),
      ...(input.dataGaps ?? []).map((gap) => `Data gap: ${gap}`),
    ],
    recommendedActions: input.recommendedActions,
    drillDown: input.drillDown,
  };
}

export function formatConfidence(confidence: number) {
  return `${Math.round(confidence)}%`;
}

export function inferDrillDown(input: {
  entityType?: string;
  entityId?: string;
  entityLabel?: string;
  href?: string;
}): AiDrillDown | undefined {
  if (input.href) {
    return {
      label: input.entityLabel ? `Inspect ${input.entityLabel}` : "Inspect underlying record",
      href: input.href,
      entityType: input.entityType,
      entityId: input.entityId,
    };
  }

  if (!input.entityType) return undefined;

  const viewByType: Record<string, string> = {
    project: "projects",
    client: "clients",
    employee: "hr",
    lead: "crm",
    invoice: "debtors",
    task: "home",
  };
  const view = viewByType[input.entityType];
  if (!view) return undefined;

  return {
    label: input.entityLabel ? `Inspect ${input.entityLabel}` : "Inspect underlying record",
    href: `/internaldashboard?view=${view}`,
    entityType: input.entityType,
    entityId: input.entityId,
  };
}
