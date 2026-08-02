/**
 * ABHI Board Meetings — outcomes store (during / after meeting).
 * Board Pack = before meeting; Board Meeting outputs feed future packs.
 */

type Listener = () => void;

export type AbhiMeetingActionStatus =
  | "Completed"
  | "Underway"
  | "Overdue"
  | "Blocked"
  | "Closed";

export type AbhiMeetingAction = {
  id: string;
  title: string;
  owner: string;
  dueDate: string;
  status: AbhiMeetingActionStatus;
  notes?: string;
};

export type AbhiMeetingDecision = {
  id: string;
  text: string;
  resolution?: string;
};

export type AbhiBoardMeeting = {
  id: string;
  meetingDate: string;
  title: string;
  attendees: { name: string; role: string }[];
  agenda: string[];
  decisions: AbhiMeetingDecision[];
  actions: AbhiMeetingAction[];
  notes: string;
  resolutions: string[];
  status: "Draft" | "Scheduled" | "Held" | "Archived";
  createdAt: string;
  updatedAt: string;
};

export type AbhiBoardMeetingsState = {
  meetings: AbhiBoardMeeting[];
};

const STORAGE_KEY = "unit311-abhi-board-meetings-v2";
const listeners = new Set<Listener>();

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function nowIso() {
  return new Date().toISOString();
}

function seedMeetings(): AbhiBoardMeeting[] {
  const stamp = (date: string) => `${date}T16:00:00Z`;
  return [
    {
      id: "BM-2026-07",
      meetingDate: "2026-07-10",
      title: "ABHI Board Meeting — July 2026",
      attendees: [
        { name: "Peter Ellingworth", role: "Chief Executive Officer" },
        { name: "Jane Lewis", role: "Deputy CEO & Chief Financial Officer" },
        { name: "Andrew Davies", role: "Director, Digital Health" },
        { name: "Judith Mellis", role: "Director, UK Market Affairs" },
        { name: "Paul Benton", role: "Director, International" },
        { name: "Michelle Michelucci", role: "Director, International Events" },
        { name: "Phil Brown", role: "Director, Regulatory Affairs" },
      ],
      agenda: [
        "Executive Summary",
        "Previous Actions",
        "Risk Register",
        "Financial Overview",
        "Commercial Performance",
        "Strategic Discussion & AOB",
      ],
      decisions: [
        {
          id: "D-071",
          text: "Approve WHX Dubai venue contract with DWTC.",
          resolution: "Approved unanimously.",
        },
        {
          id: "D-072",
          text: "Endorse NHS MFM briefing circulation to all members.",
          resolution: "Approved.",
        },
        {
          id: "D-073",
          text: "Defer Q4 sponsorship recovery plan detail to August board.",
          resolution: "Deferred — pack to include recovery options.",
        },
      ],
      actions: [
        {
          id: "BA-241",
          title:
            "Publish Q2 membership growth dashboard to the board portal, including new/lost/net movement and SME cohort analysis",
          owner: "Jane Lewis",
          dueDate: "2026-07-18",
          status: "Completed",
        },
        {
          id: "BA-238",
          title: "Sign WHX Dubai venue contract with DWTC and confirm pavilion footprint for 32 member slots",
          owner: "Michelle Michelucci",
          dueDate: "2026-07-25",
          status: "Completed",
        },
        {
          id: "BA-235",
          title: "Circulate NHS MedTech Funding Mandate briefing slides and survey results to all members",
          owner: "Luella Trickett",
          dueDate: "2026-07-30",
          status: "Completed",
        },
        {
          id: "BA-247",
          title:
            "Finalise MHRA SaMD consultation member response pack, incorporating SME impact assessment and recommended ABHI position",
          owner: "Phil Brown",
          dueDate: "2026-08-15",
          status: "Underway",
        },
        {
          id: "BA-249",
          title:
            "Secure MedCore Partners tier-one sponsorship renewal and confirm WHX co-brand package terms before Q4 close",
          owner: "Jonathan Evans",
          dueDate: "2026-08-30",
          status: "Underway",
        },
        {
          id: "BA-252",
          title:
            "Complete WHX pavilion stand elevations and supplier programme for board sign-off ahead of deposit deadline",
          owner: "Michelle Michelucci",
          dueDate: "2026-09-05",
          status: "Blocked",
        },
        {
          id: "BA-244",
          title:
            "Chase three SME membership invoices totalling £18k that are more than 60 days overdue and escalate to Finance Committee if unpaid",
          owner: "Jane Lewis",
          dueDate: "2026-08-01",
          status: "Overdue",
        },
        {
          id: "BA-246",
          title:
            "Submit updated NHS supplier registration evidence pack to NHS England, including insurance certificates and policy statements",
          owner: "Judith Mellis",
          dueDate: "2026-07-28",
          status: "Overdue",
        },
      ],
      notes:
        "Board noted sponsorship shortfall risk and requested an August recovery plan. WHX deposit authority to be tabled next meeting.",
      resolutions: [
        "WHX Dubai venue contract approved.",
        "NHS MFM briefing circulation endorsed.",
        "Q4 sponsorship recovery plan deferred to August board.",
      ],
      status: "Held",
      createdAt: stamp("2026-07-10"),
      updatedAt: stamp("2026-07-10"),
    },
    {
      id: "BM-2026-08",
      meetingDate: "2026-08-12",
      title: "ABHI Board Meeting — August 2026",
      attendees: [
        { name: "Peter Ellingworth", role: "Chief Executive Officer" },
        { name: "Jane Lewis", role: "Deputy CEO & Chief Financial Officer" },
        { name: "Andrew Davies", role: "Director, Digital Health" },
        { name: "Judith Mellis", role: "Director, UK Market Affairs" },
        { name: "Paul Benton", role: "Director, International" },
        { name: "Michelle Michelucci", role: "Director, International Events" },
        { name: "Phil Brown", role: "Director, Regulatory Affairs" },
        { name: "Jonathan Evans", role: "Commercial Director" },
      ],
      agenda: [
        "Executive Summary",
        "Previous Actions",
        "Risk Register",
        "Financial Overview",
        "Commercial Performance",
        "Strategic Discussion & AOB",
      ],
      decisions: [],
      actions: [],
      notes: "",
      resolutions: [],
      status: "Scheduled",
      createdAt: stamp("2026-07-28"),
      updatedAt: stamp("2026-07-28"),
    },
  ];
}

let state: AbhiBoardMeetingsState = { meetings: seedMeetings() };
const serverSnapshot: AbhiBoardMeetingsState = { meetings: seedMeetings() };
let hydrated = false;

function readPersistedState(): AbhiBoardMeetingsState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AbhiBoardMeetingsState;
    if (!parsed || !Array.isArray(parsed.meetings)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function persistState(next: AbhiBoardMeetingsState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore quota
  }
}

function ensureHydrated() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  const persisted = readPersistedState();
  if (persisted) state = persisted;
  else persistState(state);
}

function writeState(next: AbhiBoardMeetingsState) {
  ensureHydrated();
  state = next;
  persistState(next);
  listeners.forEach((listener) => listener());
}

export function getAbhiBoardMeetingsState(): AbhiBoardMeetingsState {
  ensureHydrated();
  return state;
}

export function getAbhiBoardMeetingsServerSnapshot(): AbhiBoardMeetingsState {
  return serverSnapshot;
}

export function subscribeAbhiBoardMeetings(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function nextMeetingId(existing: AbhiBoardMeeting[]): string {
  const stamp = todayIso().slice(0, 7).replace("-", "");
  const prefix = `BM-${stamp}`;
  const count = existing.filter((m) => m.id.startsWith(prefix)).length;
  return `${prefix}-${String(count + 1).padStart(2, "0")}`;
}

export type UpsertAbhiBoardMeetingInput = Partial<AbhiBoardMeeting> & {
  meetingDate: string;
};

export function upsertAbhiBoardMeeting(input: UpsertAbhiBoardMeetingInput): AbhiBoardMeeting {
  const current = getAbhiBoardMeetingsState();
  const now = nowIso();
  const existing = input.id
    ? current.meetings.find((row) => row.id === input.id)
    : undefined;

  const next: AbhiBoardMeeting = {
    id: existing?.id ?? input.id ?? nextMeetingId(current.meetings),
    meetingDate: (input.meetingDate ?? existing?.meetingDate ?? todayIso()).slice(0, 10),
    title: (input.title ?? existing?.title ?? `ABHI Board Meeting — ${input.meetingDate}`).trim(),
    attendees: input.attendees ?? existing?.attendees ?? [],
    agenda: input.agenda ?? existing?.agenda ?? [],
    decisions: input.decisions ?? existing?.decisions ?? [],
    actions: input.actions ?? existing?.actions ?? [],
    notes: (input.notes ?? existing?.notes ?? "").trim(),
    resolutions: input.resolutions ?? existing?.resolutions ?? [],
    status: input.status ?? existing?.status ?? "Draft",
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  const meetings = existing
    ? current.meetings.map((row) => (row.id === existing.id ? next : row))
    : [next, ...current.meetings];

  writeState({ meetings });
  return next;
}

export function deleteAbhiBoardMeeting(id: string) {
  const current = getAbhiBoardMeetingsState();
  writeState({ meetings: current.meetings.filter((row) => row.id !== id) });
}

export function archiveAbhiBoardMeeting(id: string) {
  const current = getAbhiBoardMeetingsState();
  const now = nowIso();
  writeState({
    meetings: current.meetings.map((row) =>
      row.id === id ? { ...row, status: "Archived", updatedAt: now } : row,
    ),
  });
}

/** Most recent held (non-archived) meeting — primary source for prior actions/decisions. */
export function getLatestHeldAbhiBoardMeeting(): AbhiBoardMeeting | null {
  return (
    getAbhiBoardMeetingsState()
      .meetings.filter((m) => m.status === "Held")
      .slice()
      .sort((a, b) => b.meetingDate.localeCompare(a.meetingDate))[0] ?? null
  );
}

/**
 * Nearest future Board Meeting for Board Pack generation.
 * Includes Scheduled and Draft meetings on or after today; excludes Held / Archived.
 */
export function getNextScheduledAbhiBoardMeeting(
  asOfIso: string = todayIso(),
): AbhiBoardMeeting | null {
  const today = asOfIso.slice(0, 10);
  return (
    getAbhiBoardMeetingsState()
      .meetings.filter(
        (m) =>
          (m.status === "Scheduled" || m.status === "Draft") &&
          m.meetingDate >= today,
      )
      .slice()
      .sort((a, b) => a.meetingDate.localeCompare(b.meetingDate))[0] ?? null
  );
}

export function listOutstandingAbhiMeetingActions(): AbhiMeetingAction[] {
  return getAbhiBoardMeetingsState()
    .meetings.filter((m) => m.status !== "Archived")
    .flatMap((m) => m.actions)
    .filter((a) => a.status !== "Completed" && a.status !== "Closed");
}

export function listClosedAbhiMeetingActions(): AbhiMeetingAction[] {
  return getAbhiBoardMeetingsState()
    .meetings.filter((m) => m.status !== "Archived")
    .flatMap((m) => m.actions)
    .filter((a) => a.status === "Completed" || a.status === "Closed");
}

export function listPriorAbhiMeetingDecisions(): AbhiMeetingDecision[] {
  const latest = getLatestHeldAbhiBoardMeeting();
  return latest?.decisions ?? [];
}
