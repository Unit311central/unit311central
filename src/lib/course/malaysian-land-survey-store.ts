import "server-only";

import { ensureCourseResponseSchema } from "@/lib/course/malaysian-land-survey-schema";
import {
  classifyCourseInsertError,
  type CourseSubmissionInput,
  type CourseSubmissionRecord,
} from "@/lib/course/malaysian-land-survey";
import {
  createSupabaseServiceRoleClient,
  isSupabaseServiceRoleConfigured,
} from "@/lib/supabase/server";

type CourseResponseRow = {
  id: string;
  participant_name: string;
  question_1_answers: string[] | null;
  question_2_answers: string[] | null;
  question_3_answers: string[] | null;
  question_4_answers: string[] | null;
  question_5_comments: string | null;
  submitted_at: string;
};

export type CourseStoreResult =
  | { ok: true; id: string; submittedAt: string }
  | { ok: false; reason: "duplicate" | "unavailable" | "unknown" };

function requireServiceSupabase() {
  if (!isSupabaseServiceRoleConfigured()) {
    throw new Error("Course questionnaire persistence requires SUPABASE_SERVICE_ROLE_KEY.");
  }
  return createSupabaseServiceRoleClient();
}

function selections(value: string[] | null | undefined): string[] | null {
  if (!value?.length) return null;
  return value;
}

function mapRow(row: CourseResponseRow): CourseSubmissionRecord {
  return {
    id: row.id,
    participantName: row.participant_name,
    normalizedName: row.participant_name.trim().toLowerCase(),
    question1: selections(row.question_1_answers),
    question2: selections(row.question_2_answers),
    question3: selections(row.question_3_answers),
    question4: selections(row.question_4_answers),
    question5: row.question_5_comments?.trim() ? row.question_5_comments.trim() : null,
    submittedAt: row.submitted_at,
  };
}

async function insertCourseSubmissionOnce(
  submission: CourseSubmissionInput,
): Promise<CourseStoreResult> {
  let supabase: ReturnType<typeof createSupabaseServiceRoleClient>;
  try {
    supabase = requireServiceSupabase();
  } catch {
    return { ok: false, reason: "unavailable" };
  }

  const { data, error } = await supabase
    .from("malaysian_land_survey_course_responses")
    .insert({
      participant_name: submission.participantName,
      normalized_name: submission.normalizedName,
      question_1_answers: submission.question1,
      question_2_answers: submission.question2,
      question_3_answers: submission.question3,
      question_4_answers: submission.question4,
      question_5_comments: submission.question5,
    })
    .select("id, submitted_at")
    .single();

  if (error) {
    const reason = classifyCourseInsertError(error);
    if (reason !== "unknown") return { ok: false, reason };
    console.error("Course questionnaire insert failed", error.code, error.message);
    return { ok: false, reason: "unknown" };
  }

  return {
    ok: true,
    id: data.id,
    submittedAt: data.submitted_at,
  };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function insertCourseSubmission(
  submission: CourseSubmissionInput,
): Promise<CourseStoreResult> {
  let result = await insertCourseSubmissionOnce(submission);
  if (result.ok || result.reason !== "unavailable") return result;

  const ready = await ensureCourseResponseSchema();
  if (!ready) return { ok: false, reason: "unavailable" };

  for (let attempt = 0; attempt < 4; attempt += 1) {
    result = await insertCourseSubmissionOnce(submission);
    if (result.ok || result.reason !== "unavailable") return result;
    await sleep(800 * (attempt + 1));
  }
  return result;
}

export async function listCourseSubmissions(): Promise<
  { ok: true; submissions: CourseSubmissionRecord[] } | { ok: false; reason: "unavailable" | "unknown" }
> {
  let supabase: ReturnType<typeof createSupabaseServiceRoleClient>;
  try {
    supabase = requireServiceSupabase();
  } catch {
    return { ok: false, reason: "unavailable" };
  }

  let { data, error } = await supabase
    .from("malaysian_land_survey_course_responses")
    .select(
      "id, participant_name, question_1_answers, question_2_answers, question_3_answers, question_4_answers, question_5_comments, submitted_at",
    )
    .order("submitted_at", { ascending: false });

  if (error && classifyCourseInsertError(error) === "unavailable") {
    const ready = await ensureCourseResponseSchema();
    if (!ready) return { ok: false, reason: "unavailable" };
    const retried = await supabase
      .from("malaysian_land_survey_course_responses")
      .select(
        "id, participant_name, question_1_answers, question_2_answers, question_3_answers, question_4_answers, question_5_comments, submitted_at",
      )
      .order("submitted_at", { ascending: false });
    data = retried.data;
    error = retried.error;
  }

  if (error) {
    const reason = classifyCourseInsertError(error);
    if (reason === "unavailable") return { ok: false, reason: "unavailable" };
    console.error("Course questionnaire list failed", error.code, error.message);
    return { ok: false, reason: "unknown" };
  }

  return {
    ok: true,
    submissions: ((data ?? []) as CourseResponseRow[]).map(mapRow),
  };
}
