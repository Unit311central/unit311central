import { NextRequest, NextResponse } from "next/server";

import type { CalendarEventType } from "@/lib/calendar-data";
import { createCalendarEvent, listCalendarEvents } from "@/lib/internal-calendar-service";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    const from = request.nextUrl.searchParams.get("from") ?? undefined;
    const to = request.nextUrl.searchParams.get("to") ?? undefined;
    const events = await listCalendarEvents(from, to);
    return NextResponse.json({ events });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load calendar events";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    const body = (await request.json()) as {
      title?: string;
      eventType?: CalendarEventType;
      startsAt?: string;
      endsAt?: string;
      clientName?: string;
      location?: string;
      notes?: string;
    };

    if (!body.title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    if (!body.startsAt || !body.endsAt) {
      return NextResponse.json({ error: "Start and end times are required" }, { status: 400 });
    }
    if (new Date(body.endsAt) <= new Date(body.startsAt)) {
      return NextResponse.json({ error: "End time must be after start time" }, { status: 400 });
    }

    const event = await createCalendarEvent({
      title: body.title,
      eventType: body.eventType,
      startsAt: body.startsAt,
      endsAt: body.endsAt,
      clientName: body.clientName,
      location: body.location,
      notes: body.notes,
    });

    return NextResponse.json({ event });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create calendar event";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
