/**
 * OnwardAir Training fixtures — Houston HQ · Vertex VTOL™ / FLEX Pod™ staff.
 * Surface-gated client mocks only.
 */

import type {
  TqmsActivity,
  TqmsAssignment,
  TqmsCertificate,
  TqmsCourse,
  TqmsEvent,
  TqmsLearner,
  TqmsLearningPath,
} from "@/lib/tqms-data";
import { OA_HR_TEAM_EMPLOYEES } from "@/lib/onwardair/hr-team-data";
import {
  applyOnwardAirQmsOpsSeed,
  OA_QMS_EXTRA_LEARNING_PATHS,
} from "@/lib/onwardair/qms-data";
import type { TqmsMockState } from "@/lib/tqms-mock-store";

export const OA_STAFF_COURSES: TqmsCourse[] = [
  {
    id: "oa-crs-ind-01",
    code: "OA-IND-101",
    title: "OnwardAir Houston Induction",
    category: "Induction",
    mandatory: true,
    durationHours: 2,
    status: "Published",
    owner: "People Ops",
    description: "Site access, safety brief, and company operating model for Houston HQ.",
  },
  {
    id: "oa-crs-sec-01",
    code: "OA-SEC-110",
    title: "Information Security Awareness",
    category: "Compliance",
    mandatory: true,
    durationHours: 1,
    status: "Published",
    owner: "Technology",
    description: "Phishing, device handling, and export-control awareness for engineering staff.",
  },
  {
    id: "oa-crs-hse-01",
    code: "OA-HSE-120",
    title: "Lab & Hangar Health & Safety",
    category: "Compliance",
    mandatory: true,
    durationHours: 1.5,
    status: "Published",
    owner: "Operations",
    description: "PPE, lockout, and hangar floor rules for Flight Test and Mechanical Lab.",
  },
  {
    id: "oa-crs-flt-01",
    code: "OA-FLT-210",
    title: "Flight Test Ground Rules",
    category: "Flight Test",
    mandatory: true,
    durationHours: 2.5,
    status: "Published",
    owner: "Engineering",
    description: "Taxi/hover campaign roles, radio discipline, and abort criteria.",
  },
  {
    id: "oa-crs-flex-01",
    code: "OA-FLEX-220",
    title: "FLEX Pod™ Interface Basics",
    category: "Engineering",
    mandatory: false,
    durationHours: 2,
    status: "Published",
    owner: "Engineering",
    description: "ICD overview, quick-release latches, and safe pod swap procedure.",
  },
  {
    id: "oa-crs-pwr-01",
    code: "OA-PWR-230",
    title: "High-Voltage Battery Handling",
    category: "Engineering",
    mandatory: true,
    durationHours: 2,
    status: "Published",
    owner: "Power Systems",
    description: "Pack isolation, thermal watch, and Power Lab emergency response.",
  },
  {
    id: "oa-crs-ldr-01",
    code: "OA-LDR-310",
    title: "Programme Gate Leadership",
    category: "Leadership",
    mandatory: false,
    durationHours: 1.5,
    status: "Published",
    owner: "COO Office",
    description: "RAG reporting, risk escalation, and Board pack inputs for programme leads.",
  },
  {
    id: "oa-crs-fod-01",
    code: "OA-FOD-140",
    title: "FOD Prevention on the Hangar Floor",
    category: "Compliance",
    mandatory: true,
    durationHours: 1,
    status: "Published",
    owner: "Operations",
    description: "Foreign object debris walks, tool control, and Vertex bay hygiene.",
  },
  {
    id: "oa-crs-rad-01",
    code: "OA-RAD-215",
    title: "Flight Test Radio Discipline",
    category: "Flight Test",
    mandatory: true,
    durationHours: 1,
    status: "Published",
    owner: "Flight Test",
    description: "Call signs, abort phraseology, and silent periods during taxi/hover.",
  },
  {
    id: "oa-crs-itar-01",
    code: "OA-ITAR-115",
    title: "Export Control & ITAR Awareness",
    category: "Compliance",
    mandatory: true,
    durationHours: 1.5,
    status: "Published",
    owner: "Legal / Compliance",
    description: "Controlled tech, visitor escorts, and data sharing rules for US programmes.",
  },
  {
    id: "oa-crs-crm-01",
    code: "OA-CRM-320",
    title: "Crew Resource Management Basics",
    category: "Flight Test",
    mandatory: false,
    durationHours: 2,
    status: "Published",
    owner: "Flight Test",
    description: "Assertiveness, workload sharing, and challenge–response on campaign days.",
  },
  {
    id: "oa-crs-onb-01",
    code: "OA-ONB-105",
    title: "Houston Campus Ways of Working",
    category: "Induction",
    mandatory: true,
    durationHours: 1,
    status: "Published",
    owner: "People Ops",
    description: "Meeting norms, Slack/Teams channels, and how programme RAG is reported.",
  },
];

export const OA_EXTERNAL_COURSES: TqmsCourse[] = [
  {
    id: "oa-ext-faa-01",
    code: "EXT-FAA-107",
    title: "FAA Part 107 Remote Pilot (refresher)",
    category: "External",
    mandatory: false,
    durationHours: 8,
    status: "Published",
    owner: "External · FAA / vendor",
    description: "External refresher for UAS operations supporting Vertex flight campaigns.",
  },
  {
    id: "oa-ext-do178-01",
    code: "EXT-DO178C",
    title: "DO-178C Fundamentals (vendor)",
    category: "External",
    mandatory: false,
    durationHours: 16,
    status: "Published",
    owner: "External · Avionics academy",
    description: "Third-party software assurance course for flight-controls engineers.",
  },
  {
    id: "oa-ext-ul-01",
    code: "EXT-UL-2580",
    title: "UL 2580 Battery Safety Overview",
    category: "External",
    mandatory: false,
    durationHours: 6,
    status: "Published",
    owner: "External · UL Solutions",
    description: "Vendor workshop on thermal runaway and pack containment evidence.",
  },
  {
    id: "oa-ext-pm-01",
    code: "EXT-PMI-ACP",
    title: "Agile Project Leadership (PMI)",
    category: "External",
    mandatory: false,
    durationHours: 12,
    status: "Published",
    owner: "External · PMI",
    description: "External CPD for programme and project managers.",
  },
  {
    id: "oa-ext-osha-01",
    code: "EXT-OSHA-10",
    title: "OSHA 10 General Industry",
    category: "External",
    mandatory: false,
    durationHours: 10,
    status: "Published",
    owner: "External · OSHA authorized",
    description: "US general industry safety card for hangar and lab contractors.",
  },
  {
    id: "oa-ext-do254-01",
    code: "EXT-DO254",
    title: "DO-254 Hardware Assurance Intro",
    category: "External",
    mandatory: false,
    durationHours: 12,
    status: "Published",
    owner: "External · Avionics academy",
    description: "Vendor course on complex electronic hardware for Vertex avionics.",
  },
  {
    id: "oa-ext-as9100-01",
    code: "EXT-AS9100",
    title: "AS9100 Awareness (vendor)",
    category: "External",
    mandatory: false,
    durationHours: 8,
    status: "Published",
    owner: "External · Aerospace QMS trainer",
    description: "Third-party aerospace quality system overview for suppliers and QA staff.",
  },
  {
    id: "oa-ext-firstaid-01",
    code: "EXT-FA-CPR",
    title: "First Aid & CPR (American Red Cross)",
    category: "External",
    mandatory: false,
    durationHours: 6,
    status: "Published",
    owner: "External · American Red Cross",
    description: "Site first-aider renewal for Houston hangar and lab teams.",
  },
];

export const OA_QMS_COURSES: TqmsCourse[] = [
  {
    id: "oa-qms-crs-01",
    code: "OA-QMS-401",
    title: "Quality Fundamentals (OnwardAir)",
    category: "QMS",
    mandatory: true,
    durationHours: 2,
    status: "Published",
    owner: "Quality",
    description: "OA quality policy, configuration baselines, and gate evidence expectations.",
  },
  {
    id: "oa-qms-crs-02",
    code: "OA-QMS-410",
    title: "Document Control Practitioner",
    category: "QMS",
    mandatory: true,
    durationHours: 1.5,
    status: "Published",
    owner: "Quality",
    description: "Controlled documents, revision freezes, and ICD baselines.",
  },
  {
    id: "oa-qms-crs-03",
    code: "OA-QMS-420",
    title: "CAPA for Engineering Teams",
    category: "QMS",
    mandatory: false,
    durationHours: 2,
    status: "Published",
    owner: "Quality",
    description: "Containment, root cause, and effectiveness checks on flight-test findings.",
  },
  {
    id: "oa-qms-crs-04",
    code: "OA-QMS-430",
    title: "Internal Audit Awareness",
    category: "QMS",
    mandatory: false,
    durationHours: 1.5,
    status: "Published",
    owner: "Quality",
    description: "How programme audits feed Board risk and assurance packs.",
  },
  {
    id: "oa-qms-crs-05",
    code: "OA-QMS-440",
    title: "Nonconformance Reporting",
    category: "QMS",
    mandatory: true,
    durationHours: 1,
    status: "Published",
    owner: "Quality",
    description: "Raise, triage, and close NCRs from hangar, lab, and supplier findings.",
  },
  {
    id: "oa-qms-crs-06",
    code: "OA-QMS-450",
    title: "Configuration Management Essentials",
    category: "QMS",
    mandatory: true,
    durationHours: 2,
    status: "Published",
    owner: "Quality / Engineering",
    description: "Baselines, change boards, and evidence packs for Vertex / FLEX Pod gates.",
  },
  {
    id: "oa-qms-crs-07",
    code: "OA-QMS-460",
    title: "Supplier Quality Introduction",
    category: "QMS",
    mandatory: false,
    durationHours: 1.5,
    status: "Published",
    owner: "Quality / Procurement",
    description: "Incoming inspection, SCAR flow, and Houston supplier scorecards.",
  },
  {
    id: "oa-qms-crs-08",
    code: "OA-QMS-470",
    title: "Management Review Inputs",
    category: "QMS",
    mandatory: false,
    durationHours: 1,
    status: "Published",
    owner: "Quality",
    description: "Metrics, CAPA trends, and audit status that feed H1/H2 management review.",
  },
];

export const OA_QMS_LEARNING_PATHS: TqmsLearningPath[] = [
  {
    id: "oa-path-qf",
    name: "Quality Fundamentals",
    description: "Core OA quality system for engineers and operators joining Houston programmes.",
    estimatedHours: 4,
    moduleCount: 4,
    completionPercent: 55,
    assessmentScore: null,
    certificateAvailable: true,
    lessons: [
      { id: "l1", title: "OA quality policy", kind: "Lesson", durationMins: 25, done: true },
      { id: "l2", title: "Configuration baseline rules", kind: "Reading", durationMins: 30, done: true },
      { id: "l3", title: "Gate evidence checklist", kind: "Lesson", durationMins: 35, done: false },
      { id: "l4", title: "Fundamentals quiz", kind: "Quiz", durationMins: 20, done: false },
    ],
  },
  {
    id: "oa-path-doc",
    name: "Document Control",
    description: "Revision control for ICDs, drawings, and flight-test cards.",
    estimatedHours: 3,
    moduleCount: 3,
    completionPercent: 33,
    assessmentScore: null,
    certificateAvailable: true,
    lessons: [
      { id: "l1", title: "Controlled document types", kind: "Lesson", durationMins: 20, done: true },
      { id: "l2", title: "Change request workflow", kind: "Video", durationMins: 25, done: false },
      { id: "l3", title: "Freeze before taxi", kind: "Assessment", durationMins: 30, done: false },
    ],
  },
  {
    id: "oa-path-capa",
    name: "CAPA Practitioner",
    description: "Corrective action for flight-test and lab nonconformances.",
    estimatedHours: 5,
    moduleCount: 5,
    completionPercent: 20,
    assessmentScore: null,
    certificateAvailable: true,
    lessons: [
      { id: "l1", title: "Containment first", kind: "Lesson", durationMins: 20, done: true },
      { id: "l2", title: "5-Why for flight anomalies", kind: "Lesson", durationMins: 30, done: false },
      { id: "l3", title: "Effectiveness check", kind: "Reading", durationMins: 25, done: false },
      { id: "l4", title: "CAPA scenario", kind: "Quiz", durationMins: 25, done: false },
      { id: "l5", title: "Certificate", kind: "Certificate", durationMins: 5, done: false },
    ],
  },
  {
    id: "oa-path-audit",
    name: "Internal Auditing",
    description: "Programme audits that feed Board Risk Management.",
    estimatedHours: 4,
    moduleCount: 4,
    completionPercent: 0,
    assessmentScore: null,
    certificateAvailable: false,
    lessons: [
      { id: "l1", title: "Audit planning", kind: "Lesson", durationMins: 30, done: false },
      { id: "l2", title: "Evidence sampling", kind: "Lesson", durationMins: 30, done: false },
      { id: "l3", title: "Finding classification", kind: "Reading", durationMins: 25, done: false },
      { id: "l4", title: "Report to Board risk", kind: "Assessment", durationMins: 35, done: false },
    ],
  },
];

function learnerFromHr(
  emp: (typeof OA_HR_TEAM_EMPLOYEES)[number],
  index: number,
): TqmsLearner {
  const paths = ["Quality Fundamentals", "Flight Test Ground Rules", "OnwardAir Houston Induction"];
  const statuses = ["Complete", "In Progress", "In Progress", "Overdue", "Not Started"] as const;
  return {
    id: `oa-lrn-${emp.id}`,
    name: emp.preferredName || emp.fullName.split(",")[0] || emp.fullName,
    department: emp.department,
    location: "Houston",
    role: emp.role,
    manager: emp.manager || "Scott Parazynski",
    learningPath: paths[index % paths.length]!,
    status: statuses[index % statuses.length]!,
    startDate: emp.dateJoined ?? "2024-01-15",
  };
}

export function applyOnwardAirTqmsSeed(base: TqmsMockState): TqmsMockState {
  const staff = OA_STAFF_COURSES;
  const external = OA_EXTERNAL_COURSES;
  const qmsCourses = OA_QMS_COURSES;
  const courses = [...staff, ...external, ...qmsCourses];
  const learners = OA_HR_TEAM_EMPLOYEES.slice(0, 12).map((emp, index) =>
    learnerFromHr(emp, index),
  );

  const assignments: TqmsAssignment[] = [];
  const certificates: TqmsCertificate[] = [];
  learners.forEach((learner, li) => {
    const course = staff[li % staff.length]!;
    assignments.push({
      id: `oa-asg-${learner.id}-${course.id}`,
      learnerId: learner.id,
      courseId: course.id,
      progress: learner.status === "Complete" ? 100 : learner.status === "In Progress" ? 55 : 10,
      status:
        learner.status === "Complete"
          ? "Completed"
          : learner.status === "Overdue"
            ? "Overdue"
            : learner.status === "Not Started"
              ? "Not Started"
              : "In Progress",
      dueDate: "2026-09-30",
      completedAt: learner.status === "Complete" ? "2026-07-15" : null,
      mandatory: course.mandatory,
    });
    if (learner.status === "Complete") {
      certificates.push({
        id: `oa-cert-${learner.id}`,
        learnerId: learner.id,
        title: `${course.title} Certificate`,
        issuedAt: "2026-07-15",
        expiresAt: "2027-07-15",
        issuer: "OnwardAir Training",
      });
    }
  });

  const activity: TqmsActivity[] = [
    {
      id: "oa-trn-act-1",
      at: new Date().toISOString(),
      label: "OnwardAir QMS & training loaded",
      detail: "Houston quality system, CAPA, audits, and courses seeded for Vertex / FLEX Pod programmes.",
    },
    {
      id: "oa-trn-act-2",
      at: new Date(Date.now() - 3600_000).toISOString(),
      label: "Flight Test Ground Rules assigned",
      detail: "Assigned to Engineering learners ahead of ground taxi gate.",
    },
    {
      id: "oa-trn-act-3",
      at: new Date(Date.now() - 7200_000).toISOString(),
      label: "CAPA opened",
      detail: "CAPA-OA-2026-018 — checklist freeze bypass on taxi day.",
    },
    {
      id: "oa-trn-act-4",
      at: new Date(Date.now() - 86_400_000).toISOString(),
      label: "Supplier audit closed",
      detail: "TexComposites Houston audit — 4 findings, 2 actions open.",
    },
  ];

  const events: TqmsEvent[] = [
    {
      id: "oa-trn-ev-1",
      title: "Hangar H&S refresh — Flight Test",
      kind: "Classroom",
      when: "12 Aug 2026",
      owner: "Operations",
    },
    {
      id: "oa-trn-ev-2",
      title: "FLEX Pod™ interface briefing",
      kind: "Session",
      when: "18 Aug 2026",
      owner: "Mike Teeter",
    },
    {
      id: "oa-trn-ev-3",
      title: "Battery handling renewal due",
      kind: "Renewal",
      when: "28 Aug 2026",
      owner: "Power Systems",
    },
    {
      id: "oa-trn-ev-4",
      title: "H1 2026 Management Review",
      kind: "Session",
      when: "28 Aug 2026",
      owner: "Scott Parazynski, MD",
    },
  ];

  const withTraining: TqmsMockState = {
    ...base,
    courses,
    learners,
    assignments,
    certificates,
    learningPaths: [...OA_QMS_LEARNING_PATHS, ...OA_QMS_EXTRA_LEARNING_PATHS],
    activity,
    events,
  };

  return applyOnwardAirQmsOpsSeed(withTraining);
}

export function isOaStaffCourse(course: TqmsCourse) {
  return course.category !== "External" && course.category !== "QMS";
}

export function isOaExternalCourse(course: TqmsCourse) {
  return course.category === "External";
}

export function isOaQmsCourse(course: TqmsCourse) {
  return course.category === "QMS";
}
