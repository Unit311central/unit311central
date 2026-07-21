import { NextRequest, NextResponse } from "next/server";

import {
  createConversation,
  listConversationsForUser,
} from "@/lib/ai-operating-assistant";
import { getPlatformSession } from "@/lib/platform-session";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getPlatformSession();
    if (!session) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ conversations: [], persistence: "unavailable" });
    }

    const workspaceId = request.nextUrl.searchParams.get("workspaceId");
    const conversations = await listConversationsForUser({
      userId: session.sub,
      workspaceId,
      limit: 40,
    });

    return NextResponse.json({ conversations, persistence: "supabase" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list conversations";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getPlatformSession();
    if (!session) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: "Conversation persistence requires Supabase." },
        { status: 503 },
      );
    }

    const body = (await request.json()) as {
      title?: string;
      workspaceId?: string | null;
      organisationId?: string | null;
    };

    const conversation = await createConversation({
      userId: session.sub,
      title: body.title?.trim() || "New conversation",
      workspaceId: body.workspaceId ?? null,
      organisationId: body.organisationId ?? null,
      messages: [],
    });

    return NextResponse.json({ conversation });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create conversation";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
