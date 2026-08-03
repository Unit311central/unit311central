/**
 * Talanton Phase 2 — Minutes & Decisions governance store.
 * Realistic board + management meeting fixtures with CRUD + archive.
 */

type Listener = () => void;

export type MeetingType =
  | "Board Meeting"
  | "Investment Committee"
  | "Management Meeting"
  | "Impact Review"
  | "Special Committee";

export type MeetingStatus = "Draft" | "Scheduled" | "Held" | "Archived";
export type ActionStatus = "Open" | "Underway" | "Completed" | "Overdue";
export type DecisionStatus = "Proposed" | "Approved" | "Deferred" | "Rejected";

export type GovernanceAttendee = {
  name: string;
  role: string;
};

export type GovernanceDecision = {
  id: string;
  text: string;
  status: DecisionStatus;
  owner: string;
};

export type GovernanceAction = {
  id: string;
  title: string;
  owner: string;
  dueDate: string;
  status: ActionStatus;
};

export type GovernanceMeeting = {
  id: string;
  meetingDate: string;
  meetingType: MeetingType;
  title: string;
  status: MeetingStatus;
  attendees: GovernanceAttendee[];
  minutes: string;
  decisions: GovernanceDecision[];
  actions: GovernanceAction[];
  archived: boolean;
  createdAt: string;
  updatedAt: string;
};

function nowIso() {
  return new Date().toISOString();
}

function id(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

const SEED: GovernanceMeeting[] = [
  {
    id: "gov-bm-2026-08",
    meetingDate: "2026-08-20",
    meetingType: "Board Meeting",
    title: "Talanton Impact Board — August 2026",
    status: "Scheduled",
    attendees: [
      { name: "Kathy Drake", role: "Board Chair" },
      { name: "Christian Hilliard", role: "Vice Chair" },
      { name: "Herve Sarteau", role: "IC Chair" },
      { name: "Harry Turner", role: "Management" },
      { name: "David Simms", role: "Portfolio Ops" },
    ],
    minutes: "Agenda circulated. Capital call status and East Africa pipeline scheduled for review.",
    decisions: [
      {
        id: "d-aug-1",
        text: "Confirm August board pack distribution timeline",
        status: "Proposed",
        owner: "Harry Turner",
      },
    ],
    actions: [
      {
        id: "a-aug-1",
        title: "Circulate Q3 portfolio scorecards to Board",
        owner: "David Simms",
        dueDate: "2026-08-15",
        status: "Underway",
      },
      {
        id: "a-aug-2",
        title: "Finalise board pack PDF",
        owner: "Portfolio Ops",
        dueDate: "2026-08-18",
        status: "Open",
      },
    ],
    archived: false,
    createdAt: "2026-07-28T10:00:00.000Z",
    updatedAt: "2026-08-01T09:00:00.000Z",
  },
  {
    id: "gov-bm-2026-05",
    meetingDate: "2026-05-14",
    meetingType: "Board Meeting",
    title: "Talanton Impact Board — May 2026",
    status: "Held",
    attendees: [
      { name: "Kathy Drake", role: "Board Chair" },
      { name: "Christian Hilliard", role: "Vice Chair" },
      { name: "Dave Tolmie", role: "Board / IC" },
      { name: "Dana Wichterman", role: "Board Member" },
      { name: "Herve Sarteau", role: "IC Chair" },
      { name: "Jeff Meyer", role: "Board Member" },
      { name: "Peter Thorrington", role: "Founding Chair" },
      { name: "Sam Mwale", role: "Board Member" },
      { name: "Harry Turner", role: "Management" },
    ],
    minutes:
      "Quorum achieved. Fund NAV and portfolio health reviewed. Follow-on allocation framework approved for top-quartile holdings. IC cadence confirmed for H2. Prior minutes approved without amendment.",
    decisions: [
      {
        id: "d-may-1",
        text: "Approve follow-on allocation framework for top-quartile portfolio companies",
        status: "Approved",
        owner: "Herve Sarteau",
      },
      {
        id: "d-may-2",
        text: "Confirm Investment Committee reporting cadence for H2 2026",
        status: "Approved",
        owner: "Dave Tolmie",
      },
      {
        id: "d-may-3",
        text: "Defer Kenya mobility follow-on pending rider income diligence",
        status: "Deferred",
        owner: "Harry Turner",
      },
    ],
    actions: [
      {
        id: "a-may-1",
        title: "Update LP reporting pack template",
        owner: "Andy Moore",
        dueDate: "2026-06-30",
        status: "Completed",
      },
      {
        id: "a-may-2",
        title: "Schedule East Africa site visit summary for Board",
        owner: "Kenneth Muchina",
        dueDate: "2026-07-15",
        status: "Completed",
      },
      {
        id: "a-may-3",
        title: "Prepare ARC Ride rider economics memo for IC",
        owner: "Impact Director",
        dueDate: "2026-08-10",
        status: "Underway",
      },
    ],
    archived: false,
    createdAt: "2026-05-01T08:00:00.000Z",
    updatedAt: "2026-05-20T12:00:00.000Z",
  },
  {
    id: "gov-ic-2026-07",
    meetingDate: "2026-07-09",
    meetingType: "Investment Committee",
    title: "Investment Committee — July 2026",
    status: "Held",
    attendees: [
      { name: "Herve Sarteau", role: "IC Chair" },
      { name: "Dave Tolmie", role: "Vice Chair IC" },
      { name: "Harry Turner", role: "Management" },
      { name: "Impact Director", role: "Impact" },
    ],
    minutes:
      "Reviewed three pipeline opportunities (SunHarvest Agro, HustlePay, Mwanzo Renewables). Approved diligence budget for agri offtake and MSME inclusion tickets. Faith-aligned distribution partnership noted as strategic option.",
    decisions: [
      {
        id: "d-ic-1",
        text: "Approve diligence budget for SunHarvest Agro (Zambia agri offtake)",
        status: "Approved",
        owner: "Harry Turner",
      },
      {
        id: "d-ic-2",
        text: "Advance HustlePay to IC memo stage subject to collections QA",
        status: "Approved",
        owner: "Impact Director",
      },
    ],
    actions: [
      {
        id: "a-ic-1",
        title: "Open data room request — SunHarvest Agro",
        owner: "Portfolio Ops",
        dueDate: "2026-07-18",
        status: "Completed",
      },
      {
        id: "a-ic-2",
        title: "Commission HustlePay collections reference calls",
        owner: "Harry Turner",
        dueDate: "2026-08-05",
        status: "Underway",
      },
      {
        id: "a-ic-3",
        title: "Map DFI co-invest interest for C&I solar",
        owner: "Impact Director",
        dueDate: "2026-08-20",
        status: "Open",
      },
    ],
    archived: false,
    createdAt: "2026-07-01T09:00:00.000Z",
    updatedAt: "2026-07-12T16:00:00.000Z",
  },
  {
    id: "gov-mgmt-2026-07",
    meetingDate: "2026-07-22",
    meetingType: "Management Meeting",
    title: "Talanton Leadership — Weekly Ops",
    status: "Held",
    attendees: [
      { name: "Harry Turner", role: "Leadership" },
      { name: "David Simms", role: "Portfolio Ops" },
      { name: "Impact Director", role: "Impact" },
      { name: "Head of Compliance", role: "Compliance" },
    ],
    minutes:
      "Portfolio training attention list reviewed (poa!, Pezesha, Auto Springs). Marketing & Stories pipeline for Q3 investor update agreed. Compliance to chase overdue AML modules.",
    decisions: [
      {
        id: "d-mgmt-1",
        text: "Prioritise poa! Internet infosec remediation for August board pack",
        status: "Approved",
        owner: "Technology Risk Lead",
      },
    ],
    actions: [
      {
        id: "a-mgmt-1",
        title: "Chase overdue AML assignments at Pezesha",
        owner: "Head of Compliance",
        dueDate: "2026-08-05",
        status: "Overdue",
      },
      {
        id: "a-mgmt-2",
        title: "Publish Q3 investor story shortlist",
        owner: "Portfolio Ops",
        dueDate: "2026-08-08",
        status: "Underway",
      },
    ],
    archived: false,
    createdAt: "2026-07-22T08:00:00.000Z",
    updatedAt: "2026-07-22T11:00:00.000Z",
  },
  {
    id: "gov-impact-2026-06",
    meetingDate: "2026-06-18",
    meetingType: "Impact Review",
    title: "Portfolio Impact Review — Mid-Year",
    status: "Held",
    attendees: [
      { name: "Impact Director", role: "Chair" },
      { name: "Harry Turner", role: "Leadership" },
      { name: "Kathy Drake", role: "Board observer" },
      { name: "Sam Mwale", role: "Board / East Africa" },
    ],
    minutes:
      "Jobs, women employment and community reach reviewed across 19 holdings. Kijani Forestry and Ethical Apparel Africa highlighted. Declining employment signals flagged at two manufacturing holdings.",
    decisions: [
      {
        id: "d-imp-1",
        text: "Require impact data refresh from holdings below 70% compliance before LP letter",
        status: "Approved",
        owner: "Impact Director",
      },
    ],
    actions: [
      {
        id: "a-imp-1",
        title: "Request impact metric refresh — Auto Springs & Burn",
        owner: "Impact Director",
        dueDate: "2026-07-10",
        status: "Completed",
      },
    ],
    archived: false,
    createdAt: "2026-06-10T09:00:00.000Z",
    updatedAt: "2026-06-20T10:00:00.000Z",
  },
  {
    id: "gov-bm-2026-02",
    meetingDate: "2026-02-12",
    meetingType: "Board Meeting",
    title: "Talanton Impact Board — February 2026",
    status: "Archived",
    attendees: [
      { name: "Kathy Drake", role: "Board Chair" },
      { name: "Christian Hilliard", role: "Vice Chair" },
      { name: "Peter Thorrington", role: "Founding Chair" },
      { name: "Harry Turner", role: "Management" },
    ],
    minutes:
      "Annual strategy refresh. Affirmed faith-driven SSA mandate and 2026 deployment targets. Archived after May minutes approval.",
    decisions: [
      {
        id: "d-feb-1",
        text: "Affirm 2026 deployment priorities: agri offtake, inclusion credit, C&I energy",
        status: "Approved",
        owner: "Kathy Drake",
      },
    ],
    actions: [
      {
        id: "a-feb-1",
        title: "Publish 2026 strategy one-pager for LPs",
        owner: "Harry Turner",
        dueDate: "2026-03-01",
        status: "Completed",
      },
    ],
    archived: true,
    createdAt: "2026-02-01T08:00:00.000Z",
    updatedAt: "2026-05-14T12:00:00.000Z",
  },
];

let meetings: GovernanceMeeting[] = SEED.map((m) => ({
  ...m,
  attendees: [...m.attendees],
  decisions: m.decisions.map((d) => ({ ...d })),
  actions: m.actions.map((a) => ({ ...a })),
}));

/** Cached for useSyncExternalStore — must be referentially stable between emits. */
let snapshot: { meetings: GovernanceMeeting[] } = { meetings };

const listeners = new Set<Listener>();

function emit() {
  snapshot = { meetings };
  for (const l of listeners) l();
}

export function subscribeTalantonGovernanceStore(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getTalantonGovernanceSnapshot() {
  return snapshot;
}

export function listMeetings(opts?: { includeArchived?: boolean }) {
  const includeArchived = opts?.includeArchived ?? true;
  return meetings
    .filter((m) => (includeArchived ? true : !m.archived))
    .sort((a, b) => Date.parse(b.meetingDate) - Date.parse(a.meetingDate));
}

export function upsertMeeting(input: Omit<GovernanceMeeting, "createdAt" | "updatedAt"> & {
  createdAt?: string;
}) {
  const existing = meetings.find((m) => m.id === input.id);
  const next: GovernanceMeeting = {
    ...input,
    createdAt: existing?.createdAt ?? input.createdAt ?? nowIso(),
    updatedAt: nowIso(),
  };
  meetings = existing
    ? meetings.map((m) => (m.id === next.id ? next : m))
    : [next, ...meetings];
  emit();
  return next;
}

export function createMeeting(partial?: Partial<GovernanceMeeting>) {
  const meeting: GovernanceMeeting = {
    id: id("gov"),
    meetingDate: partial?.meetingDate ?? new Date().toISOString().slice(0, 10),
    meetingType: partial?.meetingType ?? "Management Meeting",
    title: partial?.title ?? "New governance meeting",
    status: partial?.status ?? "Draft",
    attendees: partial?.attendees ?? [],
    minutes: partial?.minutes ?? "",
    decisions: partial?.decisions ?? [],
    actions: partial?.actions ?? [],
    archived: false,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  meetings = [meeting, ...meetings];
  emit();
  return meeting;
}

export function deleteMeeting(meetingId: string) {
  meetings = meetings.filter((m) => m.id !== meetingId);
  emit();
}

export function archiveMeeting(meetingId: string, archived = true) {
  meetings = meetings.map((m) =>
    m.id === meetingId
      ? { ...m, archived, status: archived ? "Archived" : m.status === "Archived" ? "Held" : m.status, updatedAt: nowIso() }
      : m,
  );
  emit();
}

export function allDecisions() {
  return listMeetings().flatMap((m) =>
    m.decisions.map((d) => ({
      ...d,
      meetingId: m.id,
      meetingTitle: m.title,
      meetingDate: m.meetingDate,
      meetingType: m.meetingType,
    })),
  );
}

export function allActions() {
  return listMeetings().flatMap((m) =>
    m.actions.map((a) => ({
      ...a,
      meetingId: m.id,
      meetingTitle: m.title,
      meetingDate: m.meetingDate,
      meetingType: m.meetingType,
    })),
  );
}

export function governanceKpis() {
  const active = listMeetings({ includeArchived: false });
  const decisions = allDecisions();
  const actions = allActions();
  const openActions = actions.filter((a) => a.status === "Open" || a.status === "Underway" || a.status === "Overdue");
  const overdue = actions.filter((a) => a.status === "Overdue");
  const approved = decisions.filter((d) => d.status === "Approved");
  return {
    meetingsActive: active.length,
    meetingsHeld: active.filter((m) => m.status === "Held").length,
    decisionsApproved: approved.length,
    decisionsPending: decisions.filter((d) => d.status === "Proposed" || d.status === "Deferred").length,
    actionsOpen: openActions.length,
    actionsOverdue: overdue.length,
  };
}

export function governanceTimeline() {
  const events: {
    id: string;
    date: string;
    kind: "Meeting" | "Decision" | "Action";
    title: string;
    detail: string;
    status: string;
  }[] = [];

  for (const m of listMeetings()) {
    events.push({
      id: `t-m-${m.id}`,
      date: m.meetingDate,
      kind: "Meeting",
      title: m.title,
      detail: `${m.meetingType} · ${m.status}`,
      status: m.status,
    });
    for (const d of m.decisions) {
      events.push({
        id: `t-d-${d.id}`,
        date: m.meetingDate,
        kind: "Decision",
        title: d.text,
        detail: `${m.title} · Owner ${d.owner}`,
        status: d.status,
      });
    }
    for (const a of m.actions) {
      events.push({
        id: `t-a-${a.id}`,
        date: a.dueDate,
        kind: "Action",
        title: a.title,
        detail: `${m.title} · Owner ${a.owner}`,
        status: a.status,
      });
    }
  }

  return events.sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
}

export function blankDecision(): GovernanceDecision {
  return { id: id("dec"), text: "", status: "Proposed", owner: "Harry Turner" };
}

export function blankAction(): GovernanceAction {
  return {
    id: id("act"),
    title: "",
    owner: "Portfolio Ops",
    dueDate: new Date().toISOString().slice(0, 10),
    status: "Open",
  };
}
