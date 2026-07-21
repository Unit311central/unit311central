import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type {
  AssistantFeedbackRecord,
  AssistantQualityEvent,
  FeedbackVerdict,
  QualityEventKind,
} from "./explainability";

/**
 * Feedback + quality persistence.
 * Anonymous feedback improves prompts/workflows/tools — never used for identity.
 */

function randomId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function recordAnonymousFeedback(input: {
  verdict: FeedbackVerdict;
  targetType: AssistantFeedbackRecord["targetType"];
  targetId: string;
  comment?: string | null;
  anonymousSessionId: string;
  contextView?: string | null;
}): Promise<AssistantFeedbackRecord> {
  const record: AssistantFeedbackRecord = {
    id: randomId("fb"),
    verdict: input.verdict,
    targetType: input.targetType,
    targetId: input.targetId,
    comment: input.comment?.trim() || null,
    anonymousSessionId: input.anonymousSessionId.slice(0, 64),
    contextView: input.contextView ?? null,
    createdAt: new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    try {
      const supabase = createSupabaseServerClient();
      await supabase.from("executive_assistant_feedback").insert({
        id: record.id,
        verdict: record.verdict,
        target_type: record.targetType,
        target_id: record.targetId,
        comment: record.comment,
        anonymous_session_id: record.anonymousSessionId,
        context_view: record.contextView,
        created_at: record.createdAt,
      });
    } catch {
      // Persistence optional until migration applied
    }
  }

  await recordQualityEvent({
    kind: "feedback",
    meta: { verdict: record.verdict, targetType: record.targetType, targetId: record.targetId },
  });

  return record;
}

export async function recordQualityEvent(input: {
  kind: QualityEventKind;
  toolName?: string | null;
  durationMs?: number | null;
  success?: boolean | null;
  meta?: Record<string, unknown>;
}): Promise<AssistantQualityEvent> {
  const event: AssistantQualityEvent = {
    id: randomId("qe"),
    kind: input.kind,
    toolName: input.toolName ?? null,
    durationMs: input.durationMs ?? null,
    success: input.success ?? null,
    meta: input.meta,
    createdAt: new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    try {
      const supabase = createSupabaseServerClient();
      await supabase.from("executive_assistant_quality_events").insert({
        id: event.id,
        kind: event.kind,
        tool_name: event.toolName,
        duration_ms: event.durationMs,
        success: event.success,
        meta: event.meta ?? {},
        created_at: event.createdAt,
      });
    } catch {
      // optional
    }
  }

  return event;
}

export type AiQualitySummary = {
  responseTimeMsAvg: number | null;
  toolSuccessRate: number | null;
  toolCalls: number;
  toolErrors: number;
  dataGapEvents: number;
  hallucinationGuards: number;
  feedback: Record<FeedbackVerdict, number>;
  confirmationBlocks: number;
  sampleSize: number;
  generatedAt: string;
};

export async function getAiQualitySummary(limit = 500): Promise<AiQualitySummary> {
  const empty: AiQualitySummary = {
    responseTimeMsAvg: null,
    toolSuccessRate: null,
    toolCalls: 0,
    toolErrors: 0,
    dataGapEvents: 0,
    hallucinationGuards: 0,
    feedback: { helpful: 0, not_helpful: 0, incorrect: 0, missing_data: 0 },
    confirmationBlocks: 0,
    sampleSize: 0,
    generatedAt: new Date().toISOString(),
  };

  if (!isSupabaseConfigured()) return empty;

  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("executive_assistant_quality_events")
      .select("kind, tool_name, duration_ms, success, meta, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error || !data) return empty;

    let turnDurations = 0;
    let turnCount = 0;
    let toolOk = 0;
    let toolErr = 0;
    let dataGaps = 0;
    let guards = 0;
    let confirms = 0;
    const feedback: AiQualitySummary["feedback"] = {
      helpful: 0,
      not_helpful: 0,
      incorrect: 0,
      missing_data: 0,
    };

    for (const row of data) {
      const kind = row.kind as QualityEventKind;
      if (kind === "turn" && typeof row.duration_ms === "number") {
        turnDurations += row.duration_ms;
        turnCount += 1;
      }
      if (kind === "tool_success") toolOk += 1;
      if (kind === "tool_error") toolErr += 1;
      if (kind === "data_gap") dataGaps += 1;
      if (kind === "hallucination_guard") guards += 1;
      if (kind === "confirmation_blocked") confirms += 1;
      if (kind === "feedback") {
        const verdict = (row.meta as { verdict?: FeedbackVerdict } | null)?.verdict;
        if (verdict && verdict in feedback) feedback[verdict] += 1;
      }
    }

    const toolCalls = toolOk + toolErr;

    return {
      responseTimeMsAvg: turnCount > 0 ? Math.round(turnDurations / turnCount) : null,
      toolSuccessRate: toolCalls > 0 ? Math.round((toolOk / toolCalls) * 1000) / 10 : null,
      toolCalls,
      toolErrors: toolErr,
      dataGapEvents: dataGaps,
      hallucinationGuards: guards,
      feedback,
      confirmationBlocks: confirms,
      sampleSize: data.length,
      generatedAt: new Date().toISOString(),
    };
  } catch {
    return empty;
  }
}
