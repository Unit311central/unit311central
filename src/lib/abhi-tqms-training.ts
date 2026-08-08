/**
 * ABHI-only internal staff training fixtures — current ABHI employees only.
 * Course catalogue matches Talanton Assigned Courses (compliance programme).
 */
import { applyAbhiQmsOpsSeed } from "@/lib/abhi/qms-data";
import { ABHI_COMPLIANCE_COURSES } from "@/lib/abhi-training-courses";
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
  return ABHI_COMPLIANCE_COURSES.map((course, index) => ({
    id: course.id,
    code: `ABHI-${String(index + 1).padStart(3, "0")}`,
    title: course.title,
    category: course.category,
    mandatory: course.mandatory,
    durationHours: Math.max(0.5, Math.round((course.durationMinutes / 60) * 10) / 10),
    status: "Published" as const,
    owner: "People Ops",
  }));
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
  const courses = ABHI_COMPLIANCE_COURSES;
  const learners = [PETER, JUDITH, CHARLOTTE, OWAIN, ADDIE];
  const rows: TqmsAssignment[] = [];
  let n = 0;
  for (const learner of learners) {
    for (let i = 0; i < Math.min(3, courses.length); i += 1) {
      const course = courses[(learners.indexOf(learner) + i) % courses.length]!;
      n += 1;
      const completed = i === 0;
      const overdue = learner.id === ADDIE.id && i === 1;
      rows.push({
        id: `abhi-asg-${String(n).padStart(3, "0")}`,
        learnerId: learner.id,
        courseId: course.id,
        progress: completed ? 100 : overdue ? 25 : course.progressPct,
        status: completed ? "Completed" : overdue ? "Overdue" : "In Progress",
        dueDate: completed ? "2025-12-01" : overdue ? "2026-06-30" : "2026-09-30",
        completedAt: completed ? "2025-11-20" : null,
        mandatory: course.mandatory,
      });
    }
  }
  return rows;
}

export function createAbhiTqmsCertificates(): TqmsCertificate[] {
  return [
    {
      id: "abhi-crt-001",
      learnerId: PETER.id,
      title: "Anti-Bribery & Corruption",
      issuedAt: "2025-11-20",
      expiresAt: "2027-02-24",
      issuer: "ABHI Academy",
    },
    {
      id: "abhi-crt-002",
      learnerId: PETER.id,
      title: "Code of Conduct",
      issuedAt: "2025-11-18",
      expiresAt: "2027-04-20",
      issuer: "ABHI Academy",
    },
    {
      id: "abhi-crt-003",
      learnerId: JUDITH.id,
      title: "Anti-Bribery & Corruption",
      issuedAt: "2025-11-10",
      expiresAt: "2026-06-10",
      issuer: "ABHI Academy",
    },
    {
      id: "abhi-crt-004",
      learnerId: CHARLOTTE.id,
      title: "Whistleblowing",
      issuedAt: "2025-10-01",
      expiresAt: "2027-02-01",
      issuer: "ABHI Academy",
    },
    {
      id: "abhi-crt-005",
      learnerId: OWAIN.id,
      title: "Health & Safety",
      issuedAt: "2025-09-28",
      expiresAt: "2027-06-28",
      issuer: "ABHI Academy",
    },
    {
      id: "abhi-crt-006",
      learnerId: ADDIE.id,
      title: "Modern Slavery",
      issuedAt: "2025-08-12",
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
      title: "Anti-Bribery & Corruption — Final assessment",
      score: null,
      status: "Pending",
      dueDate: "2026-08-30",
    },
    {
      id: "abhi-asm-002",
      learnerId: CHARLOTTE.id,
      title: "Whistleblowing — Knowledge check",
      score: 88,
      status: "Passed",
      dueDate: "2026-07-15",
    },
    {
      id: "abhi-asm-003",
      learnerId: OWAIN.id,
      title: "Information Security — Final assessment",
      score: null,
      status: "Pending",
      dueDate: "2026-09-30",
    },
    {
      id: "abhi-asm-004",
      learnerId: ADDIE.id,
      title: "Modern Slavery — Final assessment",
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
  const withTraining = {
    ...base,
    courses: createAbhiTqmsCourses(),
    learners: createAbhiTqmsLearners(),
    assignments: createAbhiTqmsAssignments(),
    certificates: createAbhiTqmsCertificates(),
    assessments: createAbhiTqmsAssessments(),
    learningPaths: createAbhiTqmsLearningPaths(),
  };
  return applyAbhiQmsOpsSeed(withTraining) as T;
}

export function isNonAbhiTrainingLeak(learners: TqmsLearner[]): boolean {
  return learners.some((row) =>
    /Amelia Hart|Noah Patel|Flight Operations|Avionics|Ground Crew|Barcelona|Peter Durning|Daniel Sazdanoff|John Amoroso|Elias Bahbah|Mick Lenton/i.test(
      `${row.name} ${row.department} ${row.role} ${row.location}`,
    ),
  );
}
