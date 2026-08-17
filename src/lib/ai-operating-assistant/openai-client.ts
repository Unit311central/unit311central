import OpenAI from "openai";

import { getEaCorrelationId } from "./ea-forensic-trace";
import {
  parseResponseUsage,
  recordModelUsage,
  type ModelUsageCallSite,
} from "./model-usage-service";

const DEFAULT_MODEL = process.env.OPENAI_ASSISTANT_MODEL?.trim() || "gpt-4o-mini";
const MAX_RETRIES = 3;

export function getAssistantModel() {
  return DEFAULT_MODEL;
}

export function createOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is not configured. Set it in the server environment (never expose it to the browser).",
    );
  }

  return new OpenAI({
    apiKey,
    maxRetries: MAX_RETRIES,
  });
}

export type ResponsesCreateParams = Parameters<OpenAI["responses"]["create"]>[0];

export type AssistantResponseTelemetryOptions = {
  callSite?: ModelUsageCallSite | string;
  userId?: string | null;
  workspaceId?: string | null;
  conversationId?: string | null;
};

type StreamEvent = {
  type?: string;
  response?: {
    id?: string;
    usage?: unknown;
  };
};

function fireModelUsage(input: Parameters<typeof recordModelUsage>[0]) {
  void recordModelUsage(input);
}

async function* instrumentResponseStream(
  stream: AsyncIterable<StreamEvent>,
  context: {
    callSite: string;
    model: string;
    startedAt: number;
    userId: string | null;
    workspaceId: string | null;
    conversationId: string | null;
  },
): AsyncIterable<StreamEvent> {
  let recorded = false;
  let responseId: string | null = null;

  const emit = (success: boolean, usage?: unknown, meta?: Record<string, unknown>) => {
    if (recorded) return;
    recorded = true;
    const tokens = parseResponseUsage(usage);
    fireModelUsage({
      callSite: context.callSite,
      model: context.model,
      durationMs: Date.now() - context.startedAt,
      stream: true,
      success,
      responseId,
      correlationId: getEaCorrelationId(),
      userId: context.userId,
      workspaceId: context.workspaceId,
      conversationId: context.conversationId,
      ...tokens,
      meta,
    });
  };

  try {
    for await (const event of stream) {
      if (event.type === "response.created" && event.response?.id) {
        responseId = event.response.id;
      }
      if (event.type === "response.completed") {
        if (event.response?.id) responseId = event.response.id;
        emit(true, event.response?.usage);
      }
      if (event.type === "response.failed") {
        emit(false, event.response?.usage, { reason: "response.failed" });
      }
      yield event;
    }
    if (!recorded) {
      emit(true, undefined, { reason: "stream_ended_without_completed" });
    }
  } catch (error) {
    if (!recorded) {
      emit(false, undefined, {
        reason: "stream_error",
        message: error instanceof Error ? error.message : String(error),
      });
    }
    throw error;
  }
}

export async function createAssistantResponse(
  params: ResponsesCreateParams,
  telemetry?: AssistantResponseTelemetryOptions,
) {
  const callSite = telemetry?.callSite ?? "unknown";
  const model = String(params.model ?? DEFAULT_MODEL);
  const startedAt = Date.now();
  const isStream = params.stream === true;
  const usageContext = {
    userId: telemetry?.userId ?? null,
    workspaceId: telemetry?.workspaceId ?? null,
    conversationId: telemetry?.conversationId ?? null,
  };

  try {
    const client = createOpenAIClient();
    const result = await client.responses.create({
      ...params,
      model: params.model ?? DEFAULT_MODEL,
    });

    if (isStream) {
      return instrumentResponseStream(
        result as AsyncIterable<StreamEvent>,
        { callSite, model, startedAt, ...usageContext },
      );
    }

    const response = result as { id?: string; usage?: unknown };
    const tokens = parseResponseUsage(response.usage);
    fireModelUsage({
      callSite,
      model,
      durationMs: Date.now() - startedAt,
      stream: false,
      success: true,
      responseId: response.id ?? null,
      correlationId: getEaCorrelationId(),
      ...usageContext,
      ...tokens,
    });

    return result;
  } catch (error) {
    fireModelUsage({
      callSite,
      model,
      durationMs: Date.now() - startedAt,
      stream: isStream,
      success: false,
      correlationId: getEaCorrelationId(),
      ...usageContext,
      meta: {
        reason: "openai_request_error",
        message: error instanceof Error ? error.message : String(error),
      },
    });
    throw error;
  }
}

export function isRetryableOpenAIError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const status = "status" in error ? Number((error as { status?: number }).status) : NaN;
  return status === 408 || status === 429 || status >= 500;
}

export function formatOpenAIError(error: unknown) {
  if (error instanceof Error) return error.message;
  return "OpenAI request failed";
}
