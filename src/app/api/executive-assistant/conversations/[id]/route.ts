import { NextRequest, NextResponse } from "next/server";

import {
  deleteConversation,
  getConversationForUser,
  renameConversation,
} from "@/lib/ai-operating-assistant";
import { getPlatformSession } from "@/lib/platform-session";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const session = await getPlatformSession();
    if (!session) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Supabase unavailable." }, { status: 503 });
    }

    const { id } = await context.params;
    const conversation = await getConversationForUser(id, session.sub);
    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
    }

    return NextResponse.json({ conversation });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load conversation";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = await getPlatformSession();
    if (!session) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Supabase unavailable." }, { status: 503 });
    }

    const { id } = await context.params;
    const body = (await request.json()) as {
      title?: string;
      messages?: import("@/lib/ai-operating-assistant/types").AssistantChatMessage[];
    };

    if (body.messages) {
      const { updateConversation } = await import("@/lib/ai-operating-assistant");
      const conversation = await updateConversation({
        conversationId: id,
        userId: session.sub,
        messages: body.messages,
        title: body.title?.trim() || undefined,
      });
      return NextResponse.json({ conversation });
    }

    if (!body.title?.trim()) {
      return NextResponse.json({ error: "title is required." }, { status: 400 });
    }

    const conversation = await renameConversation({
      conversationId: id,
      userId: session.sub,
      title: body.title,
    });

    return NextResponse.json({ conversation });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to rename conversation";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const session = await getPlatformSession();
    if (!session) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Supabase unavailable." }, { status: 503 });
    }

    const { id } = await context.params;
    await deleteConversation({ conversationId: id, userId: session.sub });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete conversation";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
