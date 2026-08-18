import type {
  ManagementActionPlaceholder,
  ManagementFunctionPackPlaceholder,
  ManagementMeetingPlaceholder,
} from "./types";

export const UPCOMING_MANAGEMENT_MEETING: ManagementMeetingPlaceholder = {
  id: "mgmt-weekly-1",
  name: "Weekly Management Meeting",
  schedule: "Thursday 09:00 · 90 minutes · Executive boardroom",
  participants: [
    "CEO",
    "CFO",
    "COO",
    "CTO",
    "CRO",
    "Head of Sales",
    "HR",
  ],
  functionPackLabel: "August 2026 operating cycle",
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
    id: "pack-ceo",
    title: "CEO Management Pack",
    ownerRole: "CEO",
    lastGenerated: "2026-08-14",
    reportingPeriod: "August 2026",
    status: "current",
  },
  {
    id: "pack-cfo",
    title: "CFO Management Pack",
    ownerRole: "CFO",
    lastGenerated: "2026-08-14",
    reportingPeriod: "August 2026",
    status: "current",
  },
  {
    id: "pack-coo",
    title: "COO Management Pack",
    ownerRole: "COO",
    lastGenerated: "2026-08-12",
    reportingPeriod: "August 2026",
    status: "draft",
  },
  {
    id: "pack-cto",
    title: "CTO Management Pack",
    ownerRole: "CTO",
    lastGenerated: "2026-08-13",
    reportingPeriod: "August 2026",
    status: "current",
  },
  {
    id: "pack-cro",
    title: "CRO Management Pack",
    ownerRole: "CRO",
    lastGenerated: "2026-08-11",
    reportingPeriod: "August 2026",
    status: "current",
  },
  {
    id: "pack-hr",
    title: "HR Management Pack",
    ownerRole: "HR",
    lastGenerated: "2026-08-10",
    reportingPeriod: "August 2026",
    status: "current",
  },
];

export const MANAGEMENT_MEETINGS: ManagementMeetingPlaceholder[] = [
  UPCOMING_MANAGEMENT_MEETING,
  {
    id: "mgmt-monthly-1",
    name: "Monthly Business Review",
    schedule: "Last Friday of month · 2 hours",
    participants: ["CEO", "CFO", "COO", "CTO", "CRO", "HR"],
    functionPackLabel: "July 2026 operating cycle",
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
    dueDate: "2026-08-20",
    status: "open",
    meeting: "Weekly Management Meeting",
    kind: "action",
  },
  {
    id: "act-2",
    title: "Approve supplier consolidation plan",
    owner: "COO",
    dueDate: "2026-08-12",
    status: "overdue",
    meeting: "Weekly Management Meeting",
    kind: "decision",
  },
  {
    id: "act-3",
    title: "Sign off enterprise risk review summary",
    owner: "CEO",
    dueDate: "2026-08-18",
    status: "open",
    meeting: "Monthly Business Review",
    kind: "decision",
  },
];

export const MANAGEMENT_SUMMARY = {
  lastMeeting: "Monthly Business Review · 25 Jul 2026",
  openActions: 12,
  overdueActions: 2,
  decisionsLogged: 8,
  latestPack: "CFO Management Pack · 14 Aug 2026",
};
