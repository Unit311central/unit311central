/**
 * OnwardAir QMS fixtures — Houston HQ · AS9100 / FAA / Vertex VTOL™ · FLEX Pod™.
 * Replaces Unit311/Barcelona legacy documents, CAPA, audits, reviews, and reports.
 */

import type {
  TqmsAssessment,
  TqmsAudit,
  TqmsCapa,
  TqmsDocument,
  TqmsLearningPath,
  TqmsManagementReview,
  TqmsNote,
  TqmsQmsSection,
  TqmsReport,
} from "@/lib/tqms-data";
import type { TqmsMockState } from "@/lib/tqms-mock-store";

export const OA_QMS_DOCUMENTS: TqmsDocument[] = [
  {
    id: "oa-doc-001",
    number: "POL-OA-QMS-001",
    title: "OnwardAir Quality Policy",
    revision: "B",
    owner: "Scott Parazynski, MD",
    status: "Approved",
    approvalDate: "2026-02-12",
    nextReview: "2027-02-12",
  },
  {
    id: "oa-doc-002",
    number: "SOP-OA-DOC-010",
    title: "Document & Configuration Control",
    revision: "C",
    owner: "Marcus Bell",
    status: "Approved",
    approvalDate: "2026-03-18",
    nextReview: "2027-03-18",
  },
  {
    id: "oa-doc-003",
    number: "SOP-OA-CAPA-020",
    title: "CAPA & Nonconformance Procedure",
    revision: "B",
    owner: "Marcus Bell",
    status: "Approved",
    approvalDate: "2026-01-28",
    nextReview: "2027-01-28",
  },
  {
    id: "oa-doc-004",
    number: "SOP-OA-FT-030",
    title: "Flight Test Evidence Control",
    revision: "A",
    owner: "Brian Whiteside",
    status: "Approved",
    approvalDate: "2026-04-22",
    nextReview: "2027-04-22",
  },
  {
    id: "oa-doc-005",
    number: "ICD-FLEX-001",
    title: "FLEX Pod™ Mechanical / Electrical ICD",
    revision: "D",
    owner: "Mike Teeter",
    status: "In Review",
    approvalDate: null,
    nextReview: "2026-09-15",
  },
  {
    id: "oa-doc-006",
    number: "WI-OA-HIL-012",
    title: "HIL Rig Commissioning Work Instruction",
    revision: "B",
    owner: "David Colling",
    status: "Approved",
    approvalDate: "2026-05-10",
    nextReview: "2027-05-10",
  },
  {
    id: "oa-doc-007",
    number: "FORM-OA-NC-003",
    title: "Nonconformance Report Form",
    revision: "A",
    owner: "Elena Rossi",
    status: "Approved",
    approvalDate: "2026-03-01",
    nextReview: "2027-03-01",
  },
  {
    id: "oa-doc-008",
    number: "SOP-OA-SUP-040",
    title: "Supplier Qualification & Incoming Inspection",
    revision: "A",
    owner: "Elena Rossi",
    status: "Draft",
    approvalDate: null,
    nextReview: "2026-10-01",
  },
];

export const OA_QMS_CAPAS: TqmsCapa[] = [
  {
    id: "oa-capa-001",
    reference: "CAPA-OA-2026-018",
    issue: "Flight-test checklist revision used on taxi day without freeze approval",
    rootCause: "Urgent ops change bypassed document-control gate before ground taxi",
    owner: "Brian Whiteside",
    priority: "High",
    status: "Action",
    dueDate: "2026-08-22",
    timeline: [
      { at: "2026-07-28", label: "Opened from NC-OA-2026-044" },
      { at: "2026-08-01", label: "Root cause workshop with Flight Test" },
      { at: "2026-08-05", label: "Corrective actions assigned" },
    ],
  },
  {
    id: "oa-capa-002",
    reference: "CAPA-OA-2026-014",
    issue: "Critical fastener CoC missing at goods receipt (TexComposites lot)",
    rootCause: "Supplier certificate expiry not blocking receiving in inventory workflow",
    owner: "Elena Rossi",
    priority: "Critical",
    status: "Verification",
    dueDate: "2026-08-15",
    timeline: [
      { at: "2026-07-02", label: "Opened from incoming inspection hold" },
      { at: "2026-07-10", label: "Preventive control designed with Supply Chain" },
      { at: "2026-07-28", label: "Entered verification" },
    ],
  },
  {
    id: "oa-capa-003",
    reference: "CAPA-OA-2026-011",
    issue: "HIL actuator harness label mismatch vs configuration baseline",
    rootCause: "Harness build traveler not linked to ICD revision D",
    owner: "David Colling",
    priority: "Medium",
    status: "Investigation",
    dueDate: "2026-08-28",
    timeline: [
      { at: "2026-08-01", label: "Opened from HIL commissioning NC" },
      { at: "2026-08-03", label: "Evidence pack collected" },
    ],
  },
  {
    id: "oa-capa-004",
    reference: "CAPA-OA-2026-006",
    issue: "Battery pack thermal sensor calibration overdue on Pack A sample",
    rootCause: "Calibration recall not synced to Power Lab asset register",
    owner: "Keven Coates",
    priority: "High",
    status: "Action",
    dueDate: "2026-08-20",
    timeline: [
      { at: "2026-07-18", label: "Opened" },
      { at: "2026-07-25", label: "Containment — Pack A quarantined" },
      { at: "2026-08-02", label: "Corrective owner assigned" },
    ],
  },
  {
    id: "oa-capa-005",
    reference: "CAPA-OA-2026-002",
    issue: "FLEX Pod™ latch torque card used obsolete revision on fixture",
    rootCause: "Shop floor display not purged after revision C release",
    owner: "Mike Teeter",
    priority: "Low",
    status: "Closed",
    dueDate: "2026-06-15",
    timeline: [
      { at: "2026-05-04", label: "Opened" },
      { at: "2026-05-20", label: "Actions completed" },
      { at: "2026-06-08", label: "Effectiveness verified" },
      { at: "2026-06-10", label: "Closed" },
    ],
  },
];

export const OA_QMS_AUDITS: TqmsAudit[] = [
  {
    id: "oa-aud-001",
    title: "Q3 Internal Process Audit — Flight Test",
    scope: "Houston Flight Test · evidence control & taxi readiness",
    lead: "Marcus Bell",
    scheduledFor: "2026-08-26",
    status: "Scheduled",
    findings: 0,
    actionsOpen: 0,
  },
  {
    id: "oa-aud-002",
    title: "Supplier Audit — TexComposites (Houston)",
    scope: "Incoming inspection, CoC, and dual-source readiness",
    lead: "Elena Rossi",
    scheduledFor: "2026-07-09",
    status: "Completed",
    findings: 4,
    actionsOpen: 2,
  },
  {
    id: "oa-aud-003",
    title: "AS9100 Clause 8 — Operations Realisation",
    scope: "Configuration control, production / prototype realisation",
    lead: "Marcus Bell",
    scheduledFor: "2026-09-12",
    status: "Scheduled",
    findings: 0,
    actionsOpen: 0,
  },
  {
    id: "oa-aud-004",
    title: "Training Compliance Spot Audit — Engineering",
    scope: "Mandatory H&S, HV battery, and Flight Test Ground Rules",
    lead: "Brian Whiteside",
    scheduledFor: "2026-07-30",
    status: "Overdue",
    findings: 3,
    actionsOpen: 3,
  },
  {
    id: "oa-aud-005",
    title: "HIL Lab Configuration Audit",
    scope: "Avionics HIL baseline vs ICD freeze for hover campaign",
    lead: "David Colling",
    scheduledFor: "2026-06-20",
    status: "Completed",
    findings: 2,
    actionsOpen: 1,
  },
];

export const OA_QMS_MANAGEMENT_REVIEWS: TqmsManagementReview[] = [
  {
    id: "oa-mr-001",
    period: "H1 2026",
    status: "Scheduled",
    owner: "Scott Parazynski, MD",
    reviewDate: "2026-08-28",
    inputs: [
      "Quality KPIs",
      "Audit Results",
      "CAPA Register",
      "Flight Test Risks",
      "Training Compliance",
      "Supplier Performance",
      "FAA Pathway Status",
    ],
    outputs: ["Actions", "Assigned Owners", "Board Risk Inputs"],
    actions: [
      {
        id: "oa-mra-1",
        title: "Close overdue Engineering training compliance gap",
        owner: "Brian Whiteside",
        due: "2026-09-05",
        done: false,
      },
      {
        id: "oa-mra-2",
        title: "Release FLEX Pod™ ICD revision D",
        owner: "Mike Teeter",
        due: "2026-09-15",
        done: false,
      },
      {
        id: "oa-mra-3",
        title: "Confirm TexComposites CAPA effectiveness",
        owner: "Elena Rossi",
        due: "2026-09-01",
        done: false,
      },
    ],
  },
  {
    id: "oa-mr-002",
    period: "H2 2025",
    status: "Completed",
    owner: "Brian Whiteside",
    reviewDate: "2026-01-22",
    inputs: ["KPIs", "Audit Results", "CAPAs", "Risks", "Hover Demo Gate"],
    outputs: ["Actions", "Review History"],
    actions: [
      {
        id: "oa-mra-4",
        title: "Stand up Quality/Assurance lead (Marcus Bell)",
        owner: "Brian Whiteside",
        due: "2026-02-28",
        done: true,
      },
      {
        id: "oa-mra-5",
        title: "Publish Flight Test Evidence Control SOP",
        owner: "Marcus Bell",
        due: "2026-04-30",
        done: true,
      },
    ],
  },
];

export const OA_QMS_REPORTS: TqmsReport[] = [
  {
    id: "oa-rpt-001",
    name: "Mandatory Training Compliance — Houston · Aug 2026",
    kind: "Compliance",
    format: "PDF",
    createdAt: "2026-08-02T15:00:00Z",
    createdBy: "Marcus Bell",
  },
  {
    id: "oa-rpt-002",
    name: "Open CAPA Register — Flight Test & Supply",
    kind: "CAPA",
    format: "Excel",
    createdAt: "2026-08-01T18:20:00Z",
    createdBy: "Elena Rossi",
  },
  {
    id: "oa-rpt-003",
    name: "AS9100 Internal Audit Programme Status",
    kind: "Audit",
    format: "PDF",
    createdAt: "2026-07-28T12:00:00Z",
    createdBy: "Marcus Bell",
  },
  {
    id: "oa-rpt-004",
    name: "Certificate Expiry Watchlist — Engineering",
    kind: "Certificate",
    format: "CSV",
    createdAt: "2026-07-22T09:40:00Z",
    createdBy: "People Ops",
  },
  {
    id: "oa-rpt-005",
    name: "QMS Learning Path Progress — Aug",
    kind: "Learning",
    format: "Excel",
    createdAt: "2026-08-03T10:15:00Z",
    createdBy: "Brian Whiteside",
  },
];

export const OA_QMS_NOTES: TqmsNote[] = [
  {
    id: "oa-note-001",
    learnerId: "oa-lrn-oa-hr-06",
    at: "2026-07-28T14:00:00Z",
    author: "Marcus Bell",
    text: "Mike Teeter — Document Control Practitioner assigned ahead of ICD revision D freeze.",
  },
  {
    id: "oa-note-002",
    learnerId: "oa-lrn-oa-hr-07",
    at: "2026-08-01T11:30:00Z",
    author: "Brian Whiteside",
    text: "Keven Coates — High-Voltage Battery Handling renewal due before Pack A thermal tests.",
  },
];

export const OA_QMS_SECTIONS: TqmsQmsSection[] = [
  {
    id: "oa-sec-doc",
    name: "Document Control",
    status: "Attention",
    owner: "Marcus Bell",
    outstanding: 2,
    nextDue: "2026-09-15",
    view: "qms-document-control",
  },
  {
    id: "oa-sec-capa",
    name: "CAPA",
    status: "Attention",
    owner: "Elena Rossi",
    outstanding: 4,
    nextDue: "2026-08-15",
    view: "qms-capa",
  },
  {
    id: "oa-sec-ia",
    name: "Internal Audits",
    status: "Attention",
    owner: "Marcus Bell",
    outstanding: 1,
    nextDue: "2026-08-26",
    view: "qms-internal-audits",
  },
  {
    id: "oa-sec-sa",
    name: "Supplier Audits",
    status: "On Track",
    owner: "Elena Rossi",
    outstanding: 2,
    nextDue: "2026-09-01",
    view: "qms-internal-audits",
  },
  {
    id: "oa-sec-mr",
    name: "Management Review",
    status: "Scheduled",
    owner: "Scott Parazynski, MD",
    outstanding: 3,
    nextDue: "2026-08-28",
    view: "qms-management-review",
  },
  {
    id: "oa-sec-risk",
    name: "Risk Register",
    status: "On Track",
    owner: "Brian Whiteside",
    outstanding: 5,
    nextDue: "2026-09-10",
    view: "quality-management",
  },
  {
    id: "oa-sec-train",
    name: "Training Compliance",
    status: "Attention",
    owner: "People Ops",
    outstanding: 4,
    nextDue: "2026-08-20",
    view: "training-dashboard",
  },
  {
    id: "oa-sec-cc",
    name: "Change Control",
    status: "On Track",
    owner: "Mike Teeter",
    outstanding: 1,
    nextDue: "2026-09-05",
    view: "quality-management",
  },
];

export const OA_QMS_ASSESSMENTS: TqmsAssessment[] = [
  {
    id: "oa-asm-001",
    learnerId: "oa-lrn-oa-hr-06",
    title: "Document Control Practitioner quiz",
    score: 88,
    status: "Passed",
    dueDate: "2026-07-20",
  },
  {
    id: "oa-asm-002",
    learnerId: "oa-lrn-oa-hr-07",
    title: "High-Voltage Battery Handling assessment",
    score: null,
    status: "Pending",
    dueDate: "2026-08-20",
  },
  {
    id: "oa-asm-003",
    learnerId: "oa-lrn-oa-hr-02",
    title: "AS9100 awareness assessment",
    score: 91,
    status: "Passed",
    dueDate: "2026-06-30",
  },
  {
    id: "oa-asm-004",
    learnerId: "oa-lrn-oa-hr-08",
    title: "Flight Test Ground Rules quiz",
    score: 62,
    status: "Failed",
    dueDate: "2026-08-05",
  },
];

/** Extra QMS paths beyond the training-module set — AS9100 / FAA (not ISO 13485 / MDR). */
export const OA_QMS_EXTRA_LEARNING_PATHS: TqmsLearningPath[] = [
  {
    id: "oa-path-as9100",
    name: "AS9100 Awareness",
    description: "Aerospace QMS requirements for OnwardAir Houston programmes.",
    estimatedHours: 6,
    moduleCount: 5,
    completionPercent: 40,
    assessmentScore: null,
    certificateAvailable: true,
    lessons: [
      { id: "l1", title: "AS9100 vs ISO 9001 deltas", kind: "Lesson", durationMins: 30, done: true },
      { id: "l2", title: "Configuration management", kind: "Video", durationMins: 25, done: true },
      { id: "l3", title: "Counterfeit parts control", kind: "Reading", durationMins: 35, done: false },
      { id: "l4", title: "AS9100 quiz", kind: "Quiz", durationMins: 20, done: false },
      { id: "l5", title: "AS9100 assessment", kind: "Assessment", durationMins: 40, done: false },
    ],
  },
  {
    id: "oa-path-faa",
    name: "FAA Pathway Awareness",
    description: "Experimental / Part 21 pathway literacy for engineering and leadership.",
    estimatedHours: 5,
    moduleCount: 4,
    completionPercent: 25,
    assessmentScore: null,
    certificateAvailable: false,
    lessons: [
      { id: "l1", title: "Pathway options overview", kind: "Lesson", durationMins: 35, done: true },
      { id: "l2", title: "Evidence expectations", kind: "Reading", durationMins: 40, done: false },
      { id: "l3", title: "Safety case outline", kind: "Video", durationMins: 30, done: false },
      { id: "l4", title: "FAA awareness assessment", kind: "Assessment", durationMins: 35, done: false },
    ],
  },
];

export const OA_QMS_MODULES = [
  {
    id: "oa-qms-1",
    title: "Quality policy & AS9100 scope",
    description: "Define the OnwardAir QMS scope for Houston HQ, Flight Test, and FLEX Pod™ programmes.",
    status: "complete" as const,
    lessons: 4,
  },
  {
    id: "oa-qms-2",
    title: "Document & configuration control",
    description: "ICD baselines, revision freezes, and distribution for Vertex VTOL™ artefacts.",
    status: "in-progress" as const,
    lessons: 6,
  },
  {
    id: "oa-qms-3",
    title: "Internal & supplier audit",
    description: "Plan AS9100 process audits and TexComposites supplier surveillance.",
    status: "in-progress" as const,
    lessons: 5,
  },
  {
    id: "oa-qms-4",
    title: "Nonconformance & CAPA",
    description: "Flight-test and lab NCs through containment, root cause, and effectiveness.",
    status: "not-started" as const,
    lessons: 5,
  },
  {
    id: "oa-qms-5",
    title: "Management review",
    description: "Executive review of quality KPIs, FAA pathway, and Board risk inputs.",
    status: "not-started" as const,
    lessons: 3,
  },
];

export const OA_QMS_TRAINING_COURSES = [
  {
    id: "oa-qms-intro",
    title: "Quality fundamentals (OnwardAir)",
    duration: "45 min",
    progress: 100,
  },
  {
    id: "oa-qms-as9100",
    title: "AS9100 awareness",
    duration: "2 hrs",
    progress: 40,
  },
  {
    id: "oa-qms-capa",
    title: "CAPA for flight-test findings",
    duration: "1 hr",
    progress: 15,
  },
] as const;

export function applyOnwardAirQmsOpsSeed(base: TqmsMockState): TqmsMockState {
  return {
    ...base,
    documents: OA_QMS_DOCUMENTS,
    capas: OA_QMS_CAPAS,
    audits: OA_QMS_AUDITS,
    managementReviews: OA_QMS_MANAGEMENT_REVIEWS,
    reports: OA_QMS_REPORTS,
    notes: OA_QMS_NOTES,
    qmsSections: OA_QMS_SECTIONS,
    assessments: OA_QMS_ASSESSMENTS,
  };
}

/** Detect Unit311 / Barcelona / medical-device legacy leaking into OA QMS. */
export function isNonOnwardAirQmsLeak(state: TqmsMockState): boolean {
  const blob = [
    ...state.documents.map((d) => `${d.owner} ${d.title} ${d.number}`),
    ...state.capas.map((c) => `${c.owner} ${c.issue}`),
    ...state.audits.map((a) => `${a.lead} ${a.title} ${a.scope}`),
    ...state.managementReviews.map((m) => `${m.owner} ${m.period}`),
    ...state.reports.map((r) => `${r.createdBy} ${r.name}`),
    ...state.qmsSections.map((s) => `${s.owner} ${s.name}`),
    ...state.learningPaths.map((p) => `${p.name} ${p.description}`),
  ].join(" | ");

  return /Sofia Mendes|Ethan Walsh|Paul Fotheringham|Noah Patel|Amelia Hart|Barcelona|AeroParts Iberia|ISO 13485|Medical Device|Unit311|Chloe Nguyen|Elena Ruiz/i.test(
    blob,
  );
}
