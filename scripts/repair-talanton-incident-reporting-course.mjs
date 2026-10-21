/**
 * Repair Talanton "Incident Reporting & Escalation Training" draft course in-place.
 * Preserves course id, slug, status, enrolments, and certificates.
 *
 *   npx tsx scripts/repair-talanton-incident-reporting-course.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createClient } from "@supabase/supabase-js";

import { buildCourseFromDocumentText } from "../src/lib/lms/course-generation/document-course-builder.ts";
import {
  finalizeCourseDraft,
  summarizeDraftCounts,
} from "../src/lib/lms/course-generation/finalize-course-draft.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envPath = path.join(root, ".env.corporatecentre.runtime");
const envText = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";

function env(k) {
  const m = envText.match(new RegExp(`^${k}=(.*)$`, "m"));
  if (!m) return process.env[k] || "";
  return m[1].trim().replace(/^["']|["']$/g, "");
}

const sb = createClient(
  env("SUPABASE_URL") || env("NEXT_PUBLIC_SUPABASE_URL"),
  env("SUPABASE_SERVICE_ROLE_KEY"),
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const SOURCE = fs.readFileSync(
  path.join(root, "src/lib/lms/fixtures/incident-reporting-escalation-source.txt"),
  "utf8",
);

const TITLE_PATTERN = /incident reporting.*escalation/i;

async function findWorkspace() {
  const { data, error } = await sb
    .from("workspaces")
    .select("id, slug")
    .ilike("slug", "%talanton%")
    .limit(5);
  if (error) throw error;
  const row = (data ?? []).find((w) => /talanton/i.test(String(w.slug)));
  if (!row) throw new Error("Talanton workspace not found.");
  return row;
}

async function findCourse(workspaceId) {
  const { data, error } = await sb
    .from("lms_courses")
    .select("*")
    .eq("workspace_id", workspaceId);
  if (error) throw error;
  const course = (data ?? []).find((c) => TITLE_PATTERN.test(String(c.title)));
  if (!course) throw new Error("Incident Reporting & Escalation Training course not found.");
  return course;
}

async function deleteChildren(workspaceId, courseId) {
  await sb.from("lms_questions").delete().eq("course_id", courseId).eq("workspace_id", workspaceId);
  await sb.from("lms_lessons").delete().eq("course_id", courseId).eq("workspace_id", workspaceId);
  await sb.from("lms_modules").delete().eq("course_id", courseId).eq("workspace_id", workspaceId);
}

async function insertTree(workspaceId, courseId, draft) {
  const moduleIds = [];
  for (let mi = 0; mi < draft.modules.length; mi += 1) {
    const mod = draft.modules[mi];
    const { data: moduleRow, error } = await sb
      .from("lms_modules")
      .insert({
        workspace_id: workspaceId,
        course_id: courseId,
        title: mod.title,
        summary: mod.summary || "",
        sort_order: mi + 1,
      })
      .select("id")
      .single();
    if (error) throw error;
    moduleIds.push(moduleRow.id);
    for (let li = 0; li < mod.lessons.length; li += 1) {
      const lesson = mod.lessons[li];
      const { error: lessonErr } = await sb.from("lms_lessons").insert({
        workspace_id: workspaceId,
        course_id: courseId,
        module_id: moduleRow.id,
        title: lesson.title,
        lesson_type: lesson.lessonType,
        content: lesson.content,
        sort_order: li + 1,
        estimated_minutes: lesson.estimatedMinutes ?? 5,
      });
      if (lessonErr) throw lessonErr;
    }
  }
  const questions = draft.questions ?? [];
  for (let i = 0; i < questions.length; i += 1) {
    const q = questions[i];
    const { error } = await sb.from("lms_questions").insert({
      workspace_id: workspaceId,
      course_id: courseId,
      module_id:
        typeof q.moduleIndex === "number" && moduleIds[q.moduleIndex]
          ? moduleIds[q.moduleIndex]
          : null,
      question_type: q.questionType,
      stem: q.stem,
      choices: q.choices,
      correct_choice_id: q.correctChoiceId,
      explanation: q.explanation ?? "",
      difficulty: q.difficulty ?? "medium",
      sort_order: i + 1,
    });
    if (error) throw error;
  }
}

const workspace = await findWorkspace();
const course = await findCourse(workspace.id);

const built = buildCourseFromDocumentText({
  documentText: SOURCE,
  preferredTitle: course.title,
  sourceFileName: "incident-reporting-escalation.pdf",
  certificatePrefix: "TALANTON-IR",
  category: "Compliance",
});

const draft = finalizeCourseDraft(built, "incident-reporting-escalation");
const stats = summarizeDraftCounts(draft);

await deleteChildren(workspace.id, course.id);
await sb
  .from("lms_courses")
  .update({
    description: built.description,
    duration_minutes: built.durationMinutes ?? 45,
    pass_mark: 80,
    updated_at: new Date().toISOString(),
    status: course.status,
  })
  .eq("id", course.id);

await insertTree(workspace.id, course.id, draft);

console.log("Repaired course:", course.slug);
console.log(JSON.stringify(stats, null, 2));
