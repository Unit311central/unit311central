import {
  createAssistantResponse,
  formatOpenAIError,
  getAssistantModel,
  isRetryableOpenAIError,
} from "./openai-client";
import { buildBusinessContext } from "./context-service";
import { buildStructuredJsonHint, buildSystemInstructions } from "./prompt-service";
import { executeAssistantTool, getOpenAIToolSchemas } from "./tool-service";
import {
  createConversation,
  createMessageId,
  getConversationForUser,
  titleFromMessages,
  updateConversation,
} from "./conversation-service";
import { recordQualityEvent } from "./feedback-service";
import type {
  AssistantBusinessContext,
  AssistantChatMessage,
  AssistantChatRequest,
  AssistantStreamEvent,
} from "./types";
import type { PlatformSession } from "@/lib/platform-auth";
import { isSupabaseConfigured } from "@/lib/supabase/server";

type EasyInputMessage = {
  role: "user" | "assistant" | "system" | "developer";
  content: string;
};

function toInputMessages(
  history: AssistantChatMessage[],
  latestUserMessage: string,
): EasyInputMessage[] {
  const prior = history
    .filter((message) => message.role === "user" || message.role === "assistant")
    .slice(-24)
    .map((message) => ({
      role: message.role as "user" | "assistant",
      content: message.content,
    }));

  return [...prior, { role: "user", content: latestUserMessage }];
}

function encodeSse(event: AssistantStreamEvent) {
  return `data: ${JSON.stringify(event)}\n\n`;
}

async function resolveHistory(
  session: PlatformSession,
  request: AssistantChatRequest,
  context: AssistantBusinessContext,
): Promise<{ conversationId: string | null; history: AssistantChatMessage[]; title: string }> {
  if (request.conversationId && isSupabaseConfigured()) {
    const existing = await getConversationForUser(request.conversationId, session.sub);
    if (existing) {
      return {
        conversationId: existing.id,
        history: existing.messages,
        title: existing.title,
      };
    }
  }

  if (request.messages?.length) {
    return {
      conversationId: request.conversationId ?? null,
      history: request.messages,
      title: titleFromMessages(request.messages),
    };
  }

  return {
    conversationId: null,
    history: [],
    title: "New conversation",
  };
}

async function persistTurn(input: {
  session: PlatformSession;
  conversationId: string | null;
  history: AssistantChatMessage[];
  userMessage: AssistantChatMessage;
  assistantMessage: AssistantChatMessage;
  context: AssistantBusinessContext;
  title: string;
}) {
  if (!isSupabaseConfigured()) {
    return {
      conversationId: input.conversationId ?? `local_${createMessageId()}`,
      title: input.title,
    };
  }

  const messages = [...input.history, input.userMessage, input.assistantMessage];
  const title = titleFromMessages(messages);

  if (input.conversationId) {
    const updated = await updateConversation({
      conversationId: input.conversationId,
      userId: input.session.sub,
      messages,
      workspaceContext: input.context,
      title,
    });
    return { conversationId: updated.id, title: updated.title };
  }

  const created = await createConversation({
    userId: input.session.sub,
    workspaceId: input.context.workspace.id,
    organisationId: input.context.organisation.id,
    messages,
    workspaceContext: input.context,
    title,
  });
  return { conversationId: created.id, title: created.title };
}

/**
 * Runs one assistant turn via the OpenAI Responses API with optional tool loop.
 * Yields SSE-friendly stream events.
 */
export async function* runAssistantTurn(input: {
  session: PlatformSession;
  request: AssistantChatRequest;
}): AsyncGenerator<AssistantStreamEvent> {
  const message = input.request.message?.trim();
  if (!message) {
    yield { type: "error", error: "message is required", retryable: false };
    return;
  }

  const context = await buildBusinessContext({
    session: input.session,
    activeView: input.request.activeView,
    pathname: input.request.pathname,
    selection: input.request.selection,
    roleView: input.request.roleView,
  });

  const resolved = await resolveHistory(input.session, input.request, context);
  const userMessage: AssistantChatMessage = {
    id: createMessageId(),
    role: "user",
    content: message,
    createdAt: new Date().toISOString(),
  };

  yield {
    type: "meta",
    conversationId: resolved.conversationId ?? "pending",
    title: resolved.title,
  };

  const instructions = [
    buildSystemInstructions(context),
    input.request.structuredJson ? buildStructuredJsonHint() : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  const turnStartedAt = Date.now();
  let recordedDataGaps = 0;

  const tools = getOpenAIToolSchemas();
  let inputItems: EasyInputMessage[] = toInputMessages(resolved.history, message);
  let assistantText = "";
  let toolLoops = 0;

  try {
    while (toolLoops < 4) {
      const stream = await createAssistantResponse({
        model: getAssistantModel(),
        instructions,
        input: inputItems,
        tools,
        stream: true,
        store: false,
        ...(input.request.structuredJson
          ? {
              text: {
                format: { type: "json_object" as const },
              },
            }
          : {}),
      });

      let pendingToolCalls: Array<{ callId: string; name: string; arguments: string }> = [];
      let responseId: string | null = null;

      for await (const event of stream as AsyncIterable<{
        type: string;
        delta?: string;
        response?: { id?: string; output?: unknown[] };
        item?: { type?: string; name?: string; call_id?: string; arguments?: string; id?: string };
        name?: string;
        arguments?: string;
        call_id?: string;
      }>) {
        if (event.type === "response.created" && event.response?.id) {
          responseId = event.response.id;
        }

        if (event.type === "response.output_text.delta" && typeof event.delta === "string") {
          assistantText += event.delta;
          yield { type: "delta", text: event.delta };
        }

        if (event.type === "response.output_item.done" && event.item?.type === "function_call") {
          const name = event.item.name ?? "unknown";
          const args = event.item.arguments ?? "{}";
          const callId = event.item.call_id ?? event.item.id ?? createMessageId();
          pendingToolCalls.push({ callId, name, arguments: args });
          yield { type: "tool_call", name, arguments: safeParse(args) };
        }

        if (event.type === "response.function_call_arguments.done") {
          // Some SDK versions emit this; prefer output_item.done when both appear.
          if (event.name && event.arguments && event.call_id) {
            if (!pendingToolCalls.some((call) => call.callId === event.call_id)) {
              pendingToolCalls.push({
                callId: event.call_id,
                name: event.name,
                arguments: event.arguments,
              });
              yield {
                type: "tool_call",
                name: event.name,
                arguments: safeParse(event.arguments),
              };
            }
          }
        }

        if (event.type === "response.failed") {
          yield {
            type: "error",
            error: "OpenAI response failed",
            retryable: true,
          };
          return;
        }

        void responseId;
      }

      if (pendingToolCalls.length === 0) {
        break;
      }

      toolLoops += 1;
      const toolOutputs: Array<{ type: "function_call_output"; call_id: string; output: string }> =
        [];

      for (const call of pendingToolCalls) {
        const toolStarted = Date.now();
        const result = await executeAssistantTool(call.name, call.arguments, context);
        const status =
          result && typeof result === "object" && "status" in result
            ? String((result as { status?: string }).status)
            : "ok";
        const success = status === "ok" || status === "partial";
        void recordQualityEvent({
          kind: success ? "tool_success" : "tool_error",
          toolName: call.name,
          durationMs: Date.now() - toolStarted,
          success,
          meta: { status },
        });
        const gaps =
          result && typeof result === "object" && Array.isArray((result as { dataGaps?: unknown }).dataGaps)
            ? ((result as { dataGaps: string[] }).dataGaps?.length ?? 0)
            : 0;
        if (gaps > 0) {
          recordedDataGaps += gaps;
          void recordQualityEvent({
            kind: "data_gap",
            toolName: call.name,
            meta: { count: gaps },
          });
        }
        yield { type: "tool_result", name: call.name, result };
        toolOutputs.push({
          type: "function_call_output",
          call_id: call.callId,
          output: JSON.stringify(result),
        });
      }

      // Continue the turn with tool outputs as additional input context.
      inputItems = [
        ...inputItems,
        {
          role: "assistant",
          content:
            assistantText ||
            `Calling tools: ${pendingToolCalls.map((call) => call.name).join(", ")}`,
        },
        {
          role: "user",
          content: `Tool results (JSON):\n${JSON.stringify(
            toolOutputs.map((output) => ({
              call_id: output.call_id,
              output: safeParse(output.output),
            })),
            null,
            2,
          )}\nContinue and answer the user using ONLY these tool results. Include contextual follow-up actions from followUpActions. Do not invent missing data. If dataGaps are present, state them. When presenting recommendations, include Confidence, Evidence, Data Sources, Reasoning Summary, and Recommended Actions from tool explanation payloads when available.`,
        },
      ];
      assistantText = "";
      pendingToolCalls = [];
    }

    if (!assistantText.trim()) {
      assistantText =
        "I could not produce a response just now. Please try again — no business data was invented.";
      yield { type: "delta", text: assistantText };
      void recordQualityEvent({ kind: "hallucination_guard", meta: { reason: "empty_assistant_text" } });
    }

    void recordQualityEvent({
      kind: "turn",
      durationMs: Date.now() - turnStartedAt,
      success: true,
      meta: { dataGaps: recordedDataGaps, view: context.page.activeView },
    });

    const assistantMessage: AssistantChatMessage = {
      id: createMessageId(),
      role: "assistant",
      content: assistantText,
      createdAt: new Date().toISOString(),
    };

    const saved = await persistTurn({
      session: input.session,
      conversationId: resolved.conversationId,
      history: resolved.history,
      userMessage,
      assistantMessage,
      context,
      title: resolved.title,
    });

    yield {
      type: "done",
      message: assistantMessage,
      conversationId: saved.conversationId,
    };
  } catch (error) {
    yield {
      type: "error",
      error: formatOpenAIError(error),
      retryable: isRetryableOpenAIError(error),
    };
  }
}

function safeParse(value: string) {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
}

export function createAssistantSseResponse(
  generator: AsyncGenerator<AssistantStreamEvent>,
): Response {
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        for await (const event of generator) {
          controller.enqueue(encoder.encode(encodeSse(event)));
        }
      } catch (error) {
        controller.enqueue(
          encoder.encode(
            encodeSse({
              type: "error",
              error: formatOpenAIError(error),
              retryable: isRetryableOpenAIError(error),
            }),
          ),
        );
      } finally {
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
