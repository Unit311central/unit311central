import type {
  ManagementActionPlaceholder,
  ManagementFunctionPackPlaceholder,
  ManagementMeetingPlaceholder,
} from "@/lib/central-capabilities/types";

export const SAEC_MANAGEMENT_MEETINGS: ManagementMeetingPlaceholder[] = [
  {
    id: "saec-mgmt-weekly",
    name: "Weekly executive operating review",
    schedule: "Tuesday 08:30 · 75 minutes · Johannesburg HQ boardroom",
    participants: ["CEO", "CFO", "COO", "CTO", "Head of Sales", "HR", "Engineering lead"],
    functionPackLabel: "August 2026 OmniTransit operating cycle",
    packsReady: 6,
    packsTotal: 7,
    readiness: [
      { role: "CEO", name: "Chief Executive", status: "ready" },
      { role: "CFO", name: "Chief Financial Officer", status: "ready" },
      { role: "COO", name: "Chief Operating Officer", status: "ready" },
      { role: "CTO", name: "Chief Technology Officer", status: "outstanding" },
      { role: "Head of Sales", name: "Commercial leadership", status: "ready" },
      { role: "HR", name: "Human Resources", status: "ready" },
      { role: "Engineering lead", name: "Engineering director", status: "ready" },
    ],
  },
];

export const SAEC_MANAGEMENT_FUNCTION_PACKS: ManagementFunctionPackPlaceholder[] = [
  {
    id: "saec-pack-ceo",
    title: "CEO operating pack",
    ownerRole: "CEO",
    lastGenerated: "2026-08-14",
    reportingPeriod: "August 2026",
    status: "current",
  },
  {
    id: "saec-pack-cfo",
    title: "CFO financial pack",
    ownerRole: "CFO",
    lastGenerated: "2026-08-14",
    reportingPeriod: "August 2026",
    status: "current",
  },
  {
    id: "saec-pack-coo",
    title: "COO field operations pack",
    ownerRole: "COO",
    lastGenerated: "2026-08-13",
    reportingPeriod: "August 2026",
    status: "current",
  },
  {
    id: "saec-pack-sales",
    title: "Commercial pipeline pack",
    ownerRole: "Head of Sales",
    lastGenerated: "2026-08-12",
    reportingPeriod: "August 2026",
    status: "draft",
  },
  {
    id: "saec-pack-engineering",
    title: "Engineering competency pack",
    ownerRole: "CTO",
    lastGenerated: "2026-08-11",
    reportingPeriod: "August 2026",
    status: "current",
  },
  {
    id: "saec-pack-hr",
    title: "HR & safety pack",
    ownerRole: "HR",
    lastGenerated: "2026-08-10",
    reportingPeriod: "August 2026",
    status: "current",
  },
];

export const SAEC_MANAGEMENT_ACTIONS: ManagementActionPlaceholder[] = [
  {
    id: "saec-act-centurion",
    title: "Approve Centurion Mall KLK installation mobilisation",
    owner: "COO",
    dueDate: "2026-08-22",
    kind: "decision",
    status: "open",
    meeting: "Weekly executive operating review",
  },
  {
    id: "saec-act-ponte",
    title: "Ponte City phase-2 outage window sign-off",
    owner: "Engineering lead",
    dueDate: "2026-08-25",
    kind: "action",
    status: "open",
    meeting: "Weekly executive operating review",
  },
  {
    id: "saec-act-fleet",
    title: "Fleet digitisation vendor shortlist",
    owner: "CTO",
    dueDate: "2026-09-05",
    kind: "action",
    status: "open",
    meeting: "Weekly executive operating review",
  },
];
