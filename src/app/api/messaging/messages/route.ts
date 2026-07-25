import { NextRequest, NextResponse } from "next/server";

import { INTERNAL_MESSAGING_ROOM } from "@/lib/internal-messaging-data";
import {
  listMessages,
  sendMessage,
  setMessageArchived,
  setMessageSaved,
  softDeleteMessage,
} from "@/lib/internal-messaging-service";
import {
  localListMessages,
  localSendMessage,
  localSetMessageArchived,
  localSetMessageSaved,
  localSoftDeleteMessage,
} from "@/lib/internal-messaging-local-store";
import {
  ensureMessagingMessageActionsSchema,
  isMissingMessageActionColumnError,
} from "@/lib/messaging-message-actions-schema";
import { requirePlatformSession } from "@/lib/platform-session";
import { handleSupportChannelClaimMessage } from "@/lib/support-claims";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { requireCurrentWorkspace } from "@/lib/workspace-context";

export const dynamic = "force-dynamic";

function authErrorStatus(message: string) {
  return message.includes("Authentication required") || message.includes("Workspace context")
    ? 401
    : 500;
}

function parseView(value: string | null): "active" | "archived" | "saved" {
  if (value === "archived" || value === "saved") return value;
  return "active";
}

export async function GET(request: NextRequest) {
  try {
    await requirePlatformSession();
    const workspace = await requireCurrentWorkspace();
    const scope = { workspaceId: workspace.id };

    const room = request.nextUrl.searchParams.get("room") ?? INTERNAL_MESSAGING_ROOM;
    const limitParam = request.nextUrl.searchParams.get("limit");
    const limit = limitParam ? Number(limitParam) : undefined;
    const view = parseView(request.nextUrl.searchParams.get("view"));
    const operatorId = request.nextUrl.searchParams.get("operatorId")?.trim() || undefined;

    if (isSupabaseConfigured()) {
      await ensureMessagingMessageActionsSchema().catch(() => false);
    }

    try {
      const messages = isSupabaseConfigured()
        ? await listMessages({ room, limit, view, operatorId }, scope)
        : localListMessages({ room, limit, view, operatorId });
      return NextResponse.json({
        messages,
        room,
        view,
        source: isSupabaseConfigured() ? "supabase" : "local",
      });
    } catch (listError) {
      const message = listError instanceof Error ? listError.message : "Failed to load messages";
      if (isSupabaseConfigured() && isMissingMessageActionColumnError(message)) {
        await ensureMessagingMessageActionsSchema(true);
        const messages = await listMessages({ room, limit, view, operatorId }, scope);
        return NextResponse.json({ messages, room, view, source: "supabase" });
      }
      throw listError;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load messages";
    return NextResponse.json({ error: message }, { status: authErrorStatus(message) });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requirePlatformSession();
    const workspace = await requireCurrentWorkspace();
    const scope = { workspaceId: workspace.id };

    const body = (await request.json()) as {
      operatorId?: string;
      operatorName?: string;
      username?: string;
      content?: string;
      room?: string;
      messageType?: "text" | "file" | "call" | "system";
      attachmentName?: string | null;
      attachmentUrl?: string | null;
      attachmentMime?: string | null;
      callLink?: string | null;
    };

    if (!body.operatorId || !body.operatorName || !body.username) {
      return NextResponse.json({ error: "Operator identity is required" }, { status: 400 });
    }

    const message = isSupabaseConfigured()
      ? await sendMessage(
          {
            operatorId: body.operatorId,
            operatorName: body.operatorName,
            username: body.username,
            content: body.content ?? "",
            room: body.room,
            messageType: body.messageType,
            attachmentName: body.attachmentName,
            attachmentUrl: body.attachmentUrl,
            attachmentMime: body.attachmentMime,
            callLink: body.callLink,
          },
          scope,
        )
      : localSendMessage({
          operatorId: body.operatorId,
          operatorName: body.operatorName,
          username: body.username,
          content: body.content ?? "",
          room: body.room,
          messageType: body.messageType,
          attachmentName: body.attachmentName,
          attachmentUrl: body.attachmentUrl,
          attachmentMime: body.attachmentMime,
          callLink: body.callLink,
        });

    void handleSupportChannelClaimMessage(message, scope).catch((error) => {
      console.error("[support/claims] claim handling failed", error);
    });

    return NextResponse.json({ message });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to send message";
    return NextResponse.json({ error: message }, { status: authErrorStatus(message) });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requirePlatformSession();
    const workspace = await requireCurrentWorkspace();
    const scope = { workspaceId: workspace.id };
    const body = (await request.json()) as {
      action?: "delete" | "archive" | "unarchive" | "save" | "unsave";
      messageId?: string;
      operatorId?: string;
    };

    const messageId = body.messageId?.trim();
    const action = body.action;
    if (!messageId || !action) {
      return NextResponse.json({ error: "action and messageId are required." }, { status: 400 });
    }

    if (isSupabaseConfigured()) {
      await ensureMessagingMessageActionsSchema().catch(() => false);
    }

    const run = async () => {
      if (action === "delete") {
        const message = isSupabaseConfigured()
          ? await softDeleteMessage(messageId, scope)
          : localSoftDeleteMessage(messageId);
        return { message, action };
      }
      if (action === "archive" || action === "unarchive") {
        const message = isSupabaseConfigured()
          ? await setMessageArchived(messageId, action === "archive", scope)
          : localSetMessageArchived(messageId, action === "archive");
        return { message, action };
      }
      if (action === "save" || action === "unsave") {
        const operatorId = body.operatorId?.trim();
        if (!operatorId) {
          throw new Error("operatorId is required to save messages.");
        }
        const result = isSupabaseConfigured()
          ? await setMessageSaved(
              { messageId, operatorId, saved: action === "save" },
              scope,
            )
          : localSetMessageSaved({
              messageId,
              operatorId,
              saved: action === "save",
            });
        return { messageId, ...result, action };
      }
      throw new Error("Unsupported action.");
    };

    try {
      return NextResponse.json(await run());
    } catch (actionError) {
      const message = actionError instanceof Error ? actionError.message : "Failed to update message";
      if (isSupabaseConfigured() && isMissingMessageActionColumnError(message)) {
        const ready = await ensureMessagingMessageActionsSchema(true);
        if (!ready) throw actionError;
        return NextResponse.json(await run());
      }
      throw actionError;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update message";
    return NextResponse.json({ error: message }, { status: authErrorStatus(message) });
  }
}
