import { NextRequest, NextResponse } from "next/server";

import { INTERNAL_MESSAGING_ROOM } from "@/lib/internal-messaging-data";
import { listMessages, sendMessage } from "@/lib/internal-messaging-service";
import { localListMessages, localSendMessage } from "@/lib/internal-messaging-local-store";
import { handleSupportChannelClaimMessage } from "@/lib/support-claims";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const room = request.nextUrl.searchParams.get("room") ?? INTERNAL_MESSAGING_ROOM;
    const limitParam = request.nextUrl.searchParams.get("limit");
    const limit = limitParam ? Number(limitParam) : undefined;

    const messages = isSupabaseConfigured()
      ? await listMessages({ room, limit })
      : localListMessages({ room, limit });
    return NextResponse.json({ messages, room, source: isSupabaseConfigured() ? "supabase" : "local" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load messages";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
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
      ? await sendMessage({
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
        })
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

    void handleSupportChannelClaimMessage(message).catch((error) => {
      console.error("[support/claims] claim handling failed", error);
    });

    return NextResponse.json({ message });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to send message";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
