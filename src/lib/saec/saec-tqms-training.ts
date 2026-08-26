import type { TqmsMockState } from "@/lib/tqms-mock-store";
import type {
  TqmsActivity,
  TqmsAssignment,
  TqmsCertificate,
  TqmsCourse,
  TqmsEvent,
  TqmsLearner,
  TqmsLearningPath,
  TqmsQmsSection,
  TqmsDocStatus,
} from "@/lib/tqms-data";
import { SAEC_HR_TEAM_EMPLOYEES } from "@/lib/saec/demo/hr-team-data";

const SAEC_COURSES: TqmsCourse[] = [
  {
    id: "saec-course-lift-tech",
    code: "OT-LIFT-101",
    title: "Passenger lift technician certification",
    category: "Technical",
    mandatory: true,
    durationHours: 16,
    status: "Published",
    owner: "Pieter van der Merwe",
    description: "Installation, adjustment, and safety testing for passenger lifts.",
  },
  {
    id: "saec-course-esc-tech",
    code: "OT-ESC-201",
    title: "Escalator commissioning & safety",
    category: "Technical",
    mandatory: true,
    durationHours: 12,
    status: "Published",
    owner: "Bongani Cele",
    description: "Escalator commissioning, step chain inspection, and public safety.",
  },
  {
    id: "saec-course-hs",
    code: "OT-HS-040",
    title: "Working at height — lift shafts",
    category: "Health & Safety",
    mandatory: true,
    durationHours: 4,
    status: "Published",
    owner: "Lerato Nkosi",
  },
  {
    id: "saec-course-qms",
    code: "OT-QMS-010",
    title: "ISO 9001 awareness for field teams",
    category: "QMS",
    mandatory: false,
    durationHours: 3,
    status: "Published",
    owner: "Nadia Govender",
  },
  {
    id: "saec-course-rescue",
    code: "OT-HS-050",
    title: "Passenger rescue & entrapment response",
    category: "Health & Safety",
    mandatory: true,
    durationHours: 6,
    status: "Published",
    owner: "Lerato Nkosi",
    description: "Emergency release, communication, and hospital lift protocols.",
  },
  {
    id: "saec-course-klk",
    code: "OT-ESC-220",
    title: "KLK range commissioning programme",
    category: "Technical",
    mandatory: true,
    durationHours: 8,
    status: "Published",
    owner: "Bongani Cele",
    description: "KLK escalator commissioning sequence and mall trading coordination.",
  },
  {
    id: "saec-course-induction",
    code: "OT-IND-001",
    title: "OmniTransit field induction",
    category: "Induction",
    mandatory: true,
    durationHours: 2,
    status: "Published",
    owner: "Annelize Fourie",
    description: "Company policies, PPE, and site access for national field teams.",
  },
  {
    id: "saec-course-lead",
    code: "OT-LDR-310",
    title: "Site leadership for installation managers",
    category: "Leadership",
    mandatory: false,
    durationHours: 4,
    status: "Published",
    owner: "Dewald Lassen",
  },
];

const SAEC_LEARNING_PATHS: TqmsLearningPath[] = [
  {
    id: "saec-path-field",
    name: "Field technician fundamentals",
    description: "Core lift and escalator competency for new field technicians.",
    estimatedHours: 22,
    moduleCount: 4,
    completionPercent: 62,
    assessmentScore: null,
    certificateAvailable: true,
    lessons: [
      { id: "l1", title: "OmniTransit induction", kind: "Lesson", durationMins: 30, done: true },
      { id: "l2", title: "Lift technician basics", kind: "Lesson", durationMins: 45, done: true },
      { id: "l3", title: "Escalator safety", kind: "Video", durationMins: 40, done: false },
      { id: "l4", title: "Fundamentals assessment", kind: "Quiz", durationMins: 25, done: false },
    ],
  },
  {
    id: "saec-path-safety",
    name: "Mandatory safety renewals",
    description: "Annual health & safety and rescue refresher pathway.",
    estimatedHours: 10,
    moduleCount: 3,
    completionPercent: 45,
    assessmentScore: null,
    certificateAvailable: true,
    lessons: [
      { id: "l1", title: "Working at height", kind: "Lesson", durationMins: 40, done: true },
      { id: "l2", title: "Rescue drill", kind: "Assessment", durationMins: 60, done: false },
      { id: "l3", title: "Safety certificate", kind: "Certificate", durationMins: 5, done: false },
    ],
  },
  {
    id: "saec-path-klk",
    name: "KLK commissioning specialist",
    description: "Escalator commissioning for mall modernisation programmes.",
    estimatedHours: 14,
    moduleCount: 3,
    completionPercent: 28,
    assessmentScore: null,
    certificateAvailable: true,
    lessons: [
      { id: "l1", title: "KLK technical overview", kind: "Lesson", durationMins: 35, done: true },
      { id: "l2", title: "Night-shift commissioning", kind: "Video", durationMins: 45, done: false },
      { id: "l3", title: "Commissioning sign-off", kind: "Assessment", durationMins: 40, done: false },
    ],
  },
];

const SAEC_QMS_SECTIONS: TqmsQmsSection[] = [
  {
    id: "saec-qms-install",
    name: "Installation procedures",
    owner: "Pieter van der Merwe",
    status: "On track",
    outstanding: 2,
    nextDue: "2026-10-01",
    view: "qms-procedures",
  },
  {
    id: "saec-qms-service",
    name: "Service & maintenance SOPs",
    owner: "Lerato Nkosi",
    status: "On track",
    outstanding: 1,
    nextDue: "2026-09-15",
    view: "qms-procedures",
  },
  {
    id: "saec-qms-safety",
    name: "Health & safety",
    owner: "Nadia Govender",
    status: "On track",
    outstanding: 0,
    nextDue: "2026-11-01",
    view: "qms-compliance",
  },
];

const LEARNER_STATUSES = [
  "Complete",
  "In Progress",
  "In Progress",
  "Overdue",
  "Not Started",
] as const;

function learnerFromEmployee(
  emp: (typeof SAEC_HR_TEAM_EMPLOYEES)[number],
  index: number,
): TqmsLearner {
  const paths = [
    "Field technician fundamentals",
    "Mandatory safety renewals",
    "KLK commissioning specialist",
    "OmniTransit field induction",
  ];
  return {
    id: `saec-lrn-${index + 1}`,
    name: emp.preferredName ?? emp.fullName.split(" ")[0] ?? emp.fullName,
    department: emp.department,
    location: emp.location,
    role: emp.role,
    manager: emp.manager || "Dewald Lassen",
    learningPath: paths[index % paths.length]!,
    status: LEARNER_STATUSES[index % LEARNER_STATUSES.length]!,
    startDate: emp.dateJoined,
  };
}

export function applySaecTqmsSeed(base: TqmsMockState): TqmsMockState {
  const courses = SAEC_COURSES;
  const learners = SAEC_HR_TEAM_EMPLOYEES.slice(0, 16).map((emp, index) =>
    learnerFromEmployee(emp, index),
  );

  const assignments: TqmsAssignment[] = [];
  const certificates: TqmsCertificate[] = [];

  learners.forEach((learner, li) => {
    const mandatoryCourses = courses.filter((c) => c.mandatory);
    const course = mandatoryCourses[li % mandatoryCourses.length] ?? courses[0]!;
    const progress =
      learner.status === "Complete"
        ? 100
        : learner.status === "In Progress"
          ? 55
          : learner.status === "Overdue"
            ? 35
            : 5;
    assignments.push({
      id: `saec-asg-${learner.id}-${course.id}`,
      learnerId: learner.id,
      courseId: course.id,
      progress,
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
        id: `saec-cert-${learner.id}-${course.id}`,
        learnerId: learner.id,
        title: `${course.title} — demo certificate`,
        issuedAt: "2026-07-15",
        expiresAt: "2027-07-15",
        issuer: "OmniTransit Training",
      });
    }
  });

  const overdueAssignments = assignments.filter((row) => row.status === "Overdue").length;
  const completedAssignments = assignments.filter((row) => row.status === "Completed").length;

  const activity: TqmsActivity[] = [
    {
      id: "saec-tqms-act",
      at: new Date().toISOString(),
      label: "OmniTransit training & QMS loaded",
      detail: `${learners.length} learners · ${completedAssignments} completed · ${overdueAssignments} overdue.`,
    },
    {
      id: "saec-tqms-act-2",
      at: new Date(Date.now() - 3600_000).toISOString(),
      label: "KLK commissioning course assigned",
      detail: "Gauteng installation cohort ahead of Centurion programme.",
    },
    {
      id: "saec-tqms-act-3",
      at: new Date(Date.now() - 86_400_000).toISOString(),
      label: "Rescue drill renewal overdue",
      detail: "3 Western Cape technicians — reminders sent.",
    },
    ...base.activity.slice(0, 2),
  ];

  const events: TqmsEvent[] = [
    {
      id: "saec-trn-ev-1",
      title: "Working at height refresher — Gauteng",
      kind: "Classroom",
      when: "5 Sep 2026",
      owner: "Lerato Nkosi",
    },
    {
      id: "saec-trn-ev-2",
      title: "KLK commissioning workshop",
      kind: "Session",
      when: "12 Sep 2026",
      owner: "Bongani Cele",
    },
    {
      id: "saec-trn-ev-3",
      title: "Rescue response renewal due",
      kind: "Renewal",
      when: "18 Sep 2026",
      owner: "Lerato Nkosi",
    },
    {
      id: "saec-trn-ev-4",
      title: "ISO 9001 surveillance prep",
      kind: "Session",
      when: "22 Sep 2026",
      owner: "Nadia Govender",
    },
  ];

  return {
    ...base,
    courses,
    learners,
    assignments,
    certificates,
    learningPaths: SAEC_LEARNING_PATHS,
    qmsSections: SAEC_QMS_SECTIONS,
    documents: base.documents.slice(0, 3).map((doc, index) => ({
      ...doc,
      id: `saec-doc-${index + 1}`,
      number: `OT-POL-${String(index + 1).padStart(3, "0")}`,
      title:
        index === 0
          ? "Lift installation quality plan"
          : index === 1
            ? "Emergency rescue procedure"
            : "Escalator inspection checklist",
      owner: "Nadia Govender",
      status: "Approved" as TqmsDocStatus,
    })),
    capas: [
      {
        id: "saec-capa-1",
        reference: "CAPA-2026-014",
        issue: "Incomplete commissioning checklist on site file",
        owner: "Bongani Cele",
        priority: "Medium",
        status: "Open",
        dueDate: "2026-09-15",
        rootCause: "Mobile form sync delay",
        timeline: [{ at: "2026-08-10", label: "Opened" }],
      },
    ],
    audits: [
      {
        id: "saec-audit-1",
        title: "ISO 9001 surveillance audit",
        scope: "Pretoria HQ and Gauteng service depots",
        lead: "Nadia Govender",
        scheduledFor: "2026-09-22",
        status: "Scheduled",
        findings: 0,
        actionsOpen: 0,
      },
    ],
    activity,
    events,
  };
}
