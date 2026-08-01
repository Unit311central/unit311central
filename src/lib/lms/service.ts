import { randomBytes } from "node:crypto";

import {
  createSupabaseServiceRoleClient,
  isSupabaseServiceRoleConfigured,
} from "@/lib/supabase/server";
import type {
  LessonContent,
  LmsCertificate,
  LmsCourse,
  LmsCourseTree,
  LmsEnrolment,
  LmsLesson,
  LmsLessonType,
  LmsModule,
  LmsQuestion,
} from "@/lib/lms/types";

function db() {
  if (!isSupabaseServiceRoleConfigured()) {
    throw new Error("LMS requires SUPABASE_SERVICE_ROLE_KEY.");
  }
  return createSupabaseServiceRoleClient();
}

function mapCourse(row: Record<string, unknown>): LmsCourse {
  return {
    id: String(row.id),
    workspaceId: String(row.workspace_id),
    code: String(row.code),
    slug: String(row.slug),
    title: String(row.title),
    description: String(row.description ?? ""),
    category: String(row.category ?? "Compliance"),
    durationMinutes: Number(row.duration_minutes ?? 45),
    passMark: Number(row.pass_mark ?? 80),
    status: row.status as LmsCourse["status"],
    certificatePrefix: String(row.certificate_prefix ?? "LMS"),
    sortOrder: Number(row.sort_order ?? 100),
    coverImageUrl: row.cover_image_url ? String(row.cover_image_url) : null,
  };
}

function mapModule(row: Record<string, unknown>): LmsModule {
  return {
    id: String(row.id),
    courseId: String(row.course_id),
    title: String(row.title),
    summary: String(row.summary ?? ""),
    sortOrder: Number(row.sort_order ?? 0),
  };
}

function mapLesson(row: Record<string, unknown>): LmsLesson {
  const content = (row.content ?? { type: row.lesson_type }) as LessonContent;
  return {
    id: String(row.id),
    courseId: String(row.course_id),
    moduleId: String(row.module_id),
    title: String(row.title),
    lessonType: String(row.lesson_type) as LmsLessonType,
    content,
    sortOrder: Number(row.sort_order ?? 0),
    estimatedMinutes: Number(row.estimated_minutes ?? 5),
  };
}

function mapQuestion(row: Record<string, unknown>): LmsQuestion {
  return {
    id: String(row.id),
    courseId: String(row.course_id),
    moduleId: row.module_id ? String(row.module_id) : null,
    questionType: row.question_type as LmsQuestion["questionType"],
    stem: String(row.stem),
    choices: (row.choices as { id: string; label: string }[]) ?? [],
    correctChoiceId: String(row.correct_choice_id),
    explanation: String(row.explanation ?? ""),
    difficulty: String(row.difficulty ?? "medium"),
  };
}

function mapEnrolment(row: Record<string, unknown>): LmsEnrolment {
  return {
    id: String(row.id),
    courseId: String(row.course_id),
    userId: String(row.user_id),
    clientId: row.client_id ? String(row.client_id) : null,
    status: row.status as LmsEnrolment["status"],
    progressPct: Number(row.progress_pct ?? 0),
    lessonState: (row.lesson_state as Record<string, unknown>) ?? {},
    timeSpentSeconds: Number(row.time_spent_seconds ?? 0),
    score: row.score == null ? null : Number(row.score),
    startedAt: row.started_at ? String(row.started_at) : null,
    completedAt: row.completed_at ? String(row.completed_at) : null,
    lastLessonId: row.last_lesson_id ? String(row.last_lesson_id) : null,
  };
}

function mapCertificate(row: Record<string, unknown>): LmsCertificate {
  return {
    id: String(row.id),
    courseId: String(row.course_id),
    enrolmentId: String(row.enrolment_id),
    userId: String(row.user_id),
    clientId: row.client_id ? String(row.client_id) : null,
    certificateNumber: String(row.certificate_number),
    verifyToken: String(row.verify_token),
    learnerName: String(row.learner_name),
    companyName: String(row.company_name ?? ""),
    courseTitle: String(row.course_title),
    score: Number(row.score),
    issuedAt: String(row.issued_at),
  };
}

export async function listPublishedCourses(workspaceId: string): Promise<LmsCourse[]> {
  const { data, error } = await db()
    .from("lms_courses")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("status", "published")
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => mapCourse(r as Record<string, unknown>));
}

export async function listAllCoursesForWorkspace(workspaceId: string): Promise<LmsCourse[]> {
  const { data, error } = await db()
    .from("lms_courses")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => mapCourse(r as Record<string, unknown>));
}

export async function getCourseBySlug(
  workspaceId: string,
  slug: string,
): Promise<LmsCourse | null> {
  const { data, error } = await db()
    .from("lms_courses")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapCourse(data as Record<string, unknown>) : null;
}

export async function getCourseTree(
  workspaceId: string,
  slug: string,
): Promise<LmsCourseTree | null> {
  const course = await getCourseBySlug(workspaceId, slug);
  if (!course) return null;

  const [{ data: modules }, { data: lessons }, { count }] = await Promise.all([
    db()
      .from("lms_modules")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("course_id", course.id)
      .order("sort_order", { ascending: true }),
    db()
      .from("lms_lessons")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("course_id", course.id)
      .order("sort_order", { ascending: true }),
    db()
      .from("lms_questions")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .eq("course_id", course.id),
  ]);

  const moduleRows = (modules ?? []).map((r) => mapModule(r as Record<string, unknown>));
  const lessonRows = (lessons ?? []).map((r) => mapLesson(r as Record<string, unknown>));

  return {
    ...course,
    questionCount: count ?? 0,
    modules: moduleRows.map((mod) => ({
      ...mod,
      lessons: lessonRows.filter((l) => l.moduleId === mod.id),
    })),
  };
}

export async function listAssignedCoursesForUser(options: {
  workspaceId: string;
  userId: string;
  clientId?: string | null;
}): Promise<{ course: LmsCourse; enrolment: LmsEnrolment | null }[]> {
  const courses = await listPublishedCourses(options.workspaceId);

  const { data: assignments } = await db()
    .from("lms_assignments")
    .select("course_id, client_id, user_id")
    .eq("workspace_id", options.workspaceId);

  const assignedIds = new Set<string>();
  for (const row of assignments ?? []) {
    const courseId = String((row as { course_id: string }).course_id);
    const clientId = (row as { client_id?: string | null }).client_id;
    const userId = (row as { user_id?: string | null }).user_id;
    if (userId && userId === options.userId) assignedIds.add(courseId);
    else if (clientId && options.clientId && clientId === options.clientId) {
      assignedIds.add(courseId);
    } else if (!clientId && !userId) {
      // workspace-wide assignment
      assignedIds.add(courseId);
    }
  }

  // If no explicit assignments, still show all published (workspace catalog default).
  const visible =
    assignedIds.size > 0 ? courses.filter((c) => assignedIds.has(c.id)) : courses;

  const { data: enrolments } = await db()
    .from("lms_enrolments")
    .select("*")
    .eq("workspace_id", options.workspaceId)
    .eq("user_id", options.userId);

  const byCourse = new Map(
    (enrolments ?? []).map((r) => {
      const e = mapEnrolment(r as Record<string, unknown>);
      return [e.courseId, e] as const;
    }),
  );

  return visible.map((course) => ({
    course,
    enrolment: byCourse.get(course.id) ?? null,
  }));
}

export async function ensureEnrolment(options: {
  workspaceId: string;
  courseId: string;
  userId: string;
  clientId?: string | null;
}): Promise<LmsEnrolment> {
  const existing = await db()
    .from("lms_enrolments")
    .select("*")
    .eq("workspace_id", options.workspaceId)
    .eq("course_id", options.courseId)
    .eq("user_id", options.userId)
    .maybeSingle();

  if (existing.data) return mapEnrolment(existing.data as Record<string, unknown>);

  const { data, error } = await db()
    .from("lms_enrolments")
    .insert({
      workspace_id: options.workspaceId,
      course_id: options.courseId,
      user_id: options.userId,
      client_id: options.clientId ?? null,
      status: "assigned",
      progress_pct: 0,
      lesson_state: {},
      time_spent_seconds: 0,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return mapEnrolment(data as Record<string, unknown>);
}

export async function saveEnrolmentProgress(options: {
  workspaceId: string;
  enrolmentId: string;
  userId: string;
  progressPct: number;
  lessonState: Record<string, unknown>;
  timeSpentSeconds: number;
  lastLessonId?: string | null;
  status?: LmsEnrolment["status"];
}): Promise<LmsEnrolment> {
  const patch: Record<string, unknown> = {
    progress_pct: Math.max(0, Math.min(100, Math.round(options.progressPct))),
    lesson_state: options.lessonState,
    time_spent_seconds: Math.max(0, Math.round(options.timeSpentSeconds)),
    updated_at: new Date().toISOString(),
  };
  if (options.lastLessonId !== undefined) patch.last_lesson_id = options.lastLessonId;
  if (options.status) patch.status = options.status;
  if (options.status === "in_progress") {
    patch.started_at = new Date().toISOString();
  }

  const { data, error } = await db()
    .from("lms_enrolments")
    .update(patch)
    .eq("workspace_id", options.workspaceId)
    .eq("id", options.enrolmentId)
    .eq("user_id", options.userId)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return mapEnrolment(data as Record<string, unknown>);
}

export async function listCourseQuestions(
  workspaceId: string,
  courseId: string,
): Promise<LmsQuestion[]> {
  const { data, error } = await db()
    .from("lms_questions")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("course_id", courseId)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => mapQuestion(r as Record<string, unknown>));
}

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export async function drawAssessmentQuestions(options: {
  workspaceId: string;
  courseId: string;
  drawCount: number;
}): Promise<LmsQuestion[]> {
  const all = await listCourseQuestions(options.workspaceId, options.courseId);
  return shuffle(all).slice(0, Math.min(options.drawCount, all.length));
}

export async function submitAssessmentAttempt(options: {
  workspaceId: string;
  courseId: string;
  enrolmentId: string;
  userId: string;
  answers: Record<string, string>;
  questionIds: string[];
  passMark: number;
}): Promise<{ score: number; passed: boolean; attemptId: string }> {
  const questions = await listCourseQuestions(options.workspaceId, options.courseId);
  const byId = new Map(questions.map((q) => [q.id, q]));
  let correct = 0;
  for (const qid of options.questionIds) {
    const q = byId.get(qid);
    if (q && options.answers[qid] === q.correctChoiceId) correct += 1;
  }
  const score =
    options.questionIds.length === 0
      ? 0
      : Math.round((correct / options.questionIds.length) * 100);
  const passed = score >= options.passMark;

  const { data, error } = await db()
    .from("lms_attempts")
    .insert({
      workspace_id: options.workspaceId,
      course_id: options.courseId,
      enrolment_id: options.enrolmentId,
      user_id: options.userId,
      question_ids: options.questionIds,
      answers: options.answers,
      score,
      passed,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  await db()
    .from("lms_enrolments")
    .update({
      score,
      status: passed ? "completed" : "failed",
      progress_pct: passed ? 100 : undefined,
      completed_at: passed ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("workspace_id", options.workspaceId)
    .eq("id", options.enrolmentId)
    .eq("user_id", options.userId);

  return { score, passed, attemptId: String(data.id) };
}

async function nextCertificateNumber(
  workspaceId: string,
  courseCode: string,
  year: number,
): Promise<number> {
  const supabase = db();
  const { data: existing } = await supabase
    .from("lms_certificate_sequences")
    .select("last_value")
    .eq("workspace_id", workspaceId)
    .eq("course_code", courseCode)
    .eq("year", year)
    .maybeSingle();

  const next = Number(existing?.last_value ?? 0) + 1;
  if (existing) {
    await supabase
      .from("lms_certificate_sequences")
      .update({ last_value: next })
      .eq("workspace_id", workspaceId)
      .eq("course_code", courseCode)
      .eq("year", year);
  } else {
    await supabase.from("lms_certificate_sequences").insert({
      workspace_id: workspaceId,
      course_code: courseCode,
      year,
      last_value: next,
    });
  }
  return next;
}

export async function issueCertificate(options: {
  workspaceId: string;
  course: LmsCourse;
  enrolment: LmsEnrolment;
  userId: string;
  learnerName: string;
  companyName: string;
  score: number;
}): Promise<LmsCertificate> {
  const { data: existing } = await db()
    .from("lms_certificates")
    .select("*")
    .eq("workspace_id", options.workspaceId)
    .eq("enrolment_id", options.enrolment.id)
    .maybeSingle();
  if (existing) return mapCertificate(existing as Record<string, unknown>);

  const year = new Date().getFullYear();
  const seq = await nextCertificateNumber(
    options.workspaceId,
    options.course.certificatePrefix || options.course.code,
    year,
  );
  const certificateNumber = `${options.course.certificatePrefix}-${year}-${String(seq).padStart(6, "0")}`;
  const verifyToken = randomBytes(16).toString("hex");

  const { data, error } = await db()
    .from("lms_certificates")
    .insert({
      workspace_id: options.workspaceId,
      course_id: options.course.id,
      enrolment_id: options.enrolment.id,
      user_id: options.userId,
      client_id: options.enrolment.clientId,
      certificate_number: certificateNumber,
      verify_token: verifyToken,
      learner_name: options.learnerName,
      company_name: options.companyName,
      course_title: options.course.title,
      score: options.score,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return mapCertificate(data as Record<string, unknown>);
}

export async function getCertificateByNumber(
  workspaceId: string,
  certificateNumber: string,
): Promise<LmsCertificate | null> {
  const { data, error } = await db()
    .from("lms_certificates")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("certificate_number", certificateNumber)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapCertificate(data as Record<string, unknown>) : null;
}

export async function getCertificateByVerifyToken(
  verifyToken: string,
): Promise<LmsCertificate | null> {
  const { data, error } = await db()
    .from("lms_certificates")
    .select("*")
    .eq("verify_token", verifyToken)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapCertificate(data as Record<string, unknown>) : null;
}

export async function listCertificatesForUser(
  workspaceId: string,
  userId: string,
): Promise<LmsCertificate[]> {
  const { data, error } = await db()
    .from("lms_certificates")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .order("issued_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => mapCertificate(r as Record<string, unknown>));
}

export async function getWorkspaceReporting(workspaceId: string): Promise<{
  byCompany: {
    clientId: string;
    assigned: number;
    started: number;
    completed: number;
    failed: number;
    compliancePct: number;
  }[];
  byUser: {
    userId: string;
    courseId: string;
    courseTitle: string;
    status: string;
    score: number | null;
    completedAt: string | null;
    certificateNumber: string | null;
  }[];
}> {
  const [{ data: enrolments }, { data: certificates }, { data: courses }] = await Promise.all([
    db().from("lms_enrolments").select("*").eq("workspace_id", workspaceId),
    db().from("lms_certificates").select("*").eq("workspace_id", workspaceId),
    db().from("lms_courses").select("id, title").eq("workspace_id", workspaceId),
  ]);

  const courseTitle = new Map(
    (courses ?? []).map((c) => [String((c as { id: string }).id), String((c as { title: string }).title)]),
  );
  const certByEnrolment = new Map(
    (certificates ?? []).map((c) => {
      const row = c as Record<string, unknown>;
      return [String(row.enrolment_id), String(row.certificate_number)] as const;
    }),
  );

  const companyMap = new Map<
    string,
    { assigned: number; started: number; completed: number; failed: number }
  >();

  for (const raw of enrolments ?? []) {
    const e = mapEnrolment(raw as Record<string, unknown>);
    const key = e.clientId || "unassigned";
    const row = companyMap.get(key) ?? {
      assigned: 0,
      started: 0,
      completed: 0,
      failed: 0,
    };
    row.assigned += 1;
    if (e.status === "in_progress") row.started += 1;
    if (e.status === "completed") row.completed += 1;
    if (e.status === "failed") row.failed += 1;
    companyMap.set(key, row);
  }

  const byCompany = [...companyMap.entries()].map(([clientId, row]) => ({
    clientId,
    ...row,
    compliancePct:
      row.assigned === 0 ? 0 : Math.round((row.completed / row.assigned) * 100),
  }));

  const byUser = (enrolments ?? []).map((raw) => {
    const e = mapEnrolment(raw as Record<string, unknown>);
    return {
      userId: e.userId,
      courseId: e.courseId,
      courseTitle: courseTitle.get(e.courseId) ?? e.courseId,
      status: e.status,
      score: e.score,
      completedAt: e.completedAt,
      certificateNumber: certByEnrolment.get(e.id) ?? null,
    };
  });

  return { byCompany, byUser };
}
