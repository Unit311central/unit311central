import { createCalendarEvent } from "@/lib/internal-calendar-service";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

const MARKER_TITLE = "Talanton Portfolio Review — Q3 2026";

type CalendarSeed = {
  title: string;
  eventType: "meeting" | "onsite" | "other";
  startsAt: string;
  endsAt: string;
  clientName?: string;
  location?: string;
  notes?: string;
};

const TALANTON_CALENDAR_SEEDS: CalendarSeed[] = [
  {
    title: MARKER_TITLE,
    eventType: "meeting",
    startsAt: "2026-09-15T14:00:00.000Z",
    endsAt: "2026-09-15T15:30:00.000Z",
    location: "Newtown Square HQ · Boardroom",
    notes:
      "Quarterly portfolio review with IC.\nAttendees: David Simms, Harry Turner, Iris Liang, Cynthia Omondi, Herve Sarteau",
  },
  {
    title: "Board Meeting — August cycle",
    eventType: "meeting",
    startsAt: "2026-08-20T13:00:00.000Z",
    endsAt: "2026-08-20T16:00:00.000Z",
    location: "Newtown Square HQ",
    notes:
      "Board pack review and investment committee decisions.\nAttendees: Kathy Drake, David Simms, Christian Hilliard, Dave Tolmie",
  },
  {
    title: "Nairobi team stand-up",
    eventType: "meeting",
    startsAt: "2026-08-12T07:00:00.000Z",
    endsAt: "2026-08-12T07:45:00.000Z",
    location: "Nairobi Office",
    notes:
      "Weekly East Africa operations sync.\nAttendees: Cynthia Omondi, Kenneth Muchina, Mercy Nelima, Carol Rubiro",
  },
  {
    title: "ARC Ride — portfolio site visit",
    eventType: "onsite",
    startsAt: "2026-08-28T06:00:00.000Z",
    endsAt: "2026-08-28T12:00:00.000Z",
    clientName: "ARC Ride",
    location: "Nairobi, Kenya",
    notes:
      "Field visit and quarterly operating review.\nAttendees: Iris Liang, Cynthia Omondi, James Kariuki",
  },
  {
    title: "Burn Manufacturing — ESG audit prep",
    eventType: "onsite",
    startsAt: "2026-09-05T05:30:00.000Z",
    endsAt: "2026-09-05T10:00:00.000Z",
    clientName: "Burn Manufacturing",
    location: "Nairobi, Kenya",
    notes:
      "Pre-audit walkthrough with portfolio ops.\nAttendees: Paul Cherry, Wanjiru Otieno",
  },
  {
    title: "LP quarterly call — Impact Fund",
    eventType: "meeting",
    startsAt: "2026-09-22T15:00:00.000Z",
    endsAt: "2026-09-22T16:00:00.000Z",
    location: "Zoom",
    notes:
      "Investor relations quarterly update.\nAttendees: Michelle Ochieng, Andy Moore, Desiree Latu",
  },
  {
    title: "Pezesha — diligence follow-up",
    eventType: "meeting",
    startsAt: "2026-08-18T11:00:00.000Z",
    endsAt: "2026-08-18T12:00:00.000Z",
    clientName: "Pezesha",
    location: "Video call",
    notes:
      "Credit portfolio metrics and expansion plan.\nAttendees: Linda Kiraithe, Brian Ouma",
  },
  {
    title: "Marketing & Stories planning",
    eventType: "meeting",
    startsAt: "2026-08-14T14:00:00.000Z",
    endsAt: "2026-08-14T15:00:00.000Z",
    location: "Newtown Square HQ",
    notes:
      "Portfolio stories and newsletter calendar.\nAttendees: Desiree Latu, Julie Turner, Brooke Wyman",
  },
  {
    title: "Kenya public holiday — office closed",
    eventType: "other",
    startsAt: "2026-10-10T00:00:00.000Z",
    endsAt: "2026-10-10T23:59:59.000Z",
    location: "Nairobi Office",
    notes: "Huduma Day — Nairobi office closed.\nAttendees: All Nairobi staff",
  },
  {
    title: "Fund operations — NAV close",
    eventType: "meeting",
    startsAt: "2026-08-31T12:00:00.000Z",
    endsAt: "2026-08-31T14:00:00.000Z",
    location: "Nairobi Office",
    notes:
      "Month-end NAV and expense reconciliation.\nAttendees: Andy Moore, Mercy Nelima, Carol Rubiro",
  },
];

async function hasMarkerEvent(workspaceId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("internal_calendar_events")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("title", MARKER_TITLE)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return Boolean(data);
}

/** Idempotent staff calendar fixtures for Talanton Impact. */
export async function ensureTalantonCalendarSeeded(workspaceId: string): Promise<void> {
  if (await hasMarkerEvent(workspaceId)) return;

  for (const seed of TALANTON_CALENDAR_SEEDS) {
    await createCalendarEvent(
      {
        title: seed.title,
        eventType: seed.eventType,
        startsAt: seed.startsAt,
        endsAt: seed.endsAt,
        clientName: seed.clientName,
        location: seed.location,
        notes: seed.notes,
      },
      { workspaceId },
    );
  }
}
