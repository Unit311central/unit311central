import {
  createSupabaseServiceRoleClient,
  isSupabaseServiceRoleConfigured,
} from "@/lib/supabase/server";

import { getEaCorrelationId, getEaTrace } from "./ea-forensic-trace";

const TABLE = "executive_assistant_model_usage";

export type ModelUsageCallSite =
  | "assistant_chat_stream"
  | "write_intent_classifier"
  | "goal_planner"
  | "unknown";

export type RecordModelUsageInput = {
  callSite: ModelUsageCallSite | string;
  model: string;
  durationMs: number;
  stream: boolean;
  success: boolean;
  inputTokens?: number | null;
  outputTokens?: number | null;
  totalTokens?: number | null;
  responseId?: string | null;
  correlationId?: string | null;
  conversationId?: string | null;
  userId?: string | null;
  workspaceId?: string | null;
  meta?: Record<string, unknown>;
};

function randomId() {
  return `mu_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function asTokenCount(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) return null;
  return Math.round(value);
}

export function parseResponseUsage(usage: unknown): {
  inputTokens: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
} {
  if (!usage || typeof usage !== "object") {
    return { inputTokens: null, outputTokens: null, totalTokens: null };
  }
  const record = usage as Record<string, unknown>;
  const inputTokens = asTokenCount(record.input_tokens);
  const outputTokens = asTokenCount(record.output_tokens);
  const totalTokens =
    asTokenCount(record.total_tokens) ??
    (inputTokens != null && outputTokens != null ? inputTokens + outputTokens : null);
  return { inputTokens, outputTokens, totalTokens };
}

export type EaModelUsageRow = {
  id: string;
  model: string;
  call_site: string;
  input_tokens: number | null;
  output_tokens: number | null;
  total_tokens: number | null;
  duration_ms: number;
  success: boolean;
  user_id: string | null;
  workspace_id: string | null;
  created_at: string;
};

export async function loadEaModelUsageRows(
  fromIso: string | null,
  toIso: string,
): Promise<EaModelUsageRow[]> {
  if (!isSupabaseServiceRoleConfigured()) return [];
  const supabase = createSupabaseServiceRoleClient();
  let query = supabase
    .from(TABLE)
    .select(
      "id, model, call_site, input_tokens, output_tokens, total_tokens, duration_ms, success, user_id, workspace_id, created_at",
    )
    .lte("created_at", toIso)
    .order("created_at", { ascending: false })
    .limit(20000);
  if (fromIso) query = query.gte("created_at", fromIso);
  const { data, error } = await query;
  if (error) {
    console.warn("[EA] model usage load failed:", error.message);
    return [];
  }
  return (data ?? []) as EaModelUsageRow[];
}

/**
 * Persist one OpenAI Responses API call. Never throws — failures are swallowed.
 */
export async function recordModelUsage(input: RecordModelUsageInput): Promise<void> {
  try {
    if (!isSupabaseServiceRoleConfigured()) return;

    const trace = getEaTrace();
    const correlationId = input.correlationId?.trim() || getEaCorrelationId();
    const conversationId = input.conversationId ?? trace?.conversationId ?? null;

    const supabase = createSupabaseServiceRoleClient();
    const { error } = await supabase.from(TABLE).insert({
      id: randomId(),
      correlation_id: correlationId,
      conversation_id: conversationId,
      user_id: input.userId ?? null,
      workspace_id: input.workspaceId ?? null,
      call_site: input.callSite,
      model: input.model,
      input_tokens: input.inputTokens ?? null,
      output_tokens: input.outputTokens ?? null,
      total_tokens: input.totalTokens ?? null,
      duration_ms: Math.max(0, Math.round(input.durationMs)),
      response_id: input.responseId ?? null,
      stream: input.stream,
      success: input.success,
      meta: input.meta ?? {},
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.warn("[EA] model usage telemetry insert failed:", error.message);
    }
  } catch (error) {
    console.warn(
      "[EA] model usage telemetry failed:",
      error instanceof Error ? error.message : String(error),
    );
  }
}
