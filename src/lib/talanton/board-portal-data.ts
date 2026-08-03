/**
 * Talanton Impact Board Portal — governance demo data + nav.
 * Board members sourced from https://www.talantonimpact.com/about/our-team (Board of Advisors).
 */

export const TI_BOARD_PORTAL_PATH = "board";
export const TI_BOARD_CLIENT_ID = "ti-cli-board";
export const TI_BOARD_USERNAME = "board@talantonimpact.com";

export type TiBoardPortalSection =
  | "dashboard"
  | "meetings"
  | "decks"
  | "risk"
  | "impact"
  | "journeys"
  | "members";

export const TI_BOARD_NAV: {
  id: TiBoardPortalSection;
  label: string;
  href: string;
}[] = [
  { id: "dashboard", label: "Board Dashboard", href: "/board" },
  { id: "meetings", label: "Board Meetings", href: "/board/meetings" },
  { id: "decks", label: "Board Decks", href: "/board/decks" },
  { id: "risk", label: "Risk Register", href: "/board/risk" },
  { id: "impact", label: "Impact Intelligence", href: "/board/impact" },
  { id: "journeys", label: "Journey Stories", href: "/board/journeys" },
  { id: "members", label: "Board Members", href: "/board/members" },
];

export type TiBoardMember = {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  role: string;
  email: string;
  committees: string[];
};

/** 8 Board of Advisors members from talantonimpact.com/about/our-team */
export const TI_BOARD_MEMBERS: TiBoardMember[] = [
  {
    id: "ti-bm-1",
    firstName: "Kathy",
    lastName: "Drake",
    name: "Kathy Drake",
    role: "Board Chair",
    email: "kathy.drake@talantonimpact.com",
    committees: ["Board", "Nominations"],
  },
  {
    id: "ti-bm-2",
    firstName: "Christian",
    lastName: "Hilliard",
    name: "Christian Hilliard",
    role: "Board Vice Chair",
    email: "christian.hilliard@talantonimpact.com",
    committees: ["Board", "Governance"],
  },
  {
    id: "ti-bm-3",
    firstName: "Dave",
    lastName: "Tolmie",
    name: "Dave Tolmie",
    role: "Board Member, Vice Chair Investment Committee",
    email: "dave.tolmie@talantonimpact.com",
    committees: ["Board", "Investment Committee"],
  },
  {
    id: "ti-bm-4",
    firstName: "Dana",
    lastName: "Wichterman",
    name: "Dana Wichterman",
    role: "Board Member",
    email: "dana.wichterman@talantonimpact.com",
    committees: ["Board"],
  },
  {
    id: "ti-bm-5",
    firstName: "Herve",
    lastName: "Sarteau",
    name: "Herve Sarteau",
    role: "Board Member, Chair Investment Committee",
    email: "herve.sarteau@talantonimpact.com",
    committees: ["Board", "Investment Committee"],
  },
  {
    id: "ti-bm-6",
    firstName: "Jeff",
    lastName: "Meyer",
    name: "Jeff Meyer",
    role: "Board Member",
    email: "jeff.meyer@talantonimpact.com",
    committees: ["Board"],
  },
  {
    id: "ti-bm-7",
    firstName: "Peter",
    lastName: "Thorrington",
    name: "Peter Thorrington",
    role: "Founding Board Chair",
    email: "peter.thorrington@talantonimpact.com",
    committees: ["Board", "Nominations"],
  },
  {
    id: "ti-bm-8",
    firstName: "Sam",
    lastName: "Mwale",
    name: "Sam Mwale",
    role: "Board Member",
    email: "sam.mwale@talantonimpact.com",
    committees: ["Board", "East Africa"],
  },
];

export type TiBoardMeeting = {
  id: string;
  meetingDate: string;
  title: string;
  status: "Draft" | "Scheduled" | "Held" | "Archived";
  agenda: string[];
  decisions: { id: string; text: string; resolution?: string }[];
  actions: { id: string; title: string; owner: string; dueDate: string; status: string }[];
  notes: string;
  resolutions: string[];
};

export const TI_BOARD_MEETINGS: TiBoardMeeting[] = [
  {
    id: "TI-BM-2026-08",
    meetingDate: "2026-08-20",
    title: "Talanton Impact Board Meeting — August 2026",
    status: "Scheduled",
    agenda: [
      "Opening & conflicts",
      "Fund performance & portfolio health",
      "Investment Committee recommendations",
      "Risk register",
      "AOB",
    ],
    decisions: [],
    actions: [
      {
        id: "a1",
        title: "Circulate Q3 portfolio scorecards",
        owner: "David Simms",
        dueDate: "2026-08-15",
        status: "Underway",
      },
    ],
    notes: "",
    resolutions: [],
  },
  {
    id: "TI-BM-2026-05",
    meetingDate: "2026-05-14",
    title: "Talanton Impact Board Meeting — May 2026",
    status: "Held",
    agenda: [
      "Fund NAV & capital calls",
      "Portfolio company deep-dives",
      "East Africa pipeline",
      "Governance & policies",
    ],
    decisions: [
      {
        id: "d1",
        text: "Approve follow-on allocation framework for top-quartile portfolio companies",
        resolution: "Approved",
      },
      {
        id: "d2",
        text: "Confirm Investment Committee chair cadence for H2",
        resolution: "Approved",
      },
    ],
    actions: [
      {
        id: "a2",
        title: "Update LP reporting pack template",
        owner: "Andy Moore",
        dueDate: "2026-06-30",
        status: "Completed",
      },
      {
        id: "a3",
        title: "Schedule East Africa site visit summary for board",
        owner: "Kenneth Muchina",
        dueDate: "2026-07-15",
        status: "Underway",
      },
    ],
    notes: "Quorum achieved. Minutes approved for prior meeting.",
    resolutions: [
      "Follow-on allocation framework approved",
      "IC reporting cadence confirmed for H2 2026",
    ],
  },
];

export type TiBoardPack = {
  id: string;
  packName: string;
  meetingDate: string;
  status: "Final" | "Draft";
  createdAt: string;
  pdfOpenUrl: string;
  pptxDownloadUrl: string;
};

export function getTiDemoApprovedBoardPacks(): TiBoardPack[] {
  return [
    {
      id: "ti-bp-aug",
      packName: "Talanton Impact Board Pack — August 2026",
      meetingDate: "2026-08-20",
      status: "Final",
      createdAt: "2026-08-12T10:00:00Z",
      pdfOpenUrl: "#",
      pptxDownloadUrl: "#",
    },
    {
      id: "ti-bp-may",
      packName: "Talanton Impact Board Pack — May 2026",
      meetingDate: "2026-05-14",
      status: "Final",
      createdAt: "2026-05-07T09:00:00Z",
      pdfOpenUrl: "#",
      pptxDownloadUrl: "#",
    },
  ];
}

export type TiRisk = {
  id: string;
  description: string;
  impact: "H" | "M" | "L";
  likelihood: "H" | "M" | "L";
  owner: string;
  mitigation: string;
  status: string;
  rating: number;
};

export const TI_BOARD_RISKS: TiRisk[] = [
  {
    id: "TI-R01",
    description: "FX volatility affecting East Africa portfolio USD reporting",
    impact: "H",
    likelihood: "M",
    owner: "Andy Moore",
    mitigation: "Natural hedges + quarterly FX review at IC",
    status: "Open",
    rating: 12,
  },
  {
    id: "TI-R02",
    description: "Key-person dependency at two portfolio companies",
    impact: "H",
    likelihood: "M",
    owner: "Iris Liang",
    mitigation: "Succession plans required in next board packs",
    status: "Mitigating",
    rating: 12,
  },
  {
    id: "TI-R03",
    description: "Delayed capital call response from a subset of LPs",
    impact: "M",
    likelihood: "M",
    owner: "Michelle Ochieng",
    mitigation: "IR outreach cadence + liquidity buffer",
    status: "Open",
    rating: 9,
  },
  {
    id: "TI-R04",
    description: "Regulatory change affecting agri/fintech licensees",
    impact: "M",
    likelihood: "L",
    owner: "Cynthia Omondi",
    mitigation: "Counsel monitoring + portfolio compliance checklist",
    status: "Watch",
    rating: 6,
  },
];

export type TiMinutesRecord = {
  id: string;
  meetingId: string;
  meetingDate: string;
  title: string;
  minutesSummary: string;
  decisions: { id: string; text: string; resolution?: string }[];
  resolutions: string[];
  actions: { id: string; title: string; owner: string; dueDate: string; status: string }[];
  status: TiBoardMeeting["status"];
};

export function buildTiMinutesFromMeetings(meetings = TI_BOARD_MEETINGS): TiMinutesRecord[] {
  return meetings
    .filter((m) => m.status === "Held" || m.status === "Archived")
    .map((m) => ({
      id: `min-${m.id}`,
      meetingId: m.id,
      meetingDate: m.meetingDate,
      title: m.title,
      minutesSummary:
        m.notes?.trim() ||
        `Minutes of ${m.title} held on ${m.meetingDate}. Attendance recorded; agenda items discussed; decisions and actions captured below.`,
      decisions: m.decisions,
      resolutions: m.resolutions.length
        ? m.resolutions
        : m.decisions.map((d) => d.resolution || d.text).filter(Boolean),
      actions: m.actions,
      status: m.status,
    }))
    .sort((a, b) => b.meetingDate.localeCompare(a.meetingDate));
}

export function getTiBoardDashboardSnapshot() {
  const packs = getTiDemoApprovedBoardPacks();
  const next =
    TI_BOARD_MEETINGS.filter((m) => m.status === "Scheduled").sort((a, b) =>
      a.meetingDate.localeCompare(b.meetingDate),
    )[0] ?? null;
  const held =
    TI_BOARD_MEETINGS.filter((m) => m.status === "Held").sort((a, b) =>
      b.meetingDate.localeCompare(a.meetingDate),
    )[0] ?? null;
  const openActions = TI_BOARD_MEETINGS.flatMap((m) =>
    m.actions.filter((a) => a.status !== "Completed" && a.status !== "Closed"),
  );
  const highRisks = TI_BOARD_RISKS.filter((r) => r.impact === "H" || r.rating >= 12).slice(0, 4);
  const recentDecisions = held?.decisions ?? [];

  return {
    nextMeeting: next,
    latestHeld: held,
    openActions: openActions.slice(0, 6),
    highRisks,
    recentDecisions,
    strategicTopics: next?.agenda?.slice(0, 5) ?? [
      "Fund stewardship & portfolio health",
      "Investment Committee pipeline",
      "East Africa growth opportunities",
      "Investor communications & Journey Stories",
      "Risk register review",
    ],
    financialSnapshot: [
      { label: "Capital committed", value: "$114m", hint: "Across Impact, Momentum & Stewards" },
      { label: "Active portfolio", value: "19", hint: "Portfolio companies" },
      { label: "East Africa exposure", value: "62%", hint: "By deployed capital" },
      { label: "Available capital", value: "$30m", hint: "Ready for stewardship deployment" },
    ],
    latestApprovedPack: packs[0]!,
  };
}

export function parseTiBoardPortalSection(
  section: string[] | undefined,
): TiBoardPortalSection | null {
  if (!section?.length) return "dashboard";
  const key = section[0]?.toLowerCase();
  if (key === "meetings") return "meetings";
  if (key === "decks" || key === "packs") return "decks";
  // Minutes & Decisions retired as a standalone section — content now lives under Board Meetings.
  if (key === "minutes" || key === "decisions") return "meetings";
  if (key === "risk" || key === "risks") return "risk";
  if (key === "impact" || key === "impact-intelligence") return "impact";
  if (key === "journeys" || key === "journey-stories" || key === "stories") return "journeys";
  if (key === "members") return "members";
  if (key === "dashboard") return "dashboard";
  return null;
}
