/**
 * Northstar Demo — board meetings store (editable, localStorage).
 */

type Listener = () => void;

export type NorthstarMeetingActionStatus =
  | "Completed"
  | "Underway"
  | "Overdue"
  | "Blocked"
  | "Closed";

export type NorthstarMeetingAction = {
  id: string;
  title: string;
  owner: string;
  dueDate: string;
  status: NorthstarMeetingActionStatus;
  notes?: string;
};

export type NorthstarMeetingDecision = {
  id: string;
  text: string;
  resolution?: string;
};

export type NorthstarBoardMeeting = {
  id: string;
  meetingDate: string;
  title: string;
  attendees: { name: string; role: string }[];
  agenda: string[];
  decisions: NorthstarMeetingDecision[];
  actions: NorthstarMeetingAction[];
  notes: string;
  resolutions: string[];
  status: "Draft" | "Scheduled" | "Held" | "Archived";
  /** Linked board pack record id (legacy deck). */
  boardPackId?: string;
  createdAt: string;
  updatedAt: string;
};

export type NorthstarBoardMeetingsState = {
  meetings: NorthstarBoardMeeting[];
};

const STORAGE_KEY = "unit311-northstar-board-meetings-v1";
const listeners = new Set<Listener>();

const NORTHSTAR_ATTENDEES = [
  { name: "Elena Hart", role: "Chief Executive Officer" },
  { name: "James Okonkwo", role: "Chief Technology Officer" },
  { name: "Sarah Pemberton", role: "Chair" },
  { name: "David Chen", role: "Non-Executive Director (Investor)" },
  { name: "Amira Hassan", role: "Independent Non-Executive Director" },
  { name: "Priya Shah", role: "Chief Financial Officer" },
] as const;

const STANDARD_AGENDA = [
  "CEO update & trading performance",
  "Financial overview & cash runway",
  "Atlas programme & delivery",
  "Risk register review",
  "Strategic discussion & AOB",
] as const;

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function nowIso() {
  return new Date().toISOString();
}

function seedMeetings(): NorthstarBoardMeeting[] {
  const stamp = (date: string) => `${date}T16:00:00Z`;
  return [
    {
      id: "NS-BM-2026-Q1",
      meetingDate: "2026-03-20",
      title: "Northstar Board Meeting — Q1 2026",
      attendees: [...NORTHSTAR_ATTENDEES],
      agenda: [...STANDARD_AGENDA],
      decisions: [
        {
          id: "NS-D-Q1-01",
          text: "Approve margin recovery plan targeting 58% gross margin by Q3.",
          resolution: "Approved unanimously.",
        },
        {
          id: "NS-D-Q1-02",
          text: "Authorise phased Atlas go-live with Sheffield Precision Engineering.",
          resolution: "Approved — weekly steering until stabilised.",
        },
        {
          id: "NS-D-Q1-03",
          text: "Elevate supplier concentration (Voltex) to High on the risk register.",
          resolution: "Approved — mitigation plan due Q2 board.",
        },
      ],
      actions: [
        {
          id: "NS-A-Q1-01",
          title: "Present supplier diversification plan (Siemens Industrial MOU)",
          owner: "James Okonkwo",
          dueDate: "2026-05-15",
          status: "Completed",
        },
        {
          id: "NS-A-Q1-02",
          title: "Publish margin recovery dashboard for board portal",
          owner: "Priya Shah",
          dueDate: "2026-04-30",
          status: "Completed",
        },
        {
          id: "NS-A-Q1-03",
          title: "Complete Atlas UAT sign-off with Sheffield",
          owner: "James Okonkwo",
          dueDate: "2026-06-01",
          status: "Underway",
        },
      ],
      notes:
        "Q1 revenue ahead of plan but margin compressed. Board endorsed margin recovery programme and phased Atlas delivery. Supplier risk elevated pending diversification update.",
      resolutions: [
        "Approve margin recovery plan to 58% gross margin.",
        "Authorise phased Atlas go-live.",
        "Elevate Voltex supplier concentration to High risk.",
      ],
      status: "Held",
      boardPackId: "ns-deck-q1-2026",
      createdAt: stamp("2026-03-20"),
      updatedAt: stamp("2026-03-20"),
    },
    {
      id: "NS-BM-2026-Q2",
      meetingDate: "2026-06-19",
      title: "Northstar Board Meeting — Q2 2026",
      attendees: [...NORTHSTAR_ATTENDEES],
      agenda: [...STANDARD_AGENDA],
      decisions: [
        {
          id: "NS-D-Q2-01",
          text: "Confirm US Austin sales expansion — two FTE authorised within burn guardrails.",
          resolution: "Approved.",
        },
        {
          id: "NS-D-Q2-02",
          text: "Approve backup supplier MOU with Siemens Industrial.",
          resolution: "Approved — procurement to execute by July.",
        },
        {
          id: "NS-D-Q2-03",
          text: "Defer Series A timeline discussion until Atlas GA and margin target progress.",
          resolution: "Deferred to Q4 board.",
        },
      ],
      actions: [
        {
          id: "NS-A-Q2-01",
          title: "Execute Siemens Industrial backup supplier MOU",
          owner: "James Okonkwo",
          dueDate: "2026-07-31",
          status: "Underway",
        },
        {
          id: "NS-A-Q2-02",
          title: "Monthly Sheffield executive QBR — standing agenda item",
          owner: "Elena Hart",
          dueDate: "2026-07-15",
          status: "Completed",
        },
        {
          id: "NS-A-Q2-03",
          title: "US pipeline forecast for September board pack",
          owner: "Marcus Reed",
          dueDate: "2026-09-05",
          status: "Underway",
        },
      ],
      notes:
        "Margin recovery on track. Atlas UAT progressing. Board approved US expansion within controlled burn and signed off Siemens backup supplier path.",
      resolutions: [
        "Confirm US Austin expansion (2 FTE).",
        "Approve Siemens Industrial MOU.",
        "Defer Series A discussion to Q4.",
      ],
      status: "Held",
      boardPackId: "ns-deck-q2-2026",
      createdAt: stamp("2026-06-19"),
      updatedAt: stamp("2026-06-19"),
    },
    {
      id: "NS-BM-2026-Q3",
      meetingDate: "2026-09-18",
      title: "Northstar Board Meeting — Q3 2026",
      attendees: [...NORTHSTAR_ATTENDEES],
      agenda: [...STANDARD_AGENDA],
      decisions: [],
      actions: [
        {
          id: "NS-A-Q3-01",
          title: "Circulate Q3 board pack draft two weeks prior",
          owner: "Priya Shah",
          dueDate: "2026-09-04",
          status: "Underway",
        },
      ],
      notes: "Agenda circulated. Pack draft under CFO review.",
      resolutions: [],
      status: "Scheduled",
      boardPackId: "ns-deck-q3-2026-draft",
      createdAt: stamp("2026-08-01"),
      updatedAt: stamp("2026-08-01"),
    },
    {
      id: "NS-BM-2026-Q4",
      meetingDate: "2026-12-11",
      title: "Northstar Board Meeting — Q4 2026",
      attendees: [...NORTHSTAR_ATTENDEES],
      agenda: [
        ...STANDARD_AGENDA,
        "2027 budget preview",
        "Series A readiness discussion",
      ],
      decisions: [],
      actions: [],
      notes: "",
      resolutions: [],
      status: "Scheduled",
      createdAt: stamp("2026-09-01"),
      updatedAt: stamp("2026-09-01"),
    },
  ];
}

let state: NorthstarBoardMeetingsState = { meetings: seedMeetings() };
const serverSnapshot: NorthstarBoardMeetingsState = { meetings: seedMeetings() };
let hydrated = false;

function readPersistedState(): NorthstarBoardMeetingsState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as NorthstarBoardMeetingsState;
    if (!parsed || !Array.isArray(parsed.meetings)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function persistState(next: NorthstarBoardMeetingsState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

function ensureHydrated() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  const persisted = readPersistedState();
  if (persisted) state = persisted;
  else persistState(state);
}

function writeState(next: NorthstarBoardMeetingsState) {
  ensureHydrated();
  state = next;
  persistState(next);
  listeners.forEach((listener) => listener());
}

export function getNorthstarBoardMeetingsState(): NorthstarBoardMeetingsState {
  ensureHydrated();
  return state;
}

export function getNorthstarBoardMeetingsServerSnapshot(): NorthstarBoardMeetingsState {
  return serverSnapshot;
}

export function subscribeNorthstarBoardMeetings(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function nextMeetingId(existing: NorthstarBoardMeeting[]): string {
  const stamp = todayIso().slice(0, 7).replace("-", "");
  const prefix = `NS-BM-${stamp}`;
  const count = existing.filter((m) => m.id.startsWith(prefix)).length;
  return `${prefix}-${String(count + 1).padStart(2, "0")}`;
}

export type UpsertNorthstarBoardMeetingInput = Partial<NorthstarBoardMeeting> & {
  meetingDate: string;
};

export function upsertNorthstarBoardMeeting(
  input: UpsertNorthstarBoardMeetingInput,
): NorthstarBoardMeeting {
  const current = getNorthstarBoardMeetingsState();
  const now = nowIso();
  const existing = input.id
    ? current.meetings.find((row) => row.id === input.id)
    : undefined;

  const next: NorthstarBoardMeeting = {
    id: existing?.id ?? input.id ?? nextMeetingId(current.meetings),
    meetingDate: (input.meetingDate ?? existing?.meetingDate ?? todayIso()).slice(0, 10),
    title: (
      input.title ?? existing?.title ?? `Northstar Board Meeting — ${input.meetingDate}`
    ).trim(),
    attendees: input.attendees ?? existing?.attendees ?? [],
    agenda: input.agenda ?? existing?.agenda ?? [],
    decisions: input.decisions ?? existing?.decisions ?? [],
    actions: input.actions ?? existing?.actions ?? [],
    notes: (input.notes ?? existing?.notes ?? "").trim(),
    resolutions: input.resolutions ?? existing?.resolutions ?? [],
    status: input.status ?? existing?.status ?? "Draft",
    boardPackId: input.boardPackId ?? existing?.boardPackId,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  const meetings = existing
    ? current.meetings.map((row) => (row.id === existing.id ? next : row))
    : [next, ...current.meetings];

  writeState({ meetings });
  return next;
}

export function deleteNorthstarBoardMeeting(id: string) {
  const current = getNorthstarBoardMeetingsState();
  writeState({ meetings: current.meetings.filter((row) => row.id !== id) });
}

export function archiveNorthstarBoardMeeting(id: string) {
  const current = getNorthstarBoardMeetingsState();
  const now = nowIso();
  writeState({
    meetings: current.meetings.map((row) =>
      row.id === id ? { ...row, status: "Archived", updatedAt: now } : row,
    ),
  });
}

export function listHeldNorthstarBoardMeetings(): NorthstarBoardMeeting[] {
  return getNorthstarBoardMeetingsState()
    .meetings.filter((m) => m.status === "Held")
    .slice()
    .sort((a, b) => b.meetingDate.localeCompare(a.meetingDate));
}

export function getNorthstarBoardMeeting(id: string): NorthstarBoardMeeting | null {
  return getNorthstarBoardMeetingsState().meetings.find((m) => m.id === id) ?? null;
}
