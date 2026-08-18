import type {
  ManagementActionPlaceholder,
  ManagementFunctionPackPlaceholder,
  ManagementMeetingPlaceholder,
} from "./types";

export const UPCOMING_MANAGEMENT_MEETING: ManagementMeetingPlaceholder = {
  id: "mgmt-weekly-1",
  name: "Weekly Management Committee",
  schedule: "Thursday 09:00 · 90 minutes · Executive boardroom",
  participants: [
    "CEO",
    "CFO",
    "COO",
    "CTO",
    "CRO",
    "Head of Sales",
    "HR Director",
  ],
  functionPackLabel: "March 2026 management cycle",
  packsReady: 5,
  packsTotal: 7,
  readiness: [
    { role: "CEO", name: "Chief Executive", status: "ready" },
    { role: "CFO", name: "Chief Financial Officer", status: "ready" },
    { role: "COO", name: "Chief Operating Officer", status: "outstanding" },
    { role: "CTO", name: "Chief Technology Officer", status: "ready" },
    { role: "CRO", name: "Chief Revenue Officer", status: "ready" },
    { role: "Head of Sales", name: "Sales leadership", status: "outstanding" },
    { role: "HR", name: "Human Resources", status: "ready" },
  ],
};

export const MANAGEMENT_FUNCTION_PACKS: ManagementFunctionPackPlaceholder[] = [
  {
    id: "pack-cfo",
    title: "CFO Management Pack",
    ownerRole: "CFO",
    lastGenerated: "2026-03-14",
    reportingPeriod: "March 2026",
    status: "current",
  },
  {
    id: "pack-coo",
    title: "COO Management Pack",
    ownerRole: "COO",
    lastGenerated: "2026-03-12",
    reportingPeriod: "March 2026",
    status: "draft",
  },
  {
    id: "pack-cto",
    title: "CTO Management Pack",
    ownerRole: "CTO",
    lastGenerated: "2026-03-13",
    reportingPeriod: "March 2026",
    status: "current",
  },
  {
    id: "pack-cro",
    title: "CRO Management Pack",
    ownerRole: "CRO",
    lastGenerated: "2026-03-11",
    reportingPeriod: "March 2026",
    status: "current",
  },
  {
    id: "pack-hr",
    title: "HR Management Pack",
    ownerRole: "HR",
    lastGenerated: "2026-03-10",
    reportingPeriod: "March 2026",
    status: "current",
  },
  {
    id: "pack-ceo",
    title: "CEO Management Summary",
    ownerRole: "CEO",
    lastGenerated: "2026-03-08",
    reportingPeriod: "March 2026",
    status: "archived",
  },
];

export const MANAGEMENT_MEETINGS: ManagementMeetingPlaceholder[] = [
  UPCOMING_MANAGEMENT_MEETING,
  {
    id: "mgmt-monthly-1",
    name: "Monthly Business Review",
    schedule: "Last Friday of month · 2 hours",
    participants: ["CEO", "CFO", "COO", "CTO", "CRO", "HR Director"],
    functionPackLabel: "February 2026 management cycle",
    packsReady: 6,
    packsTotal: 6,
    readiness: [],
  },
];

export const MANAGEMENT_ACTIONS: ManagementActionPlaceholder[] = [
  {
    id: "act-1",
    title: "Confirm revised cash forecast assumptions",
    owner: "CFO",
    dueDate: "2026-03-20",
    status: "open",
    meeting: "Weekly Management Committee",
    kind: "action",
  },
  {
    id: "act-2",
    title: "Approve supplier consolidation plan",
    owner: "COO",
    dueDate: "2026-03-12",
    status: "overdue",
    meeting: "Weekly Management Committee",
    kind: "decision",
  },
  {
    id: "act-3",
    title: "Sign off enterprise risk review summary",
    owner: "CEO",
    dueDate: "2026-03-18",
    status: "open",
    meeting: "Monthly Business Review",
    kind: "decision",
  },
];

export const MANAGEMENT_SUMMARY = {
  lastMeeting: "Monthly Business Review · 28 Feb 2026",
  openActions: 12,
  overdueActions: 2,
  decisionsLogged: 8,
  latestPack: "CFO Management Pack · 14 Mar 2026",
};
