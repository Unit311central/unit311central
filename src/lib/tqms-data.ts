/** Training & Quality Management (MOD-600) — demo domain data. */

export const TQMS_LEARNER_STATUSES = [
  "On Track",
  "In Progress",
  "Overdue",
  "Complete",
  "Not Started",
] as const;
export type TqmsLearnerStatus = (typeof TQMS_LEARNER_STATUSES)[number];

export const TQMS_COURSE_STATUSES = ["Draft", "Published", "Archived"] as const;
export type TqmsCourseStatus = (typeof TQMS_COURSE_STATUSES)[number];

export const TQMS_ASSIGNMENT_STATUSES = [
  "Not Started",
  "In Progress",
  "Completed",
  "Overdue",
] as const;
export type TqmsAssignmentStatus = (typeof TQMS_ASSIGNMENT_STATUSES)[number];

export const TQMS_DOC_STATUSES = [
  "Draft",
  "In Review",
  "Approved",
  "Obsolete",
] as const;
export type TqmsDocStatus = (typeof TQMS_DOC_STATUSES)[number];

export const TQMS_CAPA_PRIORITIES = ["Low", "Medium", "High", "Critical"] as const;
export type TqmsCapaPriority = (typeof TQMS_CAPA_PRIORITIES)[number];

export const TQMS_CAPA_STATUSES = [
  "Open",
  "Investigation",
  "Action",
  "Verification",
  "Closed",
] as const;
export type TqmsCapaStatus = (typeof TQMS_CAPA_STATUSES)[number];

export const TQMS_AUDIT_STATUSES = [
  "Scheduled",
  "In Progress",
  "Completed",
  "Overdue",
] as const;
export type TqmsAuditStatus = (typeof TQMS_AUDIT_STATUSES)[number];

export const TQMS_PANEL_TABS = [
  "Overview",
  "Courses",
  "Certificates",
  "Assessments",
  "Learning Path",
  "History",
  "Notes",
] as const;
export type TqmsPanelTab = (typeof TQMS_PANEL_TABS)[number];

export type TqmsCourse = {
  id: string;
  code: string;
  title: string;
  category: string;
  mandatory: boolean;
  durationHours: number;
  status: TqmsCourseStatus;
  owner: string;
};

export type TqmsLearner = {
  id: string;
  name: string;
  department: string;
  location: string;
  role: string;
  manager: string;
  learningPath: string;
  status: TqmsLearnerStatus;
  startDate: string;
};

export type TqmsAssignment = {
  id: string;
  learnerId: string;
  courseId: string;
  progress: number;
  status: TqmsAssignmentStatus;
  dueDate: string;
  completedAt: string | null;
  mandatory: boolean;
};

export type TqmsCertificate = {
  id: string;
  learnerId: string;
  title: string;
  issuedAt: string;
  expiresAt: string;
  issuer: string;
};

export type TqmsAssessment = {
  id: string;
  learnerId: string;
  title: string;
  score: number | null;
  status: "Pending" | "Passed" | "Failed";
  dueDate: string;
};

export type TqmsLearningPath = {
  id: string;
  name: string;
  description: string;
  estimatedHours: number;
  moduleCount: number;
  completionPercent: number;
  assessmentScore: number | null;
  certificateAvailable: boolean;
  lessons: Array<{
    id: string;
    title: string;
    kind: "Lesson" | "Video" | "Reading" | "Quiz" | "Assessment" | "Certificate";
    durationMins: number;
    done: boolean;
  }>;
};

export type TqmsActivity = {
  id: string;
  at: string;
  label: string;
  detail: string;
};

export type TqmsEvent = {
  id: string;
  title: string;
  kind: "Session" | "Assessment" | "Renewal" | "Classroom";
  when: string;
  owner: string;
};

export type TqmsDocument = {
  id: string;
  number: string;
  title: string;
  revision: string;
  owner: string;
  status: TqmsDocStatus;
  approvalDate: string | null;
  nextReview: string;
};

export type TqmsCapa = {
  id: string;
  reference: string;
  issue: string;
  rootCause: string;
  owner: string;
  priority: TqmsCapaPriority;
  status: TqmsCapaStatus;
  dueDate: string;
  timeline: Array<{ at: string; label: string }>;
};

export type TqmsAudit = {
  id: string;
  title: string;
  scope: string;
  lead: string;
  scheduledFor: string;
  status: TqmsAuditStatus;
  findings: number;
  actionsOpen: number;
};

export type TqmsManagementReview = {
  id: string;
  period: string;
  status: "Draft" | "Scheduled" | "Completed";
  owner: string;
  reviewDate: string;
  inputs: string[];
  outputs: string[];
  actions: Array<{ id: string; title: string; owner: string; due: string; done: boolean }>;
};

export type TqmsReport = {
  id: string;
  name: string;
  kind:
    | "Training"
    | "Compliance"
    | "Audit"
    | "CAPA"
    | "Certificate"
    | "Learning";
  format: "PDF" | "Excel" | "CSV";
  createdAt: string;
  createdBy: string;
};

export type TqmsNote = {
  id: string;
  learnerId: string;
  at: string;
  author: string;
  text: string;
};

export type TqmsQmsSection = {
  id: string;
  name: string;
  status: string;
  owner: string;
  outstanding: number;
  nextDue: string;
  view: string;
};

export function tqmsStatusClass(status: string): string {
  const key = status.toLowerCase();
  if (
    key.includes("complete") ||
    key.includes("approved") ||
    key.includes("passed") ||
    key.includes("closed") ||
    key.includes("on track")
  ) {
    return "border-emerald-400/30 bg-emerald-500/10 text-emerald-100";
  }
  if (
    key.includes("overdue") ||
    key.includes("critical") ||
    key.includes("failed") ||
    key.includes("obsolete")
  ) {
    return "border-rose-400/30 bg-rose-500/10 text-rose-100";
  }
  if (
    key.includes("progress") ||
    key.includes("review") ||
    key.includes("action") ||
    key.includes("investigation") ||
    key.includes("scheduled") ||
    key.includes("medium") ||
    key.includes("high")
  ) {
    return "border-amber-400/30 bg-amber-500/10 text-amber-100";
  }
  return "border-white/15 bg-white/[0.04] text-white/70";
}

export function createSeedTqmsCourses(): TqmsCourse[] {
  return [
    {
      id: "crs-001",
      code: "TRN-101",
      title: "Workplace Induction",
      category: "Induction",
      mandatory: true,
      durationHours: 2,
      status: "Published",
      owner: "People Ops",
    },
    {
      id: "crs-002",
      code: "TRN-210",
      title: "Health & Safety Essentials",
      category: "Compliance",
      mandatory: true,
      durationHours: 3,
      status: "Published",
      owner: "H&S Lead",
    },
    {
      id: "crs-003",
      code: "TRN-220",
      title: "Information Security Awareness",
      category: "Compliance",
      mandatory: true,
      durationHours: 1.5,
      status: "Published",
      owner: "IT Security",
    },
    {
      id: "crs-004",
      code: "TRN-310",
      title: "Customer Operations Excellence",
      category: "Operations",
      mandatory: false,
      durationHours: 4,
      status: "Published",
      owner: "Ops Manager",
    },
    {
      id: "crs-005",
      code: "TRN-410",
      title: "Leadership Fundamentals",
      category: "Leadership",
      mandatory: false,
      durationHours: 6,
      status: "Published",
      owner: "People Ops",
    },
    {
      id: "crs-006",
      code: "TRN-510",
      title: "Flight Operations Briefing",
      category: "Aviation",
      mandatory: true,
      durationHours: 5,
      status: "Published",
      owner: "Flight Ops",
    },
    {
      id: "crs-007",
      code: "QMS-101",
      title: "Quality Fundamentals",
      category: "QMS",
      mandatory: true,
      durationHours: 3,
      status: "Published",
      owner: "Quality Manager",
    },
    {
      id: "crs-008",
      code: "QMS-201",
      title: "Document Control Practitioner",
      category: "QMS",
      mandatory: true,
      durationHours: 2.5,
      status: "Published",
      owner: "Document Control",
    },
  ];
}

export function createSeedTqmsLearners(): TqmsLearner[] {
  return [
    {
      id: "lrn-001",
      name: "Amelia Hart",
      department: "Flight Operations",
      location: "Barcelona",
      role: "Pilot",
      manager: "James Ortega",
      learningPath: "Aviation Compliance",
      status: "In Progress",
      startDate: "2025-11-04",
    },
    {
      id: "lrn-002",
      name: "Noah Patel",
      department: "Quality",
      location: "Barcelona",
      role: "Quality Engineer",
      manager: "Sofia Mendes",
      learningPath: "ISO 9001",
      status: "On Track",
      startDate: "2024-03-18",
    },
    {
      id: "lrn-003",
      name: "Chloe Nguyen",
      department: "People Ops",
      location: "Remote EU",
      role: "HR Generalist",
      manager: "Paul Fotheringham",
      learningPath: "People Induction",
      status: "Overdue",
      startDate: "2026-06-02",
    },
    {
      id: "lrn-004",
      name: "Lucas Berg",
      department: "Engineering",
      location: "Barcelona",
      role: "Avionics Engineer",
      manager: "Elena Ruiz",
      learningPath: "Technical Onboarding",
      status: "Complete",
      startDate: "2023-09-12",
    },
    {
      id: "lrn-005",
      name: "Maya Okonkwo",
      department: "Client Success",
      location: "London",
      role: "Account Manager",
      manager: "James Ortega",
      learningPath: "Customer Excellence",
      status: "In Progress",
      startDate: "2025-01-20",
    },
    {
      id: "lrn-006",
      name: "Ethan Walsh",
      department: "Quality",
      location: "Barcelona",
      role: "Internal Auditor",
      manager: "Sofia Mendes",
      learningPath: "Internal Auditing",
      status: "On Track",
      startDate: "2024-08-01",
    },
    {
      id: "lrn-007",
      name: "Isla Moreau",
      department: "Flight Operations",
      location: "Barcelona",
      role: "Ground Crew",
      manager: "James Ortega",
      learningPath: "Aviation Compliance",
      status: "Not Started",
      startDate: "2026-07-01",
    },
    {
      id: "lrn-008",
      name: "Owen Clarke",
      department: "Finance",
      location: "Remote UK",
      role: "Controller",
      manager: "Paul Fotheringham",
      learningPath: "People Induction",
      status: "In Progress",
      startDate: "2025-05-14",
    },
  ];
}

export function createSeedTqmsAssignments(): TqmsAssignment[] {
  return [
    {
      id: "asg-001",
      learnerId: "lrn-001",
      courseId: "crs-006",
      progress: 70,
      status: "In Progress",
      dueDate: "2026-07-28",
      completedAt: null,
      mandatory: true,
    },
    {
      id: "asg-002",
      learnerId: "lrn-001",
      courseId: "crs-002",
      progress: 100,
      status: "Completed",
      dueDate: "2026-06-15",
      completedAt: "2026-06-12",
      mandatory: true,
    },
    {
      id: "asg-003",
      learnerId: "lrn-002",
      courseId: "crs-007",
      progress: 100,
      status: "Completed",
      dueDate: "2026-05-01",
      completedAt: "2026-04-28",
      mandatory: true,
    },
    {
      id: "asg-004",
      learnerId: "lrn-002",
      courseId: "crs-008",
      progress: 55,
      status: "In Progress",
      dueDate: "2026-08-10",
      completedAt: null,
      mandatory: true,
    },
    {
      id: "asg-005",
      learnerId: "lrn-003",
      courseId: "crs-001",
      progress: 20,
      status: "Overdue",
      dueDate: "2026-06-20",
      completedAt: null,
      mandatory: true,
    },
    {
      id: "asg-006",
      learnerId: "lrn-003",
      courseId: "crs-002",
      progress: 0,
      status: "Overdue",
      dueDate: "2026-06-25",
      completedAt: null,
      mandatory: true,
    },
    {
      id: "asg-007",
      learnerId: "lrn-004",
      courseId: "crs-003",
      progress: 100,
      status: "Completed",
      dueDate: "2026-03-01",
      completedAt: "2026-02-20",
      mandatory: true,
    },
    {
      id: "asg-008",
      learnerId: "lrn-005",
      courseId: "crs-004",
      progress: 40,
      status: "In Progress",
      dueDate: "2026-08-01",
      completedAt: null,
      mandatory: false,
    },
    {
      id: "asg-009",
      learnerId: "lrn-006",
      courseId: "crs-007",
      progress: 100,
      status: "Completed",
      dueDate: "2026-04-15",
      completedAt: "2026-04-10",
      mandatory: true,
    },
    {
      id: "asg-010",
      learnerId: "lrn-007",
      courseId: "crs-001",
      progress: 0,
      status: "Not Started",
      dueDate: "2026-07-30",
      completedAt: null,
      mandatory: true,
    },
    {
      id: "asg-011",
      learnerId: "lrn-008",
      courseId: "crs-003",
      progress: 65,
      status: "In Progress",
      dueDate: "2026-07-22",
      completedAt: null,
      mandatory: true,
    },
    {
      id: "asg-012",
      learnerId: "lrn-005",
      courseId: "crs-002",
      progress: 100,
      status: "Completed",
      dueDate: "2026-05-30",
      completedAt: "2026-05-21",
      mandatory: true,
    },
  ];
}

export function createSeedTqmsCertificates(): TqmsCertificate[] {
  return [
    {
      id: "crt-001",
      learnerId: "lrn-001",
      title: "Health & Safety Essentials",
      issuedAt: "2026-06-12",
      expiresAt: "2027-06-12",
      issuer: "Unit311 Academy",
    },
    {
      id: "crt-002",
      learnerId: "lrn-002",
      title: "Quality Fundamentals",
      issuedAt: "2026-04-28",
      expiresAt: "2027-04-28",
      issuer: "Unit311 Academy",
    },
    {
      id: "crt-003",
      learnerId: "lrn-004",
      title: "Information Security Awareness",
      issuedAt: "2026-02-20",
      expiresAt: "2026-08-20",
      issuer: "Unit311 Academy",
    },
    {
      id: "crt-004",
      learnerId: "lrn-006",
      title: "Internal Auditor",
      issuedAt: "2026-04-10",
      expiresAt: "2027-04-10",
      issuer: "Unit311 Academy",
    },
    {
      id: "crt-005",
      learnerId: "lrn-005",
      title: "Health & Safety Essentials",
      issuedAt: "2026-05-21",
      expiresAt: "2027-05-21",
      issuer: "Unit311 Academy",
    },
  ];
}

export function createSeedTqmsAssessments(): TqmsAssessment[] {
  return [
    {
      id: "asm-001",
      learnerId: "lrn-001",
      title: "Flight Ops Knowledge Check",
      score: null,
      status: "Pending",
      dueDate: "2026-07-28",
    },
    {
      id: "asm-002",
      learnerId: "lrn-002",
      title: "Document Control Quiz",
      score: 88,
      status: "Passed",
      dueDate: "2026-06-01",
    },
    {
      id: "asm-003",
      learnerId: "lrn-003",
      title: "Induction Assessment",
      score: null,
      status: "Pending",
      dueDate: "2026-06-20",
    },
    {
      id: "asm-004",
      learnerId: "lrn-006",
      title: "Internal Audit Scenario",
      score: 92,
      status: "Passed",
      dueDate: "2026-04-08",
    },
  ];
}

export function createSeedTqmsLearningPaths(): TqmsLearningPath[] {
  return [
    {
      id: "path-qf",
      name: "Quality Fundamentals",
      description: "Core quality principles for all operational staff.",
      estimatedHours: 6,
      moduleCount: 5,
      completionPercent: 72,
      assessmentScore: 84,
      certificateAvailable: true,
      lessons: [
        { id: "l1", title: "What quality means at Unit311", kind: "Lesson", durationMins: 20, done: true },
        { id: "l2", title: "Process thinking walkthrough", kind: "Video", durationMins: 18, done: true },
        { id: "l3", title: "Quality policy handbook", kind: "Reading", durationMins: 25, done: true },
        { id: "l4", title: "Fundamentals quiz", kind: "Quiz", durationMins: 15, done: false },
        { id: "l5", title: "Final assessment", kind: "Assessment", durationMins: 30, done: false },
      ],
    },
    {
      id: "path-dc",
      name: "Document Control",
      description: "Controlled documents, revisions, and approvals.",
      estimatedHours: 5,
      moduleCount: 5,
      completionPercent: 40,
      assessmentScore: null,
      certificateAvailable: false,
      lessons: [
        { id: "l1", title: "Controlled document lifecycle", kind: "Lesson", durationMins: 22, done: true },
        { id: "l2", title: "Revision workflow demo", kind: "Video", durationMins: 16, done: true },
        { id: "l3", title: "SOP authoring guide", kind: "Reading", durationMins: 30, done: false },
        { id: "l4", title: "Document control quiz", kind: "Quiz", durationMins: 12, done: false },
        { id: "l5", title: "Practitioner assessment", kind: "Assessment", durationMins: 25, done: false },
      ],
    },
    {
      id: "path-rm",
      name: "Risk Management",
      description: "Identify, score, and treat operational risks.",
      estimatedHours: 4,
      moduleCount: 4,
      completionPercent: 25,
      assessmentScore: null,
      certificateAvailable: false,
      lessons: [
        { id: "l1", title: "Risk register basics", kind: "Lesson", durationMins: 18, done: true },
        { id: "l2", title: "Risk scoring workshop", kind: "Video", durationMins: 20, done: false },
        { id: "l3", title: "Treatment planning", kind: "Reading", durationMins: 15, done: false },
        { id: "l4", title: "Risk assessment", kind: "Assessment", durationMins: 25, done: false },
      ],
    },
    {
      id: "path-ia",
      name: "Internal Auditing",
      description: "Plan, conduct, and report internal audits.",
      estimatedHours: 8,
      moduleCount: 6,
      completionPercent: 90,
      assessmentScore: 92,
      certificateAvailable: true,
      lessons: [
        { id: "l1", title: "Audit principles", kind: "Lesson", durationMins: 25, done: true },
        { id: "l2", title: "Interview techniques", kind: "Video", durationMins: 22, done: true },
        { id: "l3", title: "Evidence checklist", kind: "Reading", durationMins: 20, done: true },
        { id: "l4", title: "Findings workshop", kind: "Quiz", durationMins: 15, done: true },
        { id: "l5", title: "Audit scenario assessment", kind: "Assessment", durationMins: 40, done: true },
        { id: "l6", title: "Auditor certificate", kind: "Certificate", durationMins: 5, done: true },
      ],
    },
    {
      id: "path-capa",
      name: "CAPA",
      description: "Corrective and preventive action workflows.",
      estimatedHours: 5,
      moduleCount: 5,
      completionPercent: 55,
      assessmentScore: 78,
      certificateAvailable: false,
      lessons: [
        { id: "l1", title: "CAPA lifecycle", kind: "Lesson", durationMins: 20, done: true },
        { id: "l2", title: "Root cause methods", kind: "Video", durationMins: 24, done: true },
        { id: "l3", title: "Effectiveness checks", kind: "Reading", durationMins: 18, done: false },
        { id: "l4", title: "CAPA quiz", kind: "Quiz", durationMins: 12, done: false },
        { id: "l5", title: "CAPA assessment", kind: "Assessment", durationMins: 30, done: false },
      ],
    },
    {
      id: "path-9001",
      name: "ISO 9001",
      description: "Quality management system requirements overview.",
      estimatedHours: 7,
      moduleCount: 5,
      completionPercent: 60,
      assessmentScore: 81,
      certificateAvailable: true,
      lessons: [
        { id: "l1", title: "Clause structure", kind: "Lesson", durationMins: 30, done: true },
        { id: "l2", title: "Context of the organisation", kind: "Video", durationMins: 20, done: true },
        { id: "l3", title: "Clause mapping workbook", kind: "Reading", durationMins: 35, done: false },
        { id: "l4", title: "ISO 9001 quiz", kind: "Quiz", durationMins: 15, done: false },
        { id: "l5", title: "ISO 9001 assessment", kind: "Assessment", durationMins: 35, done: false },
      ],
    },
    {
      id: "path-13485",
      name: "ISO 13485",
      description: "Medical device QMS requirements for regulated programmes.",
      estimatedHours: 8,
      moduleCount: 5,
      completionPercent: 15,
      assessmentScore: null,
      certificateAvailable: false,
      lessons: [
        { id: "l1", title: "Device QMS scope", kind: "Lesson", durationMins: 28, done: true },
        { id: "l2", title: "Design controls overview", kind: "Video", durationMins: 26, done: false },
        { id: "l3", title: "Regulatory reading pack", kind: "Reading", durationMins: 40, done: false },
        { id: "l4", title: "13485 quiz", kind: "Quiz", durationMins: 15, done: false },
        { id: "l5", title: "13485 assessment", kind: "Assessment", durationMins: 40, done: false },
      ],
    },
    {
      id: "path-mdr",
      name: "Medical Device Regulations",
      description: "EU MDR awareness for quality and engineering teams.",
      estimatedHours: 6,
      moduleCount: 4,
      completionPercent: 10,
      assessmentScore: null,
      certificateAvailable: false,
      lessons: [
        { id: "l1", title: "MDR landscape", kind: "Lesson", durationMins: 25, done: true },
        { id: "l2", title: "Technical documentation", kind: "Video", durationMins: 22, done: false },
        { id: "l3", title: "Post-market surveillance", kind: "Reading", durationMins: 30, done: false },
        { id: "l4", title: "MDR assessment", kind: "Assessment", durationMins: 35, done: false },
      ],
    },
  ];
}

export function createSeedTqmsActivity(): TqmsActivity[] {
  return [
    {
      id: "act-001",
      at: "2026-07-20T16:40:00Z",
      label: "Course completed",
      detail: "Maya Okonkwo completed Health & Safety Essentials",
    },
    {
      id: "act-002",
      at: "2026-07-20T14:10:00Z",
      label: "Certificate issued",
      detail: "Internal Auditor certificate issued to Ethan Walsh",
    },
    {
      id: "act-003",
      at: "2026-07-19T11:25:00Z",
      label: "Assessment passed",
      detail: "Noah Patel scored 88% on Document Control Quiz",
    },
    {
      id: "act-004",
      at: "2026-07-18T09:05:00Z",
      label: "Employee enrolled",
      detail: "Isla Moreau enrolled on Workplace Induction",
    },
    {
      id: "act-005",
      at: "2026-07-17T15:50:00Z",
      label: "Learning path assigned",
      detail: "Aviation Compliance assigned to Amelia Hart",
    },
  ];
}

export function createSeedTqmsEvents(): TqmsEvent[] {
  return [
    {
      id: "evt-001",
      title: "Flight Ops classroom session",
      kind: "Classroom",
      when: "2026-07-23",
      owner: "James Ortega",
    },
    {
      id: "evt-002",
      title: "Induction assessment deadline",
      kind: "Assessment",
      when: "2026-07-24",
      owner: "People Ops",
    },
    {
      id: "evt-003",
      title: "InfoSec certificate renewal — Lucas Berg",
      kind: "Renewal",
      when: "2026-08-20",
      owner: "IT Security",
    },
    {
      id: "evt-004",
      title: "Internal auditor workshop",
      kind: "Session",
      when: "2026-07-29",
      owner: "Sofia Mendes",
    },
  ];
}

export function createSeedTqmsDocuments(): TqmsDocument[] {
  return [
    {
      id: "doc-001",
      number: "SOP-QMS-001",
      title: "Document Control Procedure",
      revision: "C",
      owner: "Sofia Mendes",
      status: "Approved",
      approvalDate: "2026-03-12",
      nextReview: "2027-03-12",
    },
    {
      id: "doc-002",
      number: "SOP-QMS-014",
      title: "CAPA Procedure",
      revision: "B",
      owner: "Ethan Walsh",
      status: "Approved",
      approvalDate: "2026-01-20",
      nextReview: "2027-01-20",
    },
    {
      id: "doc-003",
      number: "POL-QMS-001",
      title: "Quality Policy",
      revision: "A",
      owner: "Paul Fotheringham",
      status: "Approved",
      approvalDate: "2025-11-02",
      nextReview: "2026-11-02",
    },
    {
      id: "doc-004",
      number: "SOP-OPS-022",
      title: "Pre-flight Checklist Control",
      revision: "D",
      owner: "James Ortega",
      status: "In Review",
      approvalDate: null,
      nextReview: "2026-08-01",
    },
    {
      id: "doc-005",
      number: "WI-QMS-007",
      title: "Supplier Audit Work Instruction",
      revision: "A",
      owner: "Noah Patel",
      status: "Draft",
      approvalDate: null,
      nextReview: "2026-09-15",
    },
    {
      id: "doc-006",
      number: "FORM-QMS-003",
      title: "Non-Conformance Report Form",
      revision: "B",
      owner: "Sofia Mendes",
      status: "Approved",
      approvalDate: "2026-02-08",
      nextReview: "2027-02-08",
    },
  ];
}

export function createSeedTqmsCapas(): TqmsCapa[] {
  return [
    {
      id: "capa-001",
      reference: "CAPA-2026-014",
      issue: "Checklist revision used in field without approval",
      rootCause: "Document control gate bypassed during urgent ops change",
      owner: "James Ortega",
      priority: "High",
      status: "Action",
      dueDate: "2026-07-31",
      timeline: [
        { at: "2026-07-05", label: "Opened from NC-2026-031" },
        { at: "2026-07-08", label: "Root cause workshop completed" },
        { at: "2026-07-12", label: "Corrective actions assigned" },
      ],
    },
    {
      id: "capa-002",
      reference: "CAPA-2026-011",
      issue: "Supplier certificate expired before goods receipt",
      rootCause: "Renewal reminder not linked to receiving workflow",
      owner: "Noah Patel",
      priority: "Medium",
      status: "Verification",
      dueDate: "2026-07-25",
      timeline: [
        { at: "2026-06-18", label: "Opened" },
        { at: "2026-06-24", label: "Preventive control designed" },
        { at: "2026-07-10", label: "Entered verification" },
      ],
    },
    {
      id: "capa-003",
      reference: "CAPA-2026-008",
      issue: "Training record incomplete for new starter",
      rootCause: "Induction checklist not assigned automatically",
      owner: "Chloe Nguyen",
      priority: "Critical",
      status: "Investigation",
      dueDate: "2026-07-22",
      timeline: [
        { at: "2026-07-14", label: "Opened from audit finding" },
        { at: "2026-07-16", label: "Evidence collected" },
      ],
    },
    {
      id: "capa-004",
      reference: "CAPA-2026-003",
      issue: "Calibration label mismatch on ground station",
      rootCause: "Label print process not linked to asset record",
      owner: "Elena Ruiz",
      priority: "Low",
      status: "Closed",
      dueDate: "2026-05-30",
      timeline: [
        { at: "2026-04-02", label: "Opened" },
        { at: "2026-04-20", label: "Actions completed" },
        { at: "2026-05-12", label: "Effectiveness verified" },
        { at: "2026-05-14", label: "Closed" },
      ],
    },
  ];
}

export function createSeedTqmsAudits(): TqmsAudit[] {
  return [
    {
      id: "aud-001",
      title: "Q1 Internal Process Audit — Operations",
      scope: "Flight operations & document control",
      lead: "Ethan Walsh",
      scheduledFor: "2026-07-28",
      status: "Scheduled",
      findings: 0,
      actionsOpen: 0,
    },
    {
      id: "aud-002",
      title: "Supplier Audit — AeroParts Iberia",
      scope: "Incoming inspection & certificates",
      lead: "Noah Patel",
      scheduledFor: "2026-06-12",
      status: "Completed",
      findings: 3,
      actionsOpen: 1,
    },
    {
      id: "aud-003",
      title: "Training Compliance Spot Audit",
      scope: "Mandatory training completion",
      lead: "Sofia Mendes",
      scheduledFor: "2026-06-30",
      status: "Overdue",
      findings: 2,
      actionsOpen: 2,
    },
    {
      id: "aud-004",
      title: "ISO 9001 Clause 8 Process Audit",
      scope: "Operations realisation",
      lead: "Ethan Walsh",
      scheduledFor: "2026-08-15",
      status: "Scheduled",
      findings: 0,
      actionsOpen: 0,
    },
  ];
}

export function createSeedTqmsManagementReviews(): TqmsManagementReview[] {
  return [
    {
      id: "mr-001",
      period: "H1 2026",
      status: "Scheduled",
      owner: "Paul Fotheringham",
      reviewDate: "2026-08-05",
      inputs: [
        "KPIs",
        "Audit Results",
        "Customer Complaints",
        "Training",
        "CAPAs",
        "Risks",
        "Objectives",
      ],
      outputs: ["Actions", "Assigned Owners", "Review History"],
      actions: [
        {
          id: "mra-1",
          title: "Close overdue induction training gap",
          owner: "People Ops",
          due: "2026-08-15",
          done: false,
        },
        {
          id: "mra-2",
          title: "Publish revised document control SOP",
          owner: "Quality Manager",
          due: "2026-08-20",
          done: false,
        },
      ],
    },
    {
      id: "mr-002",
      period: "H2 2025",
      status: "Completed",
      owner: "Paul Fotheringham",
      reviewDate: "2026-01-18",
      inputs: ["KPIs", "Audit Results", "CAPAs", "Risks"],
      outputs: ["Actions", "Review History"],
      actions: [
        {
          id: "mra-3",
          title: "Increase auditor capacity",
          owner: "Sofia Mendes",
          due: "2026-03-01",
          done: true,
        },
      ],
    },
  ];
}

export function createSeedTqmsReports(): TqmsReport[] {
  return [
    {
      id: "rpt-001",
      name: "Mandatory Training Compliance — July",
      kind: "Compliance",
      format: "PDF",
      createdAt: "2026-07-18T10:00:00Z",
      createdBy: "Sofia Mendes",
    },
    {
      id: "rpt-002",
      name: "Open CAPA Register",
      kind: "CAPA",
      format: "Excel",
      createdAt: "2026-07-16T14:20:00Z",
      createdBy: "Noah Patel",
    },
    {
      id: "rpt-003",
      name: "Certificate Expiry Watchlist",
      kind: "Certificate",
      format: "CSV",
      createdAt: "2026-07-12T09:40:00Z",
      createdBy: "People Ops",
    },
  ];
}

export function createSeedTqmsNotes(): TqmsNote[] {
  return [
    {
      id: "note-001",
      learnerId: "lrn-003",
      at: "2026-07-15T12:00:00Z",
      author: "People Ops",
      text: "New starter induction overdue — manager reminder sent.",
    },
    {
      id: "note-002",
      learnerId: "lrn-001",
      at: "2026-07-10T08:30:00Z",
      author: "James Ortega",
      text: "Classroom session booked to complete Flight Operations Briefing.",
    },
  ];
}

export function createSeedTqmsQmsSections(): TqmsQmsSection[] {
  return [
    {
      id: "sec-doc",
      name: "Document Control",
      status: "Healthy",
      owner: "Sofia Mendes",
      outstanding: 2,
      nextDue: "2026-08-01",
      view: "qms-document-control",
    },
    {
      id: "sec-capa",
      name: "CAPA",
      status: "Attention",
      owner: "Ethan Walsh",
      outstanding: 3,
      nextDue: "2026-07-22",
      view: "qms-capa",
    },
    {
      id: "sec-ia",
      name: "Internal Audits",
      status: "Attention",
      owner: "Ethan Walsh",
      outstanding: 1,
      nextDue: "2026-07-28",
      view: "qms-internal-audits",
    },
    {
      id: "sec-sa",
      name: "Supplier Audits",
      status: "On Track",
      owner: "Noah Patel",
      outstanding: 1,
      nextDue: "2026-08-12",
      view: "qms-internal-audits",
    },
    {
      id: "sec-mr",
      name: "Management Review",
      status: "Scheduled",
      owner: "Paul Fotheringham",
      outstanding: 2,
      nextDue: "2026-08-05",
      view: "qms-management-review",
    },
    {
      id: "sec-risk",
      name: "Risk Register",
      status: "On Track",
      owner: "Sofia Mendes",
      outstanding: 4,
      nextDue: "2026-08-30",
      view: "quality-management",
    },
    {
      id: "sec-train",
      name: "Training Compliance",
      status: "Attention",
      owner: "People Ops",
      outstanding: 5,
      nextDue: "2026-07-24",
      view: "training-dashboard",
    },
    {
      id: "sec-cc",
      name: "Change Control",
      status: "On Track",
      owner: "Elena Ruiz",
      outstanding: 1,
      nextDue: "2026-08-18",
      view: "quality-management",
    },
  ];
}
