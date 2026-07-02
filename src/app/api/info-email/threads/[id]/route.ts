import { NextRequest, NextResponse } from "next/server";

import { addInfoEmailReply, getInfoEmailThread } from "@/lib/internal-info-email-service";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    const { id } = await context.params;
    const thread = await getInfoEmailThread(id);
    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }
    return NextResponse.json({ thread });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load thread";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    const { id } = await context.params;
    const body = (await request.json()) as {
      replyBody?: string;
      repliedByUserId?: string;
      repliedByName?: string;
    };

    if (!body.replyBody?.trim()) {
      return NextResponse.json({ error: "Reply body is required" }, { status: 400 });
    }
    if (!body.repliedByUserId?.trim() || !body.repliedByName?.trim()) {
      return NextResponse.json({ error: "Select who is replying" }, { status: 400 });
    }

    const thread = await addInfoEmailReply({
      threadId: id,
      body: body.replyBody,
      repliedByUserId: body.repliedByUserId,
      repliedByName: body.repliedByName,
    });

    return NextResponse.json({ thread });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to send reply";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
