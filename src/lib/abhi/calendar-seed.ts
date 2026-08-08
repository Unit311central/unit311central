import { createCalendarEvent } from "@/lib/internal-calendar-service";
import { appendTimezoneToNotes } from "@/lib/calendar-meeting-time";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

const ABHI_CALENDAR_TIMEZONE = "Europe/London";

const MARKER_TITLE = "ABHI Board Meeting — August cycle";

type CalendarSeed = {
  title: string;
  eventType: "meeting" | "onsite" | "other";
  startsAt: string;
  endsAt: string;
  clientName?: string;
  location?: string;
  notes?: string;
};

const ABHI_CALENDAR_SEEDS: CalendarSeed[] = [
  {
    title: MARKER_TITLE,
    eventType: "meeting",
    startsAt: "2026-08-20T13:00:00.000Z",
    endsAt: "2026-08-20T16:00:00.000Z",
    location: "London HQ · Boardroom",
    notes:
      "Board pack review, membership growth, and WHX Dubai pavilion commitments.\nAttendees: Sir John Bell, Peter Ellingworth, Jane Lewis, Andrew Davies",
  },
  {
    title: "ABHI Value & Access Group",
    eventType: "meeting",
    startsAt: "2026-09-08T10:00:00.000Z",
    endsAt: "2026-09-08T11:30:00.000Z",
    location: "London HQ",
    notes:
      "Member-only working group on NHS adoption pathways.\nAttendees: Judith Mellis, Owain Prescott, Luella Trickett",
  },
  {
    title: "WHX Dubai 2027 — UK pavilion planning",
    eventType: "meeting",
    startsAt: "2026-08-14T14:00:00.000Z",
    endsAt: "2026-08-14T15:30:00.000Z",
    location: "London HQ",
    notes:
      "Exhibitor slot allocation and pavilion design sign-off.\nAttendees: Michelle Michelucci, Peter Ellingworth, Charlotte Hart",
  },
  {
    title: "Membership renewal cycle review",
    eventType: "meeting",
    startsAt: "2026-08-28T09:00:00.000Z",
    endsAt: "2026-08-28T10:30:00.000Z",
    location: "London HQ",
    notes:
      "Q3 renewal outreach and overdue membership follow-ups.\nAttendees: Jane Lewis, Jonathan Evans, Membership Ops",
  },
  {
    title: "DHSC regulatory briefing — MedTech policy",
    eventType: "meeting",
    startsAt: "2026-09-12T11:00:00.000Z",
    endsAt: "2026-09-12T12:00:00.000Z",
    location: "Video call",
    notes:
      "Department of Health and Social Care policy update for members.\nAttendees: Judith Mellis, Phil Brown, Peter Ellingworth",
  },
  {
    title: "ABHI Legal Issues Group",
    eventType: "meeting",
    startsAt: "2026-09-01T10:00:00.000Z",
    endsAt: "2026-09-01T11:30:00.000Z",
    location: "London HQ",
    notes:
      "Member-only legal and compliance roundtable.\nAttendees: Phil Brown, Peter Ellingworth",
  },
  {
    title: "Staff all-hands — H2 priorities",
    eventType: "meeting",
    startsAt: "2026-08-12T08:30:00.000Z",
    endsAt: "2026-08-12T09:30:00.000Z",
    location: "London HQ",
    notes:
      "Membership growth, events calendar, and regulatory intelligence rollout.\nAttendees: All ABHI staff",
  },
  {
    title: "US Accelerator cohort review",
    eventType: "meeting",
    startsAt: "2026-09-18T15:00:00.000Z",
    endsAt: "2026-09-18T16:30:00.000Z",
    location: "Video call",
    clientName: "US Accelerator cohort",
    notes:
      "Quarterly cohort progress and mentor matching.\nAttendees: Paul Benton, Sophie Green, Bayode Adisa",
  },
  {
    title: "Centrak — member site visit",
    eventType: "onsite",
    startsAt: "2026-08-25T09:00:00.000Z",
    endsAt: "2026-08-25T13:00:00.000Z",
    clientName: "Centrak",
    location: "Reading, UK",
    notes:
      "Member engagement visit and WHX exhibitor briefing.\nAttendees: Jonathan Evans, Charlotte Hart",
  },
  {
    title: "UK bank holiday — office closed",
    eventType: "other",
    startsAt: "2026-08-25T00:00:00.000Z",
    endsAt: "2026-08-25T23:59:59.000Z",
    location: "London HQ",
    notes: "Summer bank holiday — London office closed.\nAttendees: All staff",
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

/** Idempotent staff calendar fixtures for ABHI. */
export async function ensureAbhiCalendarSeeded(workspaceId: string): Promise<void> {
  if (await hasMarkerEvent(workspaceId)) return;

  for (const seed of ABHI_CALENDAR_SEEDS) {
    await createCalendarEvent(
      {
        title: seed.title,
        eventType: seed.eventType,
        startsAt: seed.startsAt,
        endsAt: seed.endsAt,
        clientName: seed.clientName,
        location: seed.location,
        notes: appendTimezoneToNotes(seed.notes, ABHI_CALENDAR_TIMEZONE) ?? undefined,
      },
      { workspaceId },
    );
  }
}
