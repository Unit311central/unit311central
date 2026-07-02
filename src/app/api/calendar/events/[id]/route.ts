import { NextRequest, NextResponse } from "next/server";

import type { CalendarEventType } from "@/lib/calendar-data";
import { deleteCalendarEvent, updateCalendarEvent } from "@/lib/internal-calendar-service";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    const { id } = await context.params;
    const body = (await request.json()) as {
      title?: string;
      eventType?: CalendarEventType;
      startsAt?: string;
      endsAt?: string;
      clientName?: string;
      location?: string;
      notes?: string;
    };

    if (body.startsAt && body.endsAt && new Date(body.endsAt) <= new Date(body.startsAt)) {
      return NextResponse.json({ error: "End time must be after start time" }, { status: 400 });
    }

    const event = await updateCalendarEvent(id, body);
    return NextResponse.json({ event });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update calendar event";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    const { id } = await context.params;
    await deleteCalendarEvent(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete calendar event";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
