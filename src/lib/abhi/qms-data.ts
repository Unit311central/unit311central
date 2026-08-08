/**
 * ABHI QMS fixtures — London HQ · membership association · ISO 9001 / member services.
 * Replaces Unit311 / aviation legacy documents, CAPA, audits, reviews, and reports.
 */

import type {
  TqmsAudit,
  TqmsCapa,
  TqmsDocument,
  TqmsManagementReview,
  TqmsNote,
  TqmsQmsSection,
  TqmsReport,
} from "@/lib/tqms-data";
import type { TqmsMockState } from "@/lib/tqms-mock-store";

export const ABHI_QMS_DOCUMENTS: TqmsDocument[] = [
  {
    id: "abhi-doc-001",
    number: "POL-ABHI-QMS-001",
    title: "ABHI Quality Policy",
    revision: "C",
    owner: "Peter Ellingworth",
    status: "Approved",
    approvalDate: "2026-02-10",
    nextReview: "2027-02-10",
  },
  {
    id: "abhi-doc-002",
    number: "SOP-ABHI-DOC-010",
    title: "Document & Records Control",
    revision: "B",
    owner: "Phil Brown",
    status: "Approved",
    approvalDate: "2026-03-15",
    nextReview: "2027-03-15",
  },
  {
    id: "abhi-doc-003",
    number: "SOP-ABHI-CAPA-020",
    title: "CAPA & Member Complaint Procedure",
    revision: "B",
    owner: "Phil Brown",
    status: "Approved",
    approvalDate: "2026-01-20",
    nextReview: "2027-01-20",
  },
  {
    id: "abhi-doc-004",
    number: "SOP-ABHI-EVT-030",
    title: "Event Safety & Delegation Management",
    revision: "A",
    owner: "Michelle Michelucci",
    status: "Approved",
    approvalDate: "2026-04-18",
    nextReview: "2027-04-18",
  },
  {
    id: "abhi-doc-005",
    number: "SOP-ABHI-MEM-040",
    title: "Member Data Governance & CRM Control",
    revision: "D",
    owner: "Jane Lewis",
    status: "In Review",
    approvalDate: null,
    nextReview: "2026-09-20",
  },
  {
    id: "abhi-doc-006",
    number: "WI-ABHI-NEWS-012",
    title: "Digital Newsletter Approval Workflow",
    revision: "B",
    owner: "Jonathan Evans",
    status: "Approved",
    approvalDate: "2026-05-08",
    nextReview: "2027-05-08",
  },
  {
    id: "abhi-doc-007",
    number: "FORM-ABHI-NC-003",
    title: "Nonconformance Report Form",
    revision: "A",
    owner: "Phil Brown",
    status: "Approved",
    approvalDate: "2026-03-01",
    nextReview: "2027-03-01",
  },
  {
    id: "abhi-doc-008",
    number: "SOP-ABHI-REG-050",
    title: "Regulatory Intelligence Distribution",
    revision: "A",
    owner: "Judith Mellis",
    status: "Draft",
    approvalDate: null,
    nextReview: "2026-10-01",
  },
];

export const ABHI_QMS_CAPAS: TqmsCapa[] = [
  {
    id: "abhi-capa-001",
    reference: "CAPA-ABHI-2026-012",
    issue: "Member CRM duplicate records after WHX exhibitor import",
    rootCause: "Bulk import template lacked dedupe key on company registration number",
    owner: "Jane Lewis",
    priority: "High",
    status: "Action",
    dueDate: "2026-08-25",
    timeline: [
      { at: "2026-07-22", label: "Opened from membership ops review" },
      { at: "2026-07-28", label: "Data cleanse sprint started" },
      { at: "2026-08-02", label: "Import guardrails assigned" },
    ],
  },
  {
    id: "abhi-capa-002",
    reference: "CAPA-ABHI-2026-009",
    issue: "Event registration emails sent with wrong pavilion time slot",
    rootCause: "Template merge field not updated after WHX schedule change",
    owner: "Charlotte Hart",
    priority: "Medium",
    status: "Verification",
    dueDate: "2026-08-18",
    timeline: [
      { at: "2026-07-10", label: "Opened from member complaint" },
      { at: "2026-07-18", label: "Corrective comms issued" },
      { at: "2026-08-01", label: "Entered verification" },
    ],
  },
  {
    id: "abhi-capa-003",
    reference: "CAPA-ABHI-2026-006",
    issue: "Regulatory alert published without Phil Brown approval",
    rootCause: "Emergency publish path bypassed two-step review for DHSC briefing",
    owner: "Judith Mellis",
    priority: "Medium",
    status: "Investigation",
    dueDate: "2026-08-30",
    timeline: [
      { at: "2026-08-03", label: "Opened from audit finding" },
      { at: "2026-08-05", label: "Evidence pack collected" },
    ],
  },
  {
    id: "abhi-capa-004",
    reference: "CAPA-ABHI-2026-003",
    issue: "Mandatory training completion not reflected in QMS dashboard",
    rootCause: "LMS completion webhook lag for ABHI compliance courses",
    owner: "Addie Macgregor",
    priority: "Low",
    status: "Action",
    dueDate: "2026-08-22",
    timeline: [
      { at: "2026-07-05", label: "Opened" },
      { at: "2026-07-15", label: "IT ticket raised with LMS integration" },
    ],
  },
  {
    id: "abhi-capa-005",
    reference: "CAPA-ABHI-2026-001",
    issue: "Board pack version circulated with outdated membership chart",
    rootCause: "Chart export not refreshed after July member sign-ups",
    owner: "Peter Ellingworth",
    priority: "Low",
    status: "Closed",
    dueDate: "2026-06-20",
    timeline: [
      { at: "2026-05-12", label: "Opened" },
      { at: "2026-05-28", label: "Pack control updated" },
      { at: "2026-06-10", label: "Closed" },
    ],
  },
];

export const ABHI_QMS_AUDITS: TqmsAudit[] = [
  {
    id: "abhi-aud-001",
    title: "Q3 Internal Audit — Member Services",
    scope: "London HQ · CRM hygiene, renewals, and complaint handling",
    lead: "Phil Brown",
    scheduledFor: "2026-08-28",
    status: "Scheduled",
    findings: 0,
    actionsOpen: 0,
  },
  {
    id: "abhi-aud-002",
    title: "ISO 9001 surveillance — Events desk",
    scope: "WHX pavilion logistics and delegation safety records",
    lead: "Addie Macgregor",
    scheduledFor: "2026-07-14",
    status: "Completed",
    findings: 3,
    actionsOpen: 1,
  },
  {
    id: "abhi-aud-003",
    title: "Supplier review — M365 & event AV vendor",
    scope: "SaaS continuity and AV maintenance contract controls",
    lead: "Jane Lewis",
    scheduledFor: "2026-09-05",
    status: "Scheduled",
    findings: 0,
    actionsOpen: 0,
  },
];

export const ABHI_QMS_MANAGEMENT_REVIEWS: TqmsManagementReview[] = [
  {
    id: "abhi-mr-001",
    period: "H1 2026",
    status: "Scheduled",
    owner: "Peter Ellingworth",
    reviewDate: "2026-08-20",
    inputs: ["KPIs", "Audit Results", "CAPAs", "Member Growth", "WHX Commitments"],
    outputs: ["Actions", "Review History"],
    actions: [
      {
        id: "abhi-mra-1",
        title: "Close CRM dedupe CAPA before September renewals",
        owner: "Jane Lewis",
        due: "2026-08-25",
        done: false,
      },
      {
        id: "abhi-mra-2",
        title: "Publish regulatory alert two-step review SOP",
        owner: "Phil Brown",
        due: "2026-09-01",
        done: false,
      },
      {
        id: "abhi-mra-3",
        title: "WHX pavilion exhibitor briefing pack freeze",
        owner: "Michelle Michelucci",
        due: "2026-08-14",
        done: true,
      },
    ],
  },
  {
    id: "abhi-mr-002",
    period: "H2 2025",
    status: "Completed",
    owner: "Peter Ellingworth",
    reviewDate: "2026-01-18",
    inputs: ["KPIs", "Audit Results", "CAPAs", "Membership Revenue"],
    outputs: ["Actions", "Review History"],
    actions: [
      {
        id: "abhi-mra-4",
        title: "Stand up member data governance owner (Jane Lewis)",
        owner: "Peter Ellingworth",
        due: "2026-02-28",
        done: true,
      },
      {
        id: "abhi-mra-5",
        title: "Publish Event Safety SOP",
        owner: "Michelle Michelucci",
        due: "2026-04-30",
        done: true,
      },
    ],
  },
];

export const ABHI_QMS_REPORTS: TqmsReport[] = [
  {
    id: "abhi-rpt-001",
    name: "Mandatory Training Compliance — ABHI staff · Aug 2026",
    kind: "Compliance",
    format: "PDF",
    createdAt: "2026-08-02T14:00:00Z",
    createdBy: "Addie Macgregor",
  },
  {
    id: "abhi-rpt-002",
    name: "Open CAPA Register — Member Services & Events",
    kind: "CAPA",
    format: "Excel",
    createdAt: "2026-08-01T17:30:00Z",
    createdBy: "Phil Brown",
  },
  {
    id: "abhi-rpt-003",
    name: "Internal Audit Schedule — Q3 2026",
    kind: "Audit",
    format: "PDF",
    createdAt: "2026-07-25T10:00:00Z",
    createdBy: "Phil Brown",
  },
  {
    id: "abhi-rpt-004",
    name: "Member Complaint Log — Jul 2026",
    kind: "Compliance",
    format: "CSV",
    createdAt: "2026-07-22T09:40:00Z",
    createdBy: "Jonathan Evans",
  },
  {
    id: "abhi-rpt-005",
    name: "QMS Learning Path Progress — Aug",
    kind: "Learning",
    format: "Excel",
    createdAt: "2026-08-03T10:15:00Z",
    createdBy: "Addie Macgregor",
  },
];

export const ABHI_QMS_NOTES: TqmsNote[] = [
  {
    id: "abhi-note-001",
    learnerId: "abhi-lrn-judith",
    at: "2026-07-28T14:00:00Z",
    author: "Phil Brown",
    text: "Judith Mellis — Regulatory alert review workflow assigned ahead of DHSC briefing cycle.",
  },
  {
    id: "abhi-note-002",
    learnerId: "abhi-lrn-addie",
    at: "2026-08-01T11:30:00Z",
    author: "Addie Macgregor",
    text: "Addie Macgregor — Modern Slavery assessment overdue; LMS sync fix in progress.",
  },
];

export const ABHI_QMS_SECTIONS: TqmsQmsSection[] = [
  {
    id: "abhi-sec-doc",
    name: "Document Control",
    status: "Attention",
    owner: "Phil Brown",
    outstanding: 2,
    nextDue: "2026-09-20",
    view: "qms-document-control",
  },
  {
    id: "abhi-sec-capa",
    name: "CAPA",
    status: "Attention",
    owner: "Phil Brown",
    outstanding: 3,
    nextDue: "2026-08-25",
    view: "qms-capa",
  },
  {
    id: "abhi-sec-ia",
    name: "Internal Audits",
    status: "Attention",
    owner: "Phil Brown",
    outstanding: 1,
    nextDue: "2026-08-28",
    view: "qms-internal-audits",
  },
  {
    id: "abhi-sec-sa",
    name: "Supplier Audits",
    status: "On Track",
    owner: "Jane Lewis",
    outstanding: 1,
    nextDue: "2026-09-05",
    view: "qms-internal-audits",
  },
  {
    id: "abhi-sec-mr",
    name: "Management Review",
    status: "Scheduled",
    owner: "Peter Ellingworth",
    outstanding: 2,
    nextDue: "2026-08-20",
    view: "qms-management-review",
  },
  {
    id: "abhi-sec-risk",
    name: "Risk Register",
    status: "On Track",
    owner: "Jane Lewis",
    outstanding: 4,
    nextDue: "2026-09-10",
    view: "quality-management",
  },
  {
    id: "abhi-sec-train",
    name: "Training Compliance",
    status: "Attention",
    owner: "People Ops",
    outstanding: 4,
    nextDue: "2026-08-22",
    view: "training-dashboard",
  },
  {
    id: "abhi-sec-cc",
    name: "Change Control",
    status: "On Track",
    owner: "Phil Brown",
    outstanding: 1,
    nextDue: "2026-09-01",
    view: "quality-management",
  },
];

export function applyAbhiQmsOpsSeed(base: TqmsMockState): TqmsMockState {
  return {
    ...base,
    documents: ABHI_QMS_DOCUMENTS,
    capas: ABHI_QMS_CAPAS,
    audits: ABHI_QMS_AUDITS,
    managementReviews: ABHI_QMS_MANAGEMENT_REVIEWS,
    reports: ABHI_QMS_REPORTS,
    notes: ABHI_QMS_NOTES,
    qmsSections: ABHI_QMS_SECTIONS,
  };
}

/** Detect Unit311 / aviation / Barcelona legacy leaking into ABHI QMS. */
export function isNonAbhiQmsLeak(state: TqmsMockState): boolean {
  const blob = [
    ...state.documents.map((d) => `${d.owner} ${d.title} ${d.number}`),
    ...state.capas.map((c) => `${c.owner} ${c.issue}`),
    ...state.audits.map((a) => `${a.lead} ${a.title} ${a.scope}`),
    ...state.managementReviews.map((m) => `${m.owner} ${m.period}`),
    ...state.reports.map((r) => `${r.createdBy} ${r.name}`),
    ...state.qmsSections.map((s) => `${s.owner} ${s.name}`),
    ...state.learningPaths.map((p) => `${p.name} ${p.description}`),
  ].join(" | ");

  return /Sofia Mendes|Ethan Walsh|Paul Fotheringham|Noah Patel|Amelia Hart|Barcelona|AeroParts|AS9100|FLEX Pod|Flight Test|Scott Parazynski|Brian Whiteside|Marcus Bell|Unit311|Chloe Nguyen|Elena Ruiz/i.test(
    blob,
  );
}

export const ABHI_QMS_MODULES = [
  {
    id: "abhi-qms-1",
    title: "Quality policy & membership scope",
    description: "Define the ABHI QMS scope for London HQ, member services, and events delivery.",
    status: "complete" as const,
    lessons: 4,
  },
  {
    id: "abhi-qms-2",
    title: "Document & records control",
    description: "Board packs, regulatory alerts, and member communications approval workflow.",
    status: "in-progress" as const,
    lessons: 6,
  },
  {
    id: "abhi-qms-3",
    title: "Internal audit",
    description: "ISO 9001 surveillance across member CRM, events desk, and regulatory publishing.",
    status: "in-progress" as const,
    lessons: 5,
  },
  {
    id: "abhi-qms-4",
    title: "Nonconformance & CAPA",
    description: "Member complaints, CRM data issues, and event registration corrections.",
    status: "not-started" as const,
    lessons: 5,
  },
  {
    id: "abhi-qms-5",
    title: "Management review",
    description: "CEO review of membership KPIs, WHX commitments, and board risk inputs.",
    status: "not-started" as const,
    lessons: 3,
  },
];

export const ABHI_QMS_TRAINING_COURSES = [
  {
    id: "abhi-qms-intro",
    title: "ABHI QMS fundamentals",
    duration: "45 min",
    progress: 100,
  },
  {
    id: "abhi-qms-audit",
    title: "Internal auditor — member services",
    duration: "2 hrs",
    progress: 40,
  },
  {
    id: "abhi-qms-capa",
    title: "CAPA for member complaints",
    duration: "1 hr",
    progress: 15,
  },
] as const;
