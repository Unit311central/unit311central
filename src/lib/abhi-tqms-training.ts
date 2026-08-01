/**
 * ABHI-only internal staff training fixtures — current ABHI employees only.
 * No external course URLs; mirrors the CorpCentre training data shape.
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
  id: "abhi-lrn-peter",
  name: "Peter Ellingworth",
  role: "Chief Executive Officer",
  department: "Leadership",
  location: "London",
  manager: "Board",
};

const JUDITH = {
  id: "abhi-lrn-judith",
  name: "Judith Mellis",
  role: "Senior Manager, UK Market Affairs",
  department: "UK Market Affairs",
  location: "London",
  manager: "Peter Ellingworth",
};

const CHARLOTTE = {
  id: "abhi-lrn-charlotte",
  name: "Charlotte Hart",
  role: "Communications and Events Executive",
  department: "Communications",
  location: "London",
  manager: "Jonathan Evans",
};

const OWAIN = {
  id: "abhi-lrn-owain",
  name: "Owain Prescott",
  role: "Market Access Executive",
  department: "Market Access",
  location: "London",
  manager: "Luella Trickett",
};

const ADDIE = {
  id: "abhi-lrn-addie",
  name: "Addie Macgregor",
  role: "Sustainability & Ethics Manager",
  department: "Sustainability",
  location: "London",
  manager: "Jane Lewis",
};

export function createAbhiTqmsCourses(): TqmsCourse[] {
  return [
    {
      id: "abhi-crs-001",
      code: "ABHI-101",
      title: "ABHI Induction & Governance",
      category: "Onboarding",
      mandatory: true,
      durationHours: 2,
      status: "Published",
      owner: "People Ops",
    },
    {
      id: "abhi-crs-002",
      code: "ABHI-201",
      title: "UK Market Access & NHS Policy Essentials",
      category: "Policy",
      mandatory: true,
      durationHours: 3,
      status: "Published",
      owner: "UK Market Affairs",
    },
    {
      id: "abhi-crs-003",
      code: "ABHI-301",
      title: "Member Engagement & CRM Practice",
      category: "Operations",
      mandatory: true,
      durationHours: 2,
      status: "Published",
      owner: "Membership",
    },
    {
      id: "abhi-crs-004",
      code: "ABHI-401",
      title: "Event & Delegation Management",
      category: "Events",
      mandatory: false,
      durationHours: 3,
      status: "Published",
      owner: "Communications",
    },
  ];
}

export function createAbhiTqmsLearners(): TqmsLearner[] {
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
      startDate: "2022-02-01",
    },
    {
      id: JUDITH.id,
      name: JUDITH.name,
      department: JUDITH.department,
      location: JUDITH.location,
      role: JUDITH.role,
      manager: JUDITH.manager,
      learningPath: "Policy & Market Affairs Path",
      status: "In Progress",
      startDate: "2023-05-15",
    },
    {
      id: CHARLOTTE.id,
      name: CHARLOTTE.name,
      department: CHARLOTTE.department,
      location: CHARLOTTE.location,
      role: CHARLOTTE.role,
      manager: CHARLOTTE.manager,
      learningPath: "Communications & Events Path",
      status: "On Track",
      startDate: "2024-01-08",
    },
    {
      id: OWAIN.id,
      name: OWAIN.name,
      department: OWAIN.department,
      location: OWAIN.location,
      role: OWAIN.role,
      manager: OWAIN.manager,
      learningPath: "Policy & Market Affairs Path",
      status: "In Progress",
      startDate: "2024-06-03",
    },
    {
      id: ADDIE.id,
      name: ADDIE.name,
      department: ADDIE.department,
      location: ADDIE.location,
      role: ADDIE.role,
      manager: ADDIE.manager,
      learningPath: "Leadership Essentials",
      status: "Overdue",
      startDate: "2023-09-18",
    },
  ];
}

export function createAbhiTqmsAssignments(): TqmsAssignment[] {
  return [
    {
      id: "abhi-asg-001",
      learnerId: PETER.id,
      courseId: "abhi-crs-001",
      progress: 100,
      status: "Completed",
      dueDate: "2022-03-01",
      completedAt: "2022-02-24",
      mandatory: true,
    },
    {
      id: "abhi-asg-002",
      learnerId: PETER.id,
      courseId: "abhi-crs-002",
      progress: 100,
      status: "Completed",
      dueDate: "2022-05-01",
      completedAt: "2022-04-20",
      mandatory: true,
    },
    {
      id: "abhi-asg-003",
      learnerId: JUDITH.id,
      courseId: "abhi-crs-001",
      progress: 100,
      status: "Completed",
      dueDate: "2023-06-15",
      completedAt: "2023-06-10",
      mandatory: true,
    },
    {
      id: "abhi-asg-004",
      learnerId: JUDITH.id,
      courseId: "abhi-crs-002",
      progress: 85,
      status: "In Progress",
      dueDate: "2026-08-30",
      completedAt: null,
      mandatory: true,
    },
    {
      id: "abhi-asg-005",
      learnerId: JUDITH.id,
      courseId: "abhi-crs-003",
      progress: 60,
      status: "In Progress",
      dueDate: "2026-09-15",
      completedAt: null,
      mandatory: true,
    },
    {
      id: "abhi-asg-006",
      learnerId: CHARLOTTE.id,
      courseId: "abhi-crs-001",
      progress: 100,
      status: "Completed",
      dueDate: "2024-02-08",
      completedAt: "2024-02-01",
      mandatory: true,
    },
    {
      id: "abhi-asg-007",
      learnerId: CHARLOTTE.id,
      courseId: "abhi-crs-004",
      progress: 70,
      status: "In Progress",
      dueDate: "2026-08-20",
      completedAt: null,
      mandatory: false,
    },
    {
      id: "abhi-asg-008",
      learnerId: OWAIN.id,
      courseId: "abhi-crs-001",
      progress: 100,
      status: "Completed",
      dueDate: "2024-07-03",
      completedAt: "2024-06-28",
      mandatory: true,
    },
    {
      id: "abhi-asg-009",
      learnerId: OWAIN.id,
      courseId: "abhi-crs-002",
      progress: 45,
      status: "In Progress",
      dueDate: "2026-08-25",
      completedAt: null,
      mandatory: true,
    },
    {
      id: "abhi-asg-010",
      learnerId: OWAIN.id,
      courseId: "abhi-crs-003",
      progress: 30,
      status: "In Progress",
      dueDate: "2026-09-30",
      completedAt: null,
      mandatory: true,
    },
    {
      id: "abhi-asg-011",
      learnerId: ADDIE.id,
      courseId: "abhi-crs-001",
      progress: 100,
      status: "Completed",
      dueDate: "2023-10-18",
      completedAt: "2023-10-12",
      mandatory: true,
    },
    {
      id: "abhi-asg-012",
      learnerId: ADDIE.id,
      courseId: "abhi-crs-002",
      progress: 25,
      status: "Overdue",
      dueDate: "2026-06-30",
      completedAt: null,
      mandatory: true,
    },
  ];
}

export function createAbhiTqmsCertificates(): TqmsCertificate[] {
  return [
    {
      id: "abhi-crt-001",
      learnerId: PETER.id,
      title: "ABHI Induction & Governance",
      issuedAt: "2022-02-24",
      expiresAt: "2027-02-24",
      issuer: "ABHI Academy",
    },
    {
      id: "abhi-crt-002",
      learnerId: PETER.id,
      title: "UK Market Access & NHS Policy Essentials",
      issuedAt: "2022-04-20",
      expiresAt: "2027-04-20",
      issuer: "ABHI Academy",
    },
    {
      id: "abhi-crt-003",
      learnerId: JUDITH.id,
      title: "ABHI Induction & Governance",
      issuedAt: "2023-06-10",
      expiresAt: "2026-06-10",
      issuer: "ABHI Academy",
    },
    {
      id: "abhi-crt-004",
      learnerId: CHARLOTTE.id,
      title: "ABHI Induction & Governance",
      issuedAt: "2024-02-01",
      expiresAt: "2027-02-01",
      issuer: "ABHI Academy",
    },
    {
      id: "abhi-crt-005",
      learnerId: OWAIN.id,
      title: "ABHI Induction & Governance",
      issuedAt: "2024-06-28",
      expiresAt: "2027-06-28",
      issuer: "ABHI Academy",
    },
    {
      id: "abhi-crt-006",
      learnerId: ADDIE.id,
      title: "ABHI Induction & Governance",
      issuedAt: "2023-10-12",
      expiresAt: "2026-10-12",
      issuer: "ABHI Academy",
    },
  ];
}

export function createAbhiTqmsAssessments(): TqmsAssessment[] {
  return [
    {
      id: "abhi-asm-001",
      learnerId: JUDITH.id,
      title: "Market Access & NHS Policy Check",
      score: null,
      status: "Pending",
      dueDate: "2026-08-30",
    },
    {
      id: "abhi-asm-002",
      learnerId: CHARLOTTE.id,
      title: "Event & Delegation Management Quiz",
      score: 88,
      status: "Passed",
      dueDate: "2026-07-15",
    },
    {
      id: "abhi-asm-003",
      learnerId: OWAIN.id,
      title: "Member Engagement & CRM Assessment",
      score: null,
      status: "Pending",
      dueDate: "2026-09-30",
    },
    {
      id: "abhi-asm-004",
      learnerId: ADDIE.id,
      title: "UK Market Access Assessment",
      score: null,
      status: "Pending",
      dueDate: "2026-06-30",
    },
  ];
}

export function createAbhiTqmsLearningPaths(): TqmsLearningPath[] {
  return [
    {
      id: "abhi-path-001",
      name: "Leadership Essentials",
      description: "Executive onboarding and governance grounding for ABHI leadership.",
      estimatedHours: 8,
      moduleCount: 3,
      completionPercent: 85,
      assessmentScore: 92,
      certificateAvailable: true,
      lessons: [
        { id: "abhi-l1", title: "ABHI induction & governance", kind: "Lesson", durationMins: 30, done: true },
        { id: "abhi-l2", title: "Board reporting essentials", kind: "Reading", durationMins: 20, done: true },
        { id: "abhi-l3", title: "Leadership check-in", kind: "Assessment", durationMins: 25, done: false },
      ],
    },
    {
      id: "abhi-path-002",
      name: "Policy & Market Affairs Path",
      description: "Regulatory, NHS policy, and market access grounding for UK Market Affairs staff.",
      estimatedHours: 10,
      moduleCount: 4,
      completionPercent: 55,
      assessmentScore: null,
      certificateAvailable: false,
      lessons: [
        { id: "abhi-p1", title: "ABHI induction & governance", kind: "Lesson", durationMins: 30, done: true },
        { id: "abhi-p2", title: "NHS adoption pathways", kind: "Video", durationMins: 25, done: true },
        { id: "abhi-p3", title: "Member engagement & CRM practice", kind: "Lesson", durationMins: 35, done: false },
        { id: "abhi-p4", title: "Policy briefing assessment", kind: "Assessment", durationMins: 30, done: false },
      ],
    },
    {
      id: "abhi-path-003",
      name: "Communications & Events Path",
      description: "Event coordination and member communications grounding.",
      estimatedHours: 7,
      moduleCount: 3,
      completionPercent: 70,
      assessmentScore: 88,
      certificateAvailable: true,
      lessons: [
        { id: "abhi-c1", title: "ABHI induction & governance", kind: "Lesson", durationMins: 30, done: true },
        { id: "abhi-c2", title: "Event & delegation management", kind: "Lesson", durationMins: 35, done: true },
        { id: "abhi-c3", title: "Delegation logistics quiz", kind: "Quiz", durationMins: 20, done: false },
      ],
    },
  ];
}

export function applyAbhiTqmsSeed<T extends {
  courses: TqmsCourse[];
  learners: TqmsLearner[];
  assignments: TqmsAssignment[];
  certificates: TqmsCertificate[];
  assessments: TqmsAssessment[];
  learningPaths: TqmsLearningPath[];
}>(base: T): T {
  return {
    ...base,
    courses: createAbhiTqmsCourses(),
    learners: createAbhiTqmsLearners(),
    assignments: createAbhiTqmsAssignments(),
    certificates: createAbhiTqmsCertificates(),
    assessments: createAbhiTqmsAssessments(),
    learningPaths: createAbhiTqmsLearningPaths(),
  };
}

export function isNonAbhiTrainingLeak(learners: TqmsLearner[]): boolean {
  return learners.some((row) =>
    /Amelia Hart|Noah Patel|Flight Operations|Avionics|Ground Crew|Barcelona|Peter Durning|Daniel Sazdanoff|John Amoroso|Elias Bahbah|Mick Lenton/i.test(
      `${row.name} ${row.department} ${row.role} ${row.location}`,
    ),
  );
}
