/**
 * OmniTransit Board Portal — public routes, navigation, and demo governance content.
 */

import { SAEC_DIRECTORS } from "@/lib/saec/demo/people";
import { SAEC_LEGAL_NAME } from "@/lib/saec/demo/company";

export const OT_BOARD_PORTAL_PATH = "board";

export type OtBoardPortalSection =
  | "dashboard"
  | "meetings"
  | "minutes"
  | "decisions"
  | "actions"
  | "papers"
  | "members"
  | "governance";

export const OT_BOARD_NAV: {
  id: OtBoardPortalSection;
  label: string;
  href: string;
}[] = [
  { id: "dashboard", label: "Board overview", href: "/board" },
  { id: "members", label: "Directors", href: "/board/members" },
  { id: "meetings", label: "Meetings", href: "/board/meetings" },
  { id: "minutes", label: "Minutes", href: "/board/minutes" },
  { id: "decisions", label: "Decisions", href: "/board/decisions" },
  { id: "actions", label: "Actions", href: "/board/actions" },
  { id: "papers", label: "Board papers", href: "/board/papers" },
  { id: "governance", label: "Governance", href: "/board/governance" },
];

export type OtBoardMeeting = {
  id: string;
  title: string;
  date: string;
  location: string;
  status: "Scheduled" | "Completed";
  agenda: string;
};

export const OT_BOARD_UPCOMING_MEETINGS: OtBoardMeeting[] = [
  {
    id: "ot-bm-up-1",
    title: "Q3 2026 Board Meeting",
    date: "2026-09-15",
    location: "OmniTransit HQ, Centurion",
    status: "Scheduled",
    agenda: "Safety performance, Gauteng expansion capex, and escalator supply chain.",
  },
  {
    id: "ot-bm-up-2",
    title: "Special Board — Modernisation Programme",
    date: "2026-10-02",
    location: "Hyprop House, Hyde Park (virtual option)",
    status: "Scheduled",
    agenda: "Centurion Mall lift modernisation milestone review.",
  },
];

export const OT_BOARD_RECENT_MEETINGS: OtBoardMeeting[] = [
  {
    id: "ot-bm-rec-1",
    title: "Q2 2026 Board Meeting",
    date: "2026-06-18",
    location: "OmniTransit HQ, Centurion",
    status: "Completed",
    agenda: "FY2026 safety dashboard, maintenance pricing, and Western Cape pipeline.",
  },
  {
    id: "ot-bm-rec-2",
    title: "Q1 2026 Board Meeting",
    date: "2026-03-12",
    location: "OmniTransit HQ, Centurion",
    status: "Completed",
    agenda: "Annual maintenance pricing and capital expenditure plan.",
  },
];

export type OtBoardPaper = {
  id: string;
  title: string;
  category: string;
  meetingDate: string;
  status: "Published" | "Draft";
};

export const OT_BOARD_PAPERS: OtBoardPaper[] = [
  {
    id: "ot-paper-1",
    title: "FY2026 Safety & Reliability Dashboard",
    category: "Operations",
    meetingDate: "2026-09-15",
    status: "Published",
  },
  {
    id: "ot-paper-2",
    title: "Gauteng Installation Pipeline — Q3 Update",
    category: "Commercial",
    meetingDate: "2026-09-15",
    status: "Published",
  },
  {
    id: "ot-paper-3",
    title: "Escalator Supply Chain Risk Mitigation",
    category: "Risk",
    meetingDate: "2026-09-15",
    status: "Draft",
  },
  {
    id: "ot-paper-4",
    title: "Board Charter & Delegation of Authority",
    category: "Governance",
    meetingDate: "2026-06-18",
    status: "Published",
  },
];

export const OT_BOARD_GOVERNANCE = {
  legalName: SAEC_LEGAL_NAME,
  jurisdiction: "South Africa",
  listing: "Private — demo portfolio company",
  charterSummary:
    "The board oversees safety, financial stewardship, and strategic growth of OmniTransit’s vertical transport operations across South Africa.",
  committees: [
    { name: "Audit & Risk", chair: "Willem Botha", focus: "Financial controls and enterprise risk" },
    { name: "Safety & Technical", chair: "Naledi Khumalo", focus: "Lift and escalator safety assurance" },
    { name: "People & Governance", chair: "Thandiwe Mkhize", focus: "HR policy and board effectiveness" },
  ],
};

export const OT_BOARD_PORTAL_DIRECTORS = SAEC_DIRECTORS.map((director) => ({
  id: director.id,
  name: director.fullName,
  role: director.roleTitle,
  department: director.department,
  email: director.email,
}));

export function parseOtBoardPortalSection(section: string[] | undefined): OtBoardPortalSection | null {
  if (!section?.length) return "dashboard";
  const key = section[0]?.toLowerCase();
  if (key === "dashboard") return "dashboard";
  if (key === "meetings") return "meetings";
  if (key === "minutes") return "minutes";
  if (key === "decisions") return "decisions";
  if (key === "actions") return "actions";
  if (key === "papers" || key === "packs") return "papers";
  if (key === "members" || key === "directors") return "members";
  if (key === "governance") return "governance";
  return null;
}
