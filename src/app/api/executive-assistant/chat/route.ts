import { NextRequest, NextResponse } from "next/server";

import {
  createAssistantSseResponse,
  runAssistantTurn,
  type AssistantChatMessage,
  type AssistantChatRequest,
  type AssistantPageSelection,
} from "@/lib/ai-operating-assistant";
import {
  completeExecutiveAssistantChat,
  type ExecutiveAssistantChatTurn,
} from "@/lib/executive-assistant-ai";
import {
  buildExecutivePlatformSnapshot,
  formatExecutivePlatformSnapshot,
} from "@/lib/executive-assistant-context";
import { getPlatformSession } from "@/lib/platform-session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_LEGACY_MESSAGES = 24;

function parseSelection(raw: unknown): AssistantPageSelection | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const value = raw as Record<string, unknown>;
  return {
    clientId: typeof value.clientId === "string" ? value.clientId : null,
    clientName: typeof value.clientName === "string" ? value.clientName : null,
    projectId: typeof value.projectId === "string" ? value.projectId : null,
    projectName: typeof value.projectName === "string" ? value.projectName : null,
    employeeId: typeof value.employeeId === "string" ? value.employeeId : null,
    employeeName: typeof value.employeeName === "string" ? value.employeeName : null,
    contractId: typeof value.contractId === "string" ? value.contractId : null,
    contractName: typeof value.contractName === "string" ? value.contractName : null,
    fileId: typeof value.fileId === "string" ? value.fileId : null,
    fileName: typeof value.fileName === "string" ? value.fileName : null,
  };
}

function parseOperatingMessages(raw: unknown): AssistantChatMessage[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  return raw
    .filter(
      (entry): entry is AssistantChatMessage =>
        Boolean(entry) &&
        typeof entry === "object" &&
        (entry.role === "user" || entry.role === "assistant" || entry.role === "tool") &&
        typeof entry.content === "string",
    )
    .map((entry) => ({
      id: typeof entry.id === "string" ? entry.id : `msg_${Math.random().toString(36).slice(2)}`,
      role: entry.role,
      content: entry.content,
      createdAt:
        typeof entry.createdAt === "string" ? entry.createdAt : new Date().toISOString(),
      toolName: typeof entry.toolName === "string" ? entry.toolName : undefined,
      toolCallId: typeof entry.toolCallId === "string" ? entry.toolCallId : undefined,
    }));
}

function parseLegacyMessages(raw: unknown): ExecutiveAssistantChatTurn[] | null {
  if (!Array.isArray(raw)) return null;

  const messages = raw
    .filter(
      (entry): entry is ExecutiveAssistantChatTurn =>
        Boolean(entry) &&
        (entry.role === "user" || entry.role === "assistant") &&
        typeof entry.content === "string",
    )
    .map((entry) => ({
      role: entry.role,
      content: entry.content.trim(),
    }))
    .filter((entry) => entry.content.length > 0)
    .slice(-MAX_LEGACY_MESSAGES);

  return messages.length > 0 ? messages : null;
}

async function handleLegacyChat(messages: ExecutiveAssistantChatTurn[]) {
  const snapshot = await buildExecutivePlatformSnapshot();
  const platformContext = formatExecutivePlatformSnapshot(snapshot);
  const { content: reply, model, authMode } = await completeExecutiveAssistantChat(
    messages,
    platformContext,
  );

  return NextResponse.json({
    reply,
    model,
    authMode,
    dataAvailable: snapshot.dataAvailable,
  });
}

async function handleOperatingAssistantChat(
  body: Record<string, unknown>,
  session: NonNullable<Awaited<ReturnType<typeof getPlatformSession>>>,
) {
  const chatRequest: AssistantChatRequest = {
    conversationId: typeof body.conversationId === "string" ? body.conversationId : null,
    message: typeof body.message === "string" ? body.message : "",
    messages: parseOperatingMessages(body.messages),
    activeView: typeof body.activeView === "string" ? body.activeView : null,
    pathname: typeof body.pathname === "string" ? body.pathname : null,
    selection: parseSelection(body.selection),
    roleView: typeof body.roleView === "string" ? body.roleView : null,
    stream: body.stream !== false,
    structuredJson: body.structuredJson === true,
  };

  if (!chatRequest.message.trim()) {
    return NextResponse.json({ error: "message is required." }, { status: 400 });
  }

  const generator = runAssistantTurn({ session, request: chatRequest });

  if (chatRequest.stream === false) {
    let finalText = "";
    let conversationId = chatRequest.conversationId ?? "";
    let error: string | null = null;

    for await (const event of generator) {
      if (event.type === "delta") finalText += event.text;
      if (event.type === "done") {
        finalText = event.message.content;
        conversationId = event.conversationId;
      }
      if (event.type === "error") error = event.error;
    }

    if (error) {
      return NextResponse.json({ error }, { status: 502 });
    }

    return NextResponse.json({
      reply: finalText,
      conversationId,
    });
  }

  return createAssistantSseResponse(generator);
}

/**
 * Dual contract:
 * - Legacy panel: `{ messages: [...] }` → `{ reply, model, authMode, dataAvailable }`
 * - Operating Assistant: `{ message, ... }` → SSE stream or `{ reply, conversationId }`
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getPlatformSession();
    if (!session) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const operatingMessage =
      typeof body.message === "string" ? body.message.trim() : "";

    if (operatingMessage) {
      return handleOperatingAssistantChat(body, session);
    }

    const legacyMessages = parseLegacyMessages(body.messages);
    if (!legacyMessages) {
      return NextResponse.json(
        { error: "message is required, or provide a legacy messages array." },
        { status: 400 },
      );
    }

    if (legacyMessages[legacyMessages.length - 1]?.role !== "user") {
      return NextResponse.json({ error: "Last message must be from the user." }, { status: 400 });
    }

    return handleLegacyChat(legacyMessages);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate reply";
    const status =
      message.includes("not configured") || message.includes("OPENAI_API_KEY") ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
