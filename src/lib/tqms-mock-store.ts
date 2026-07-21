import {
  createSeedTqmsActivity,
  createSeedTqmsAssessments,
  createSeedTqmsAssignments,
  createSeedTqmsAudits,
  createSeedTqmsCapas,
  createSeedTqmsCertificates,
  createSeedTqmsCourses,
  createSeedTqmsDocuments,
  createSeedTqmsEvents,
  createSeedTqmsLearners,
  createSeedTqmsLearningPaths,
  createSeedTqmsManagementReviews,
  createSeedTqmsNotes,
  createSeedTqmsQmsSections,
  createSeedTqmsReports,
  type TqmsActivity,
  type TqmsAssessment,
  type TqmsAssignment,
  type TqmsAssignmentStatus,
  type TqmsAudit,
  type TqmsCapa,
  type TqmsCapaStatus,
  type TqmsCertificate,
  type TqmsCourse,
  type TqmsDocStatus,
  type TqmsDocument,
  type TqmsEvent,
  type TqmsLearner,
  type TqmsLearningPath,
  type TqmsManagementReview,
  type TqmsNote,
  type TqmsQmsSection,
  type TqmsReport,
} from "@/lib/tqms-data";

export type TqmsMockState = {
  courses: TqmsCourse[];
  learners: TqmsLearner[];
  assignments: TqmsAssignment[];
  certificates: TqmsCertificate[];
  assessments: TqmsAssessment[];
  learningPaths: TqmsLearningPath[];
  activity: TqmsActivity[];
  events: TqmsEvent[];
  documents: TqmsDocument[];
  capas: TqmsCapa[];
  audits: TqmsAudit[];
  managementReviews: TqmsManagementReview[];
  reports: TqmsReport[];
  notes: TqmsNote[];
  qmsSections: TqmsQmsSection[];
};

let state: TqmsMockState = {
  courses: createSeedTqmsCourses(),
  learners: createSeedTqmsLearners(),
  assignments: createSeedTqmsAssignments(),
  certificates: createSeedTqmsCertificates(),
  assessments: createSeedTqmsAssessments(),
  learningPaths: createSeedTqmsLearningPaths(),
  activity: createSeedTqmsActivity(),
  events: createSeedTqmsEvents(),
  documents: createSeedTqmsDocuments(),
  capas: createSeedTqmsCapas(),
  audits: createSeedTqmsAudits(),
  managementReviews: createSeedTqmsManagementReviews(),
  reports: createSeedTqmsReports(),
  notes: createSeedTqmsNotes(),
  qmsSections: createSeedTqmsQmsSections(),
};

const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function pushActivity(label: string, detail: string) {
  state = {
    ...state,
    activity: [
      {
        id: `act-${Date.now()}`,
        at: new Date().toISOString(),
        label,
        detail,
      },
      ...state.activity,
    ].slice(0, 40),
  };
}

export function subscribeTqmsMockStore(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getTqmsMockSnapshot(): TqmsMockState {
  return state;
}

export function listTqmsActivity() {
  return state.activity;
}

export function assignCourse(learnerId: string, courseId: string) {
  const course = state.courses.find((row) => row.id === courseId);
  if (!course) throw new Error("Course not found.");
  if (
    state.assignments.some(
      (row) => row.learnerId === learnerId && row.courseId === courseId,
    )
  ) {
    throw new Error("Course already assigned.");
  }
  const assignment: TqmsAssignment = {
    id: `asg-${Date.now()}`,
    learnerId,
    courseId,
    progress: 0,
    status: "Not Started",
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString().slice(0, 10),
    completedAt: null,
    mandatory: course.mandatory,
  };
  state = { ...state, assignments: [assignment, ...state.assignments] };
  const learner = state.learners.find((row) => row.id === learnerId);
  pushActivity("Employee enrolled", `${learner?.name ?? "Learner"} enrolled on ${course.title}`);
  emit();
  return assignment;
}

export function removeAssignment(assignmentId: string) {
  state = {
    ...state,
    assignments: state.assignments.filter((row) => row.id !== assignmentId),
  };
  emit();
}

export function recordCompletion(assignmentId: string) {
  const now = new Date().toISOString().slice(0, 10);
  state = {
    ...state,
    assignments: state.assignments.map((row) =>
      row.id === assignmentId
        ? {
            ...row,
            progress: 100,
            status: "Completed" as TqmsAssignmentStatus,
            completedAt: now,
          }
        : row,
    ),
  };
  const assignment = state.assignments.find((row) => row.id === assignmentId);
  const learner = state.learners.find((row) => row.id === assignment?.learnerId);
  const course = state.courses.find((row) => row.id === assignment?.courseId);
  pushActivity(
    "Course completed",
    `${learner?.name ?? "Learner"} completed ${course?.title ?? "course"}`,
  );
  emit();
}

export function issueCertificate(input: {
  learnerId: string;
  title: string;
  expiresAt: string;
}) {
  const cert: TqmsCertificate = {
    id: `crt-${Date.now()}`,
    learnerId: input.learnerId,
    title: input.title,
    issuedAt: new Date().toISOString().slice(0, 10),
    expiresAt: input.expiresAt,
    issuer: "Unit311 Academy",
  };
  state = { ...state, certificates: [cert, ...state.certificates] };
  const learner = state.learners.find((row) => row.id === input.learnerId);
  pushActivity("Certificate issued", `${input.title} issued to ${learner?.name ?? "learner"}`);
  emit();
  return cert;
}

export function createCourse(input: Omit<TqmsCourse, "id">) {
  const course: TqmsCourse = { ...input, id: `crs-${Date.now()}` };
  state = { ...state, courses: [course, ...state.courses] };
  pushActivity("Course created", `${course.title} published to the catalogue`);
  emit();
  return course;
}

export function createDocument(input: Omit<TqmsDocument, "id">) {
  const document: TqmsDocument = { ...input, id: `doc-${Date.now()}` };
  state = { ...state, documents: [document, ...state.documents] };
  emit();
  return document;
}

export function updateDocument(
  id: string,
  patch: Partial<Pick<TqmsDocument, "title" | "revision" | "owner" | "status" | "nextReview" | "approvalDate">>,
) {
  state = {
    ...state,
    documents: state.documents.map((row) => (row.id === id ? { ...row, ...patch } : row)),
  };
  emit();
}

export function approveDocument(id: string) {
  updateDocument(id, {
    status: "Approved" as TqmsDocStatus,
    approvalDate: new Date().toISOString().slice(0, 10),
  });
}

export function archiveDocument(id: string) {
  updateDocument(id, { status: "Obsolete" as TqmsDocStatus });
}

export function deleteDocument(id: string) {
  state = { ...state, documents: state.documents.filter((row) => row.id !== id) };
  emit();
}

export function createCapa(input: Omit<TqmsCapa, "id" | "timeline">) {
  const capa: TqmsCapa = {
    ...input,
    id: `capa-${Date.now()}`,
    timeline: [{ at: new Date().toISOString().slice(0, 10), label: "Opened" }],
  };
  state = { ...state, capas: [capa, ...state.capas] };
  emit();
  return capa;
}

export function updateCapaStatus(id: string, status: TqmsCapaStatus) {
  state = {
    ...state,
    capas: state.capas.map((row) =>
      row.id === id
        ? {
            ...row,
            status,
            timeline: [
              ...row.timeline,
              { at: new Date().toISOString().slice(0, 10), label: `Status → ${status}` },
            ],
          }
        : row,
    ),
  };
  emit();
}

export function deleteCapa(id: string) {
  state = { ...state, capas: state.capas.filter((row) => row.id !== id) };
  emit();
}

export function createAudit(input: Omit<TqmsAudit, "id" | "findings" | "actionsOpen">) {
  const audit: TqmsAudit = {
    ...input,
    id: `aud-${Date.now()}`,
    findings: 0,
    actionsOpen: 0,
  };
  state = { ...state, audits: [audit, ...state.audits] };
  emit();
  return audit;
}

export function recordAuditFindings(id: string, findings: number) {
  state = {
    ...state,
    audits: state.audits.map((row) =>
      row.id === id
        ? {
            ...row,
            findings,
            actionsOpen: Math.max(row.actionsOpen, findings),
            status: "Completed",
          }
        : row,
    ),
  };
  emit();
}

export function deleteAudit(id: string) {
  state = { ...state, audits: state.audits.filter((row) => row.id !== id) };
  emit();
}

export function addLearnerNote(learnerId: string, text: string, author = "Operations") {
  const note: TqmsNote = {
    id: `note-${Date.now()}`,
    learnerId,
    at: new Date().toISOString(),
    author,
    text,
  };
  state = { ...state, notes: [note, ...state.notes] };
  emit();
  return note;
}

export function createReport(input: Omit<TqmsReport, "id" | "createdAt">) {
  const report: TqmsReport = {
    ...input,
    id: `rpt-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  state = { ...state, reports: [report, ...state.reports] };
  emit();
  return report;
}

export function deleteReport(id: string) {
  state = { ...state, reports: state.reports.filter((row) => row.id !== id) };
  emit();
}

export function markLearningPathLessonDone(pathId: string, lessonId: string) {
  state = {
    ...state,
    learningPaths: state.learningPaths.map((path) => {
      if (path.id !== pathId) return path;
      const lessons = path.lessons.map((lesson) =>
        lesson.id === lessonId ? { ...lesson, done: true } : lesson,
      );
      const done = lessons.filter((lesson) => lesson.done).length;
      return {
        ...path,
        lessons,
        completionPercent: Math.round((done / Math.max(lessons.length, 1)) * 100),
      };
    }),
  };
  emit();
}

export function computeTrainingDashboardKpis(snapshot: TqmsMockState = state) {
  const totalCourses = snapshot.courses.filter((c) => c.status === "Published").length;
  const employeesAssigned = new Set(snapshot.assignments.map((a) => a.learnerId)).size;
  const completed = snapshot.assignments.filter((a) => a.status === "Completed").length;
  const inProgress = snapshot.assignments.filter((a) => a.status === "In Progress").length;
  const overdue = snapshot.assignments.filter((a) => a.status === "Overdue").length;
  const now = Date.now();
  const soon = now + 1000 * 60 * 60 * 24 * 60;
  const expiring = snapshot.certificates.filter((c) => {
    const exp = Date.parse(c.expiresAt);
    return exp >= now && exp <= soon;
  }).length;
  const mandatory = snapshot.assignments.filter((a) => a.mandatory);
  const mandatoryDone = mandatory.filter((a) => a.status === "Completed").length;
  const complianceScore =
    mandatory.length === 0 ? 100 : Math.round((mandatoryDone / mandatory.length) * 100);
  const avgCompletion =
    snapshot.assignments.length === 0
      ? 0
      : Math.round(
          snapshot.assignments.reduce((sum, row) => sum + row.progress, 0) /
            snapshot.assignments.length,
        );

  return {
    totalCourses,
    employeesAssigned,
    completed,
    inProgress,
    overdue,
    expiring,
    complianceScore,
    avgCompletion,
  };
}
