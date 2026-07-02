import { NextRequest, NextResponse } from "next/server";

import { createScheduledCall, listScheduledCalls } from "@/lib/internal-messaging-service";
import { INTERNAL_MESSAGING_ROOM } from "@/lib/internal-messaging-data";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    const room = request.nextUrl.searchParams.get("room") ?? undefined;
    const scheduledCalls = await listScheduledCalls(room ?? undefined);
    return NextResponse.json({ scheduledCalls });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load scheduled calls";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    const body = (await request.json()) as {
      room?: string;
      title?: string;
      scheduledAt?: string;
      participantOperatorIds?: string[];
      callLink?: string;
      callType?: "voice" | "video";
      createdByOperatorId?: string;
      createdByOperatorName?: string;
    };

    if (
      !body.title ||
      !body.scheduledAt ||
      !body.callLink ||
      !body.createdByOperatorId ||
      !body.createdByOperatorName
    ) {
      return NextResponse.json({ error: "Scheduled call details are incomplete." }, { status: 400 });
    }

    const scheduledCall = await createScheduledCall({
      room: body.room ?? INTERNAL_MESSAGING_ROOM,
      title: body.title,
      scheduledAt: body.scheduledAt,
      participantOperatorIds: body.participantOperatorIds ?? [],
      callLink: body.callLink,
      callType: body.callType ?? "video",
      createdByOperatorId: body.createdByOperatorId,
      createdByOperatorName: body.createdByOperatorName,
    });

    return NextResponse.json({ scheduledCall });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to schedule call";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
