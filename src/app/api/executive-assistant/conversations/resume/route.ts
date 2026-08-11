import { NextRequest, NextResponse } from "next/server";

import {
  getConversationForUser,
  getLatestConversationWithArtifacts,
} from "@/lib/ai-operating-assistant/conversation-service";
import { getPlatformSession } from "@/lib/platform-session";
import {
  isSupabaseConfigured,
  isSupabaseServiceRoleConfigured,
} from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getPlatformSession();
    if (!session) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    if (!isSupabaseConfigured() || !isSupabaseServiceRoleConfigured()) {
      return NextResponse.json({ conversation: null, persistence: "unavailable" });
    }

    const workspaceId = request.nextUrl.searchParams.get("workspaceId");
    const conversationId = request.nextUrl.searchParams.get("conversationId");

    if (conversationId) {
      const existing = await getConversationForUser(conversationId, session.sub);
      if (existing) {
        return NextResponse.json({ conversation: existing });
      }
    }

    const conversation = await getLatestConversationWithArtifacts({
      userId: session.sub,
      workspaceId: workspaceId || null,
    });

    return NextResponse.json({ conversation });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to resume conversation";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
