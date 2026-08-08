/**
 * ABHI Board Portal — demo governance data (members, minutes index, approved packs).
 */

import {
  getAbhiBoardMeetingsServerSnapshot,
  getLatestHeldAbhiBoardMeeting,
  getNextScheduledAbhiBoardMeeting,
  listOutstandingAbhiMeetingActions,
  listPriorAbhiMeetingDecisions,
  type AbhiBoardMeeting,
} from "@/lib/abhi/board-meetings-store";
import type { AbhiBoardPackRecord } from "@/lib/abhi/board-pack-record";
import {
  getAbhiRiskRegisterServerSnapshot,
  type AbhiRiskRegisterEntry,
} from "@/lib/abhi/risk-register-store";

export const ABHI_BOARD_PORTAL_PATH = "board";
export const ABHI_BOARD_CLIENT_ID = "abhi-cli-board";
export const ABHI_BOARD_USERNAME = "board@abhi.org.uk";

export type AbhiBoardPortalSection =
  | "dashboard"
  | "meetings"
  | "decks"
  | "minutes"
  | "risk"
  | "members";

export const ABHI_BOARD_NAV: {
  id: AbhiBoardPortalSection;
  label: string;
  href: string;
}[] = [
  { id: "dashboard", label: "Board Dashboard", href: "/board" },
  { id: "meetings", label: "Board Meetings", href: "/board/meetings" },
  { id: "decks", label: "Board Decks", href: "/board/decks" },
  { id: "minutes", label: "Minutes & Decisions", href: "/board/minutes" },
  { id: "risk", label: "Risk Register", href: "/board/risk" },
  { id: "members", label: "Board Members", href: "/board/members" },
];

export type AbhiBoardMember = {
  id: string;
  name: string;
  role: string;
  email: string;
  committees: string[];
};

export const ABHI_BOARD_MEMBERS: AbhiBoardMember[] = [
  {
    id: "bm-1",
    name: "Sir John Bell",
    role: "Chair",
    email: "chair@abhi.org.uk",
    committees: ["Nominations", "Strategy"],
  },
  {
    id: "bm-2",
    name: "Peter Ellingworth",
    role: "Chief Executive Officer",
    email: "peter.ellingworth@abhi.org.uk",
    committees: ["Strategy", "Finance"],
  },
  {
    id: "bm-3",
    name: "Jane Lewis",
    role: "Deputy CEO & Chief Financial Officer",
    email: "jane.lewis@abhi.org.uk",
    committees: ["Finance", "Audit & Risk"],
  },
  {
    id: "bm-4",
    name: "Andrew Davies",
    role: "Non-Executive Director",
    email: "andrew.davies@abhi.org.uk",
    committees: ["Digital Health", "Strategy"],
  },
  {
    id: "bm-5",
    name: "Judith Mellis",
    role: "Non-Executive Director",
    email: "judith.mellis@abhi.org.uk",
    committees: ["UK Market Affairs", "Nominations"],
  },
  {
    id: "bm-6",
    name: "Phil Brown",
    role: "Non-Executive Director",
    email: "phil.brown@abhi.org.uk",
    committees: ["Regulatory", "Audit & Risk"],
  },
];

/** Demo approved (Final) packs visible to board members when local history is empty. */
export function getDemoApprovedBoardPacks(): AbhiBoardPackRecord[] {
  return [
    {
      id: "abhi-bp-demo-jul",
      packName: "ABHI Board Pack — July 2026",
      meetingDate: "2026-07-10",
      status: "Final",
      createdAt: "2026-07-03T09:00:00Z",
      folderPath: "Corporate Information / Board Papers / 2026-07",
      pageSummaries: [
        "Cover & agenda",
        "Executive summary",
        "Risk register",
        "Financial snapshot",
        "Strategic discussion",
      ],
      pdfOpenUrl: "#",
      pptxDownloadUrl: "#",
    },
    {
      id: "abhi-bp-demo-aug",
      packName: "ABHI Board Pack — August 2026",
      meetingDate: "2026-08-12",
      status: "Final",
      createdAt: "2026-08-05T10:30:00Z",
      folderPath: "Corporate Information / Board Papers / 2026-08",
      pageSummaries: [
        "Cover & agenda",
        "Previous actions",
        "Membership & commercial",
        "WHX Dubai update",
        "AOB",
      ],
      pdfOpenUrl: "#",
      pptxDownloadUrl: "#",
    },
  ];
}

export type AbhiBoardMinutesRecord = {
  id: string;
  meetingId: string;
  meetingDate: string;
  title: string;
  minutesSummary: string;
  agenda: string[];
  attendees: { name: string; role?: string }[];
  decisions: { id: string; text: string; resolution?: string }[];
  resolutions: string[];
  actions: { id: string; title: string; owner: string; dueDate: string; status: string }[];
  status: AbhiBoardMeeting["status"];
};

export function buildMinutesFromMeetings(meetings?: AbhiBoardMeeting[]): AbhiBoardMinutesRecord[] {
  const list = meetings ?? getAbhiBoardMeetingsServerSnapshot().meetings;
  return list
    .filter((m) => m.status === "Held" || m.status === "Archived")
    .map((m) => ({
      id: `min-${m.id}`,
      meetingId: m.id,
      meetingDate: m.meetingDate,
      title: m.title,
      minutesSummary:
        m.notes?.trim() ||
        `Minutes of ${m.title} held on ${m.meetingDate}. Attendance recorded; agenda items discussed; decisions and actions captured below.`,
      agenda: m.agenda ?? [],
      attendees: m.attendees ?? [],
      decisions: m.decisions,
      resolutions: m.resolutions?.length
        ? m.resolutions
        : m.decisions.map((d) => d.resolution || d.text).filter(Boolean),
      actions: m.actions.map((a) => ({
        id: a.id,
        title: a.title,
        owner: a.owner,
        dueDate: a.dueDate,
        status: a.status,
      })),
      status: m.status,
    }))
    .sort((a, b) => b.meetingDate.localeCompare(a.meetingDate));
}

export type AbhiBoardDashboardSnapshot = {
  nextMeeting: AbhiBoardMeeting | null;
  latestHeld: AbhiBoardMeeting | null;
  openActions: ReturnType<typeof listOutstandingAbhiMeetingActions>;
  highRisks: AbhiRiskRegisterEntry[];
  recentDecisions: ReturnType<typeof listPriorAbhiMeetingDecisions>;
  strategicTopics: string[];
  financialSnapshot: { label: string; value: string; hint: string }[];
  latestApprovedPack: AbhiBoardPackRecord;
};

export function getAbhiBoardDashboardSnapshot(
  approvedPacks?: AbhiBoardPackRecord[],
): AbhiBoardDashboardSnapshot {
  const packs = approvedPacks?.length ? approvedPacks : getDemoApprovedBoardPacks();
  const risks = getAbhiRiskRegisterServerSnapshot().risks.filter((r) => !r.archived);
  const highRisks = risks
    .filter((r) => r.impact === "H" || r.rating >= 12)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 4);
  const next = getNextScheduledAbhiBoardMeeting();
  const held = getLatestHeldAbhiBoardMeeting();

  return {
    nextMeeting: next,
    latestHeld: held,
    openActions: listOutstandingAbhiMeetingActions().slice(0, 6),
    highRisks,
    recentDecisions: listPriorAbhiMeetingDecisions().slice(0, 6),
    strategicTopics: next?.agenda?.slice(0, 5) ??
      held?.agenda?.slice(0, 5) ?? [
        "Membership growth & SME cohort",
        "WHX Dubai pavilion readiness",
        "NHS MedTech Funding Mandate engagement",
        "Sponsorship recovery plan",
        "Regulatory horizon scanning",
      ],
    financialSnapshot: [
      { label: "YTD membership revenue", value: "£2.0m", hint: "Calendar YTD" },
      { label: "Cash position", value: "£1.0m", hint: "Operating reserve held" },
      { label: "Events pipeline", value: "£920k", hint: "WHX + Medica committed" },
      { label: "Budget variance", value: "−2.1%", hint: "Within board tolerance" },
    ],
    latestApprovedPack: packs[0]!,
  };
}

export function parseBoardPortalSection(
  section: string[] | undefined,
): AbhiBoardPortalSection | null {
  if (!section?.length) return "dashboard";
  const key = section[0]?.toLowerCase();
  if (key === "meetings") return "meetings";
  if (key === "decks" || key === "packs") return "decks";
  if (key === "minutes" || key === "decisions") return "minutes";
  if (key === "risk" || key === "risks") return "risk";
  if (key === "members") return "members";
  if (key === "dashboard") return "dashboard";
  return null;
}
