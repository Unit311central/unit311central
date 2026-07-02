import {
  createBlankEventInput,
  mapCalendarEvent,
  type CalendarEvent,
  type CalendarEventType,
} from "@/lib/calendar-data";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

type DbCalendarEvent = Parameters<typeof mapCalendarEvent>[0];

function requireCalendarSupabase() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY.");
  }
  return createSupabaseServerClient();
}

export async function listCalendarEvents(from?: string, to?: string): Promise<CalendarEvent[]> {
  const supabase = requireCalendarSupabase();
  let query = supabase
    .from("internal_calendar_events")
    .select("*")
    .order("starts_at", { ascending: true });

  if (from) query = query.gte("starts_at", from);
  if (to) query = query.lte("starts_at", to);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data as DbCalendarEvent[]).map(mapCalendarEvent);
}

export async function createCalendarEvent(input: {
  title: string;
  eventType?: CalendarEventType;
  startsAt: string;
  endsAt: string;
  clientName?: string;
  location?: string;
  notes?: string;
}): Promise<CalendarEvent> {
  const supabase = requireCalendarSupabase();
  const blank = createBlankEventInput();

  const { data, error } = await supabase
    .from("internal_calendar_events")
    .insert({
      title: input.title.trim(),
      event_type: input.eventType ?? blank.eventType,
      starts_at: input.startsAt,
      ends_at: input.endsAt,
      client_name: input.clientName?.trim() || null,
      location: input.location?.trim() || null,
      notes: input.notes?.trim() || null,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return mapCalendarEvent(data as DbCalendarEvent);
}

export async function updateCalendarEvent(
  id: string,
  patch: Partial<{
    title: string;
    eventType: CalendarEventType;
    startsAt: string;
    endsAt: string;
    clientName: string;
    location: string;
    notes: string;
  }>,
): Promise<CalendarEvent> {
  const supabase = requireCalendarSupabase();
  const payload: Record<string, string | null> = {
    updated_at: new Date().toISOString(),
  };

  if (patch.title !== undefined) payload.title = patch.title.trim();
  if (patch.eventType !== undefined) payload.event_type = patch.eventType;
  if (patch.startsAt !== undefined) payload.starts_at = patch.startsAt;
  if (patch.endsAt !== undefined) payload.ends_at = patch.endsAt;
  if (patch.clientName !== undefined) payload.client_name = patch.clientName.trim() || null;
  if (patch.location !== undefined) payload.location = patch.location.trim() || null;
  if (patch.notes !== undefined) payload.notes = patch.notes.trim() || null;

  const { data, error } = await supabase
    .from("internal_calendar_events")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return mapCalendarEvent(data as DbCalendarEvent);
}

export async function deleteCalendarEvent(id: string) {
  const supabase = requireCalendarSupabase();
  const { error } = await supabase.from("internal_calendar_events").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
