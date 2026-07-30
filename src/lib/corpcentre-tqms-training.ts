/**
 * CorpCentre-only Staff Training fixtures — current AU employees only.
 */
import type {
  TqmsAssignment,
  TqmsAssessment,
  TqmsCertificate,
  TqmsCourse,
  TqmsLearner,
  TqmsLearningPath,
} from "@/lib/tqms-data";

const PETER = {
  id: "cc-lrn-peter",
  name: "Peter Durning",
  role: "Managing Director",
  department: "Leadership",
  location: "Sydney",
  manager: "Board",
};

const DANIEL = {
  id: "cc-lrn-daniel",
  name: "Daniel Sazdanoff",
  role: "Operations Director",
  department: "Leadership",
  location: "Sydney",
  manager: "Peter Durning",
};

const JOHN = {
  id: "cc-lrn-john",
  name: "John Amoroso",
  role: "IT Technician",
  department: "IT",
  location: "Sydney",
  manager: "Daniel Sazdanoff",
};

const ELIAS = {
  id: "cc-lrn-elias",
  name: "Elias Bahbah",
  role: "IT Technician",
  department: "IT",
  location: "Sydney",
  manager: "Daniel Sazdanoff",
};

const MICK = {
  id: "cc-lrn-mick",
  name: "Mick Lenton",
  role: "IT Technician",
  department: "IT",
  location: "Sydney",
  manager: "Daniel Sazdanoff",
};

export function createCorpCentreTqmsCourses(): TqmsCourse[] {
  return [
    {
      id: "cc-crs-001",
      code: "CC-101",
      title: "CorpCentre Induction",
      category: "Onboarding",
      mandatory: true,
      durationHours: 2,
      status: "Published",
      owner: "People Ops",
    },
    {
      id: "cc-crs-002",
      code: "CC-201",
      title: "Workplace Health & Safety (AU)",
      category: "Compliance",
      mandatory: true,
      durationHours: 1.5,
      status: "Published",
      owner: "WHS",
    },
    {
      id: "cc-crs-003",
      code: "CC-301",
      title: "Information Security Awareness",
      category: "Compliance",
      mandatory: true,
      durationHours: 1.5,
      status: "Published",
      owner: "IT Security",
    },
    {
      id: "cc-crs-004",
      code: "CC-401",
      title: "Managed Services Delivery",
      category: "Operations",
      mandatory: true,
      durationHours: 4,
      status: "Published",
      owner: "Operations",
    },
    {
      id: "cc-crs-005",
      code: "CC-501",
      title: "Client Escalation Playbook",
      category: "Operations",
      mandatory: false,
      durationHours: 2,
      status: "Published",
      owner: "Operations",
    },
    {
      id: "cc-crs-006",
      code: "CC-601",
      title: "Network & Telecoms Fundamentals",
      category: "Technical",
      mandatory: true,
      durationHours: 5,
      status: "Published",
      owner: "IT",
    },
    {
      id: "cc-crs-007",
      code: "CC-701",
      title: "Leadership for Service Delivery",
      category: "Leadership",
      mandatory: false,
      durationHours: 6,
      status: "Published",
      owner: "Leadership",
    },
  ];
}

export function createCorpCentreTqmsLearners(): TqmsLearner[] {
  return [
    {
      id: PETER.id,
      name: PETER.name,
      department: PETER.department,
      location: PETER.location,
      role: PETER.role,
      manager: PETER.manager,
      learningPath: "Leadership Essentials",
      status: "On Track",
      startDate: "2024-01-15",
    },
    {
      id: DANIEL.id,
      name: DANIEL.name,
      department: DANIEL.department,
      location: DANIEL.location,
      role: DANIEL.role,
      manager: DANIEL.manager,
      learningPath: "Service Delivery Leadership",
      status: "In Progress",
      startDate: "2024-03-01",
    },
    {
      id: JOHN.id,
      name: JOHN.name,
      department: JOHN.department,
      location: JOHN.location,
      role: JOHN.role,
      manager: JOHN.manager,
      learningPath: "Field Technician Path",
      status: "In Progress",
      startDate: "2025-02-10",
    },
    {
      id: ELIAS.id,
      name: ELIAS.name,
      department: ELIAS.department,
      location: ELIAS.location,
      role: ELIAS.role,
      manager: ELIAS.manager,
      learningPath: "Field Technician Path",
      status: "On Track",
      startDate: "2025-04-22",
    },
    {
      id: MICK.id,
      name: MICK.name,
      department: MICK.department,
      location: MICK.location,
      role: MICK.role,
      manager: MICK.manager,
      learningPath: "Field Technician Path",
      status: "Overdue",
      startDate: "2025-06-01",
    },
  ];
}

export function createCorpCentreTqmsAssignments(): TqmsAssignment[] {
  return [
    {
      id: "cc-asg-001",
      learnerId: PETER.id,
      courseId: "cc-crs-001",
      progress: 100,
      status: "Completed",
      dueDate: "2024-02-01",
      completedAt: "2024-01-28",
      mandatory: true,
    },
    {
      id: "cc-asg-002",
      learnerId: PETER.id,
      courseId: "cc-crs-007",
      progress: 80,
      status: "In Progress",
      dueDate: "2026-08-30",
      completedAt: null,
      mandatory: false,
    },
    {
      id: "cc-asg-003",
      learnerId: DANIEL.id,
      courseId: "cc-crs-001",
      progress: 100,
      status: "Completed",
      dueDate: "2024-03-15",
      completedAt: "2024-03-12",
      mandatory: true,
    },
    {
      id: "cc-asg-004",
      learnerId: DANIEL.id,
      courseId: "cc-crs-004",
      progress: 90,
      status: "In Progress",
      dueDate: "2026-08-15",
      completedAt: null,
      mandatory: true,
    },
    {
      id: "cc-asg-005",
      learnerId: DANIEL.id,
      courseId: "cc-crs-007",
      progress: 55,
      status: "In Progress",
      dueDate: "2026-09-30",
      completedAt: null,
      mandatory: false,
    },
    {
      id: "cc-asg-006",
      learnerId: JOHN.id,
      courseId: "cc-crs-001",
      progress: 100,
      status: "Completed",
      dueDate: "2025-02-28",
      completedAt: "2025-02-20",
      mandatory: true,
    },
    {
      id: "cc-asg-007",
      learnerId: JOHN.id,
      courseId: "cc-crs-006",
      progress: 72,
      status: "In Progress",
      dueDate: "2026-08-10",
      completedAt: null,
      mandatory: true,
    },
    {
      id: "cc-asg-008",
      learnerId: JOHN.id,
      courseId: "cc-crs-003",
      progress: 100,
      status: "Completed",
      dueDate: "2026-05-01",
      completedAt: "2026-04-22",
      mandatory: true,
    },
    {
      id: "cc-asg-009",
      learnerId: ELIAS.id,
      courseId: "cc-crs-001",
      progress: 100,
      status: "Completed",
      dueDate: "2025-05-01",
      completedAt: "2025-04-28",
      mandatory: true,
    },
    {
      id: "cc-asg-010",
      learnerId: ELIAS.id,
      courseId: "cc-crs-006",
      progress: 88,
      status: "In Progress",
      dueDate: "2026-08-20",
      completedAt: null,
      mandatory: true,
    },
    {
      id: "cc-asg-011",
      learnerId: ELIAS.id,
      courseId: "cc-crs-002",
      progress: 100,
      status: "Completed",
      dueDate: "2026-03-01",
      completedAt: "2026-02-18",
      mandatory: true,
    },
    {
      id: "cc-asg-012",
      learnerId: MICK.id,
      courseId: "cc-crs-001",
      progress: 100,
      status: "Completed",
      dueDate: "2025-06-30",
      completedAt: "2025-06-25",
      mandatory: true,
    },
    {
      id: "cc-asg-013",
      learnerId: MICK.id,
      courseId: "cc-crs-006",
      progress: 20,
      status: "Overdue",
      dueDate: "2026-07-01",
      completedAt: null,
      mandatory: true,
    },
    {
      id: "cc-asg-014",
      learnerId: MICK.id,
      courseId: "cc-crs-003",
      progress: 40,
      status: "Overdue",
      dueDate: "2026-07-10",
      completedAt: null,
      mandatory: true,
    },
    {
      id: "cc-asg-015",
      learnerId: JOHN.id,
      courseId: "cc-crs-005",
      progress: 60,
      status: "In Progress",
      dueDate: "2026-08-31",
      completedAt: null,
      mandatory: false,
    },
  ];
}

export function createCorpCentreTqmsCertificates(): TqmsCertificate[] {
  return [
    {
      id: "cc-crt-001",
      learnerId: PETER.id,
      title: "CorpCentre Induction",
      issuedAt: "2024-01-28",
      expiresAt: "2027-01-28",
      issuer: "CorpCentre Academy",
    },
    {
      id: "cc-crt-002",
      learnerId: DANIEL.id,
      title: "CorpCentre Induction",
      issuedAt: "2024-03-12",
      expiresAt: "2027-03-12",
      issuer: "CorpCentre Academy",
    },
    {
      id: "cc-crt-003",
      learnerId: JOHN.id,
      title: "Information Security Awareness",
      issuedAt: "2026-04-22",
      expiresAt: "2027-04-22",
      issuer: "CorpCentre Academy",
    },
    {
      id: "cc-crt-004",
      learnerId: ELIAS.id,
      title: "Workplace Health & Safety (AU)",
      issuedAt: "2026-02-18",
      expiresAt: "2027-02-18",
      issuer: "CorpCentre Academy",
    },
    {
      id: "cc-crt-005",
      learnerId: MICK.id,
      title: "CorpCentre Induction",
      issuedAt: "2025-06-25",
      expiresAt: "2026-06-25",
      issuer: "CorpCentre Academy",
    },
  ];
}

export function createCorpCentreTqmsAssessments(): TqmsAssessment[] {
  return [
    {
      id: "cc-asm-001",
      learnerId: DANIEL.id,
      title: "Managed Services Delivery Check",
      score: null,
      status: "Pending",
      dueDate: "2026-08-15",
    },
    {
      id: "cc-asm-002",
      learnerId: JOHN.id,
      title: "Network Fundamentals Quiz",
      score: 84,
      status: "Passed",
      dueDate: "2026-05-01",
    },
    {
      id: "cc-asm-003",
      learnerId: ELIAS.id,
      title: "Network Fundamentals Quiz",
      score: 91,
      status: "Passed",
      dueDate: "2026-05-12",
    },
    {
      id: "cc-asm-004",
      learnerId: MICK.id,
      title: "InfoSec Awareness Assessment",
      score: null,
      status: "Pending",
      dueDate: "2026-07-10",
    },
  ];
}

export function createCorpCentreTqmsLearningPaths(): TqmsLearningPath[] {
  return [
    {
      id: "cc-path-001",
      name: "Leadership Essentials",
      description: "MD / director onboarding and service leadership.",
      estimatedHours: 10,
      moduleCount: 4,
      completionPercent: 75,
      assessmentScore: 90,
      certificateAvailable: true,
      lessons: [
        { id: "cc-l1", title: "CorpCentre induction", kind: "Lesson", durationMins: 30, done: true },
        { id: "cc-l2", title: "Service leadership briefing", kind: "Video", durationMins: 25, done: true },
        { id: "cc-l3", title: "Escalation playbook", kind: "Reading", durationMins: 20, done: true },
        { id: "cc-l4", title: "Leadership check-in", kind: "Assessment", durationMins: 30, done: false },
      ],
    },
    {
      id: "cc-path-002",
      name: "Service Delivery Leadership",
      description: "Operations ownership for managed Telco & IT programmes.",
      estimatedHours: 14,
      moduleCount: 5,
      completionPercent: 62,
      assessmentScore: null,
      certificateAvailable: false,
      lessons: [
        { id: "cc-d1", title: "Managed services model", kind: "Lesson", durationMins: 35, done: true },
        { id: "cc-d2", title: "SLA ownership", kind: "Video", durationMins: 20, done: true },
        { id: "cc-d3", title: "Client escalation playbook", kind: "Reading", durationMins: 25, done: true },
        { id: "cc-d4", title: "Delivery quiz", kind: "Quiz", durationMins: 15, done: false },
        { id: "cc-d5", title: "Programme assessment", kind: "Assessment", durationMins: 40, done: false },
      ],
    },
    {
      id: "cc-path-003",
      name: "Field Technician Path",
      description: "Induction, WHS, security and network fundamentals for technicians.",
      estimatedHours: 12,
      moduleCount: 5,
      completionPercent: 58,
      assessmentScore: 84,
      certificateAvailable: true,
      lessons: [
        { id: "cc-t1", title: "CorpCentre induction", kind: "Lesson", durationMins: 25, done: true },
        { id: "cc-t2", title: "WHS essentials (AU)", kind: "Video", durationMins: 20, done: true },
        { id: "cc-t3", title: "InfoSec awareness", kind: "Reading", durationMins: 20, done: true },
        { id: "cc-t4", title: "Network fundamentals", kind: "Lesson", durationMins: 45, done: false },
        { id: "cc-t5", title: "Technician assessment", kind: "Assessment", durationMins: 30, done: false },
      ],
    },
  ];
}

export function applyCorpCentreTqmsSeed<T extends {
  courses: TqmsCourse[];
  learners: TqmsLearner[];
  assignments: TqmsAssignment[];
  certificates: TqmsCertificate[];
  assessments: TqmsAssessment[];
  learningPaths: TqmsLearningPath[];
}>(base: T): T {
  return {
    ...base,
    courses: createCorpCentreTqmsCourses(),
    learners: createCorpCentreTqmsLearners(),
    assignments: createCorpCentreTqmsAssignments(),
    certificates: createCorpCentreTqmsCertificates(),
    assessments: createCorpCentreTqmsAssessments(),
    learningPaths: createCorpCentreTqmsLearningPaths(),
  };
}

export function isAviationTrainingLeak(learners: TqmsLearner[]): boolean {
  return learners.some((row) =>
    /Amelia Hart|Noah Patel|Flight Operations|Avionics|Ground Crew|Barcelona/i.test(
      `${row.name} ${row.department} ${row.role} ${row.location}`,
    ),
  );
}
