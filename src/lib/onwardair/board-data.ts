/**
 * OnwardAir Board — demo governance data (dashboard, meetings, decks, minutes).
 * Isolated from ABHI board portal seeds.
 */

import { listMergedOpenBoardActions } from "@/lib/onwardair/executive-mutations-store";

export type OaBoardMeetingStatus = "Draft" | "Scheduled" | "Held" | "Archived";

export type OaBoardActionStatus =
  | "Completed"
  | "Underway"
  | "Overdue"
  | "Blocked"
  | "Closed";

export type OaBoardAction = {
  id: string;
  title: string;
  owner: string;
  dueDate: string;
  status: OaBoardActionStatus;
};

export type OaBoardDecision = {
  id: string;
  text: string;
  resolution?: string;
};

export type OaBoardMeeting = {
  id: string;
  meetingDate: string;
  title: string;
  attendees: { name: string; role: string }[];
  agenda: string[];
  decisions: OaBoardDecision[];
  actions: OaBoardAction[];
  notes: string;
  resolutions: string[];
  status: OaBoardMeetingStatus;
};

export type OaBoardDeck = {
  id: string;
  quarter: string;
  packName: string;
  meetingDate: string;
  createdAt: string;
  status: "Approved" | "Draft";
  pageSummaries: string[];
  pdfOpenUrl: string;
  pptxDownloadUrl: string;
};

export type OaBoardMinutesRecord = {
  id: string;
  meetingDate: string;
  title: string;
  minutesSummary: string;
  decisions: OaBoardDecision[];
  resolutions: string[];
  actions: OaBoardAction[];
  status: "Approved";
};

export type OaBoardRisk = {
  id: string;
  description: string;
  impact: "H" | "M" | "L";
  owner: string;
  status: string;
};

const OA_ATTENDEES = [
  { name: "Dr. Scott Parazynski", role: "Founder & CEO / Board Member" },
  { name: "Dylan Taylor", role: "Advisor" },
  { name: "Cameron Burr", role: "Advisor" },
  { name: "Rick Perez", role: "Advisor" },
  { name: "Chris Tucker", role: "Advisor" },
  { name: "Gabe Mena, MD", role: "Advisor" },
  { name: "GEN Duncan McNabb", role: "Advisor" },
] as const;

const STANDARD_AGENDA = [
  "CEO update & programme status",
  "Engineering & certification roadmap",
  "Fundraising & capitalisation",
  "Risk register review",
  "Strategic discussion & AOB",
] as const;

/** Upcoming quarterly cadence — Sept 2026, then every 3 months. */
export const OA_UPCOMING_BOARD_MEETINGS: OaBoardMeeting[] = [
  {
    id: "OA-BM-2026-09",
    meetingDate: "2026-09-10",
    title: "OnwardAir Board Meeting — September 2026",
    attendees: [...OA_ATTENDEES],
    agenda: [...STANDARD_AGENDA],
    decisions: [],
    actions: [],
    notes: "",
    resolutions: [],
    status: "Scheduled",
  },
  {
    id: "OA-BM-2026-12",
    meetingDate: "2026-12-10",
    title: "OnwardAir Board Meeting — December 2026",
    attendees: [...OA_ATTENDEES],
    agenda: [...STANDARD_AGENDA],
    decisions: [],
    actions: [],
    notes: "",
    resolutions: [],
    status: "Scheduled",
  },
  {
    id: "OA-BM-2027-03",
    meetingDate: "2027-03-11",
    title: "OnwardAir Board Meeting — March 2027",
    attendees: [...OA_ATTENDEES],
    agenda: [...STANDARD_AGENDA],
    decisions: [],
    actions: [],
    notes: "",
    resolutions: [],
    status: "Scheduled",
  },
];

/** Held meetings that feed Minutes & Decisions (structure view). */
export const OA_HELD_BOARD_MEETINGS: OaBoardMeeting[] = [
  {
    id: "OA-BM-2025-Q4",
    meetingDate: "2025-12-11",
    title: "OnwardAir Board Meeting — Q4 2025",
    attendees: [...OA_ATTENDEES],
    agenda: [...STANDARD_AGENDA],
    decisions: [
      {
        id: "OA-D-Q4-01",
        text: "Approve projected pre-seed cap table layout against 10M fully diluted shares.",
        resolution: "Approved.",
      },
      {
        id: "OA-D-Q4-02",
        text: "Endorse Houston HQ as primary engineering and governance base through prototype flight.",
        resolution: "Approved unanimously.",
      },
      {
        id: "OA-D-Q4-03",
        text: "Authorise engagement of FAA certification counsel for Vertex VTOL pathway scoping.",
        resolution: "Approved — budget within board tolerance.",
      },
    ],
    actions: [
      {
        id: "OA-A-Q4-01",
        title: "Circulate final pre-seed shareholder register to advisors",
        owner: "Dr. Scott Parazynski",
        dueDate: "2026-01-15",
        status: "Completed",
      },
      {
        id: "OA-A-Q4-02",
        title: "Brief board on FAA Part 21 / experimental path options",
        owner: "GEN Duncan McNabb",
        dueDate: "2026-02-28",
        status: "Completed",
      },
      {
        id: "OA-A-Q4-03",
        title: "Update IP schedule for board pack appendix",
        owner: "Rick Perez",
        dueDate: "2026-01-31",
        status: "Completed",
      },
    ],
    notes:
      "Board confirmed the projected pre-seed capitalisation and directed management to maintain voting control through early flight testing. Certification counsel engagement approved with quarterly reporting to the board.",
    resolutions: [
      "Approve projected pre-seed cap table layout.",
      "Endorse Houston HQ as primary base.",
      "Authorise FAA certification counsel engagement.",
    ],
    status: "Held",
  },
  {
    id: "OA-BM-2026-Q1",
    meetingDate: "2026-03-12",
    title: "OnwardAir Board Meeting — Q1 2026",
    attendees: [...OA_ATTENDEES],
    agenda: [...STANDARD_AGENDA],
    decisions: [
      {
        id: "OA-D-Q1-01",
        text: "Approve FLEX Pod prototype build plan and supplier shortlist.",
        resolution: "Approved.",
      },
      {
        id: "OA-D-Q1-02",
        text: "Authorise Seed raise preparation and data-room standing up for Q3 outreach.",
        resolution: "Approved — management to return with target range.",
      },
      {
        id: "OA-D-Q1-03",
        text: "Defer formal Series A timeline discussion until first powered hover demo.",
        resolution: "Deferred to Q3 board.",
      },
    ],
    actions: [
      {
        id: "OA-A-Q1-01",
        title: "Publish Seed pitch deck v1.4 for advisor review",
        owner: "Dr. Scott Parazynski",
        dueDate: "2026-04-30",
        status: "Completed",
      },
      {
        id: "OA-A-Q1-02",
        title: "Complete battery pack supplier diligence memo",
        owner: "Cameron Burr",
        dueDate: "2026-05-15",
        status: "Completed",
      },
      {
        id: "OA-A-Q1-03",
        title: "Open restricted data room for lead Seed candidates",
        owner: "Rick Perez",
        dueDate: "2026-06-30",
        status: "Underway",
      },
    ],
    notes:
      "Prototype build plan endorsed. Board asked management to prepare Seed materials and keep Series A off the critical path until flight proof points are in hand.",
    resolutions: [
      "Approve FLEX Pod prototype build plan.",
      "Authorise Seed raise preparation.",
      "Defer Series A timeline until hover demo.",
    ],
    status: "Held",
  },
  {
    id: "OA-BM-2026-Q2",
    meetingDate: "2026-06-11",
    title: "OnwardAir Board Meeting — Q2 2026",
    attendees: [...OA_ATTENDEES],
    agenda: [...STANDARD_AGENDA],
    decisions: [
      {
        id: "OA-D-Q2-01",
        text: "Confirm Seed raise target of $5.0M with active outreach through Q4 2026.",
        resolution: "Approved.",
      },
      {
        id: "OA-D-Q2-02",
        text: "Approve expanded ESOP reserve messaging consistent with 15% FD allocation.",
        resolution: "Approved.",
      },
      {
        id: "OA-D-Q2-03",
        text: "Endorse defence-logistics pilot outreach with McNabb advisory lead.",
        resolution: "Approved — quarterly pipeline update required.",
      },
    ],
    actions: [
      {
        id: "OA-A-Q2-01",
        title: "Issue Seed pitch deck v1.5 to pipeline leads",
        owner: "Dr. Scott Parazynski",
        dueDate: "2026-07-31",
        status: "Underway",
      },
      {
        id: "OA-A-Q2-02",
        title: "Schedule September board materials lock two weeks prior",
        owner: "Dylan Taylor",
        dueDate: "2026-08-27",
        status: "Underway",
      },
      {
        id: "OA-A-Q2-03",
        title: "Map defence logistics pilot opportunities for Q4 board",
        owner: "GEN Duncan McNabb",
        dueDate: "2026-09-01",
        status: "Underway",
      },
    ],
    notes:
      "Board locked Seed target at $5.0M and directed continued investor diligence. Defence-logistics pilots remain a strategic focus alongside civilian certification progress.",
    resolutions: [
      "Confirm Seed raise target of $5.0M.",
      "Approve ESOP messaging at 15% FD.",
      "Endorse defence-logistics pilot outreach.",
    ],
    status: "Held",
  },
];

export const OA_BOARD_DECKS: OaBoardDeck[] = [
  {
    id: "oa-deck-q2-2026",
    quarter: "Q2 2026",
    packName: "OnwardAir Board Deck — Q2 2026",
    meetingDate: "2026-06-11",
    createdAt: "2026-06-04T15:00:00.000Z",
    status: "Approved",
    pageSummaries: [
      "CEO programme update",
      "Engineering milestones",
      "Seed raise status",
      "Risk register",
      "Financial snapshot",
    ],
    pdfOpenUrl: "https://files.onwardair.example/board-decks/q2-2026.pdf",
    pptxDownloadUrl: "https://files.onwardair.example/board-decks/q2-2026.pptx",
  },
  {
    id: "oa-deck-q1-2026",
    quarter: "Q1 2026",
    packName: "OnwardAir Board Deck — Q1 2026",
    meetingDate: "2026-03-12",
    createdAt: "2026-03-05T15:00:00.000Z",
    status: "Approved",
    pageSummaries: [
      "Prototype build plan",
      "Cap table review",
      "Certification pathway",
      "Advisor updates",
      "AOB",
    ],
    pdfOpenUrl: "https://files.onwardair.example/board-decks/q1-2026.pdf",
    pptxDownloadUrl: "https://files.onwardair.example/board-decks/q1-2026.pptx",
  },
  {
    id: "oa-deck-q4-2025",
    quarter: "Q4 2025",
    packName: "OnwardAir Board Deck — Q4 2025",
    meetingDate: "2025-12-11",
    createdAt: "2025-12-04T15:00:00.000Z",
    status: "Approved",
    pageSummaries: [
      "Pre-seed capitalisation",
      "Houston HQ setup",
      "IP & team",
      "FAA counsel scope",
      "2026 outlook",
    ],
    pdfOpenUrl: "https://files.onwardair.example/board-decks/q4-2025.pdf",
    pptxDownloadUrl: "https://files.onwardair.example/board-decks/q4-2025.pptx",
  },
];

export function buildOaBoardMinutes(): OaBoardMinutesRecord[] {
  return OA_HELD_BOARD_MEETINGS.map((m) => ({
    id: `min-${m.id}`,
    meetingDate: m.meetingDate,
    title: m.title,
    minutesSummary: m.notes,
    decisions: m.decisions,
    resolutions: m.resolutions.length
      ? m.resolutions
      : m.decisions.map((d) => d.resolution || d.text).filter(Boolean),
    actions: m.actions,
    status: "Approved" as const,
  })).sort((a, b) => b.meetingDate.localeCompare(a.meetingDate));
}

export const OA_BOARD_DASHBOARD_RISKS: OaBoardRisk[] = [
  {
    id: "OA-R-01",
    description: "FAA certification pathway timeline slip delays first flight demo.",
    impact: "H",
    owner: "Dr. Scott Parazynski",
    status: "Mitigating",
  },
  {
    id: "OA-R-02",
    description: "Seed raise closes below $5.0M target before year-end.",
    impact: "H",
    owner: "Rick Perez",
    status: "Open",
  },
  {
    id: "OA-R-03",
    description: "Battery pack supplier lead time extends beyond prototype schedule.",
    impact: "M",
    owner: "Cameron Burr",
    status: "Mitigating",
  },
  {
    id: "OA-R-04",
    description: "Key flight-controls hire delayed — ESOP offer competitiveness.",
    impact: "M",
    owner: "Dylan Taylor",
    status: "Watch",
  },
];

export function getOaBoardDashboardSnapshot(decks: OaBoardDeck[] = OA_BOARD_DECKS) {
  const nextMeeting = OA_UPCOMING_BOARD_MEETINGS[0]!;
  const latestHeld = OA_HELD_BOARD_MEETINGS[OA_HELD_BOARD_MEETINGS.length - 1]!;
  const openActions = listMergedOpenBoardActions().slice(0, 6);
  const recentDecisions = latestHeld.decisions;
  const approvedDecks = decks.filter((d) => d.status === "Approved");
  const latestApprovedPack = approvedDecks[0] ?? decks[0]!;

  return {
    nextMeeting,
    latestHeld,
    openActions,
    highRisks: OA_BOARD_DASHBOARD_RISKS,
    recentDecisions,
    strategicTopics: [
      "Seed raise progress vs $5.0M target",
      "Vertex VTOL / FLEX Pod prototype milestones",
      "FAA certification counsel recommendations",
      "Defence-logistics pilot pipeline",
      "September 2026 board pack lock",
    ],
    financialSnapshot: [
      {
        label: "Capital committed",
        value: "$1.7M",
        hint: "Pre-Seed closed · Cap Table",
      },
      {
        label: "Seed target",
        value: "$5.0M",
        hint: "Active raise through Q4 2026",
      },
      {
        label: "Cash runway",
        value: "~14 mo",
        hint: "At current burn · estimated",
      },
      {
        label: "ESOP reserve",
        value: "15% FD",
        hint: "1.5M shares reserved",
      },
    ],
    latestApprovedPack,
  };
}

export function createAiBoardMeetingDeckDraft(existing: OaBoardDeck[]): OaBoardDeck {
  const stamp = new Date().toISOString();
  const meeting = OA_UPCOMING_BOARD_MEETINGS[0]!;
  return {
    id: `oa-deck-ai-${Date.now().toString(36)}`,
    quarter: "AI Draft",
    packName: `OnwardAir Board Meeting Deck — ${meeting.title.replace("OnwardAir Board Meeting — ", "")} (AI Draft)`,
    meetingDate: meeting.meetingDate,
    createdAt: stamp,
    status: "Draft",
    pageSummaries: [
      "AI-generated executive summary",
      "Programme status",
      "Fundraising update",
      "Risk & actions",
      "Decisions requested",
    ],
    pdfOpenUrl: "https://files.onwardair.example/board-decks/ai-draft.pdf",
    pptxDownloadUrl: "https://files.onwardair.example/board-decks/ai-draft.pptx",
  };
}
