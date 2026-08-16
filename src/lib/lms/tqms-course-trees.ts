/**
 * Playable LMS trees for generic TQMS catalogue courses (all workspaces).
 * OnwardAir-specific trees remain in onwardair/lms-course-trees.ts.
 */

import type { LmsCourseTree, LmsLesson, LessonContent } from "@/lib/lms/types";
import type { TqmsCourse } from "@/lib/tqms-data";
import { getOaLmsCourseTree } from "@/lib/onwardair/lms-course-trees";

function slugify(code: string) {
  return code
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function kc(
  prompt: string,
  correct: string,
  wrong: [string, string, string],
  explanation: string,
): LessonContent {
  return {
    type: "knowledge_check",
    prompt,
    choices: [
      { id: "a", label: correct },
      { id: "b", label: wrong[0] },
      { id: "c", label: wrong[1] },
      { id: "d", label: wrong[2] },
    ],
    correctId: "a",
    explanation,
  };
}

function buildGenericTree(course: TqmsCourse): LmsCourseTree {
  const courseId = `lms-${course.id}`;
  const mod1 = `${courseId}-m1`;
  const mod2 = `${courseId}-m2`;
  const topic = course.title;
  const desc =
    course.description ||
    `${topic} — complete this module before working in scope.`;

  const lessons1: Omit<LmsLesson, "courseId">[] = [
    {
      id: `${mod1}-l1`,
      moduleId: mod1,
      title: `Why ${topic} matters`,
      lessonType: "rich_text",
      sortOrder: 0,
      estimatedMinutes: 4,
      content: {
        type: "rich_text",
        title: topic,
        blocks: [
          { kind: "heading", level: 2, text: topic },
          { kind: "paragraph", text: desc },
          {
            kind: "callout",
            tone: "info",
            title: "Learning objective",
            text: "Understand the controls, apply them on the job, and escalate when unsure.",
          },
          {
            kind: "bullet_list",
            items: [
              "Follow approved procedures",
              "Protect people, data, and customer commitments",
              "Record evidence where required",
              "Ask early when requirements are unclear",
            ],
          },
        ],
      },
    },
    {
      id: `${mod1}-l2`,
      moduleId: mod1,
      title: "Key steps",
      lessonType: "infographic",
      sortOrder: 1,
      estimatedMinutes: 3,
      content: {
        type: "infographic",
        title: `${course.code} journey`,
        layout: "flow",
        items: [
          { id: "1", label: "Prepare", body: "Read the brief and confirm scope.", icon: "01" },
          { id: "2", label: "Execute", body: "Follow the controlled procedure.", icon: "02" },
          { id: "3", label: "Verify", body: "Capture evidence and sign-off.", icon: "03" },
          { id: "4", label: "Close", body: "Escalate open items.", icon: "04" },
        ],
      },
    },
    {
      id: `${mod1}-l3`,
      moduleId: mod1,
      title: "Quick check",
      lessonType: "knowledge_check",
      sortOrder: 2,
      estimatedMinutes: 2,
      content: kc(
        `What should you do first if unsure how to apply “${topic}”?`,
        "Pause and escalate to your manager or subject expert",
        [
          "Continue and document later if asked",
          "Skip the step to keep the schedule",
          "Ask an external party to decide",
        ],
        "Early escalation prevents quality and safety issues.",
      ),
    },
  ];

  const lessons2: Omit<LmsLesson, "courseId">[] = [
    {
      id: `${mod2}-l1`,
      moduleId: mod2,
      title: "Workplace scenario",
      lessonType: "scenario",
      sortOrder: 0,
      estimatedMinutes: 4,
      content: {
        type: "scenario",
        story: `A colleague suggests skipping a ${course.code} control to save time before a customer visit. The checklist still shows an open item.`,
        character: { name: "Alex", role: "Team lead" },
        choices: [
          {
            id: "skip",
            label: "Skip it — the visit is more important",
            correct: false,
            feedback: "Incorrect. Customer optics never override controlled procedures.",
          },
          {
            id: "hold",
            label: "Hold the activity, close the control, then proceed",
            correct: true,
            feedback: "Correct. Close the open control, capture evidence, then continue.",
          },
          {
            id: "hide",
            label: "Mark it complete without doing the work",
            correct: false,
            feedback: "Incorrect. False evidence is a compliance failure.",
          },
        ],
      },
    },
    {
      id: `${mod2}-l2`,
      moduleId: mod2,
      title: "Final check",
      lessonType: "quiz",
      sortOrder: 1,
      estimatedMinutes: 5,
      content: {
        type: "quiz",
        passMark: 80,
        inlineQuestions: [
          {
            id: "q1",
            stem: `Which statement best reflects expectations for “${topic}”?`,
            choices: [
              { id: "a", label: "Follow controlled steps and capture evidence" },
              { id: "b", label: "Prioritise schedule over open checklist items" },
              { id: "c", label: "Only apply rules when auditors are present" },
              { id: "d", label: "Let contractors set the procedure" },
            ],
            correctId: "a",
            explanation: "Controlled execution and evidence protect people and customers.",
          },
        ],
      },
    },
  ];

  const attach = (lessons: Omit<LmsLesson, "courseId">[]): LmsLesson[] =>
    lessons.map((lesson) => ({ ...lesson, courseId }));

  return {
    id: courseId,
    workspaceId: "workspace",
    code: course.code,
    slug: slugify(course.code),
    title: course.title,
    description: desc,
    category: course.category,
    durationMinutes: Math.max(15, Math.round(course.durationHours * 60)),
    passMark: 80,
    status: "published",
    certificatePrefix: "TRN",
    sortOrder: 0,
    coverImageUrl: null,
    questionCount: 1,
    modules: [
      {
        id: mod1,
        courseId,
        title: "Context & controls",
        summary: `Foundations for ${topic}.`,
        sortOrder: 0,
        lessons: attach(lessons1),
      },
      {
        id: mod2,
        courseId,
        title: "Apply & confirm",
        summary: "Scenarios and final check.",
        sortOrder: 1,
        lessons: attach(lessons2),
      },
    ],
  };
}

const GENERIC_TREE_CACHE = new Map<string, LmsCourseTree>();

export function getPlayableLmsCourseTree(course: TqmsCourse): LmsCourseTree | null {
  const oa = getOaLmsCourseTree(course.id);
  if (oa) return oa;

  const cached = GENERIC_TREE_CACHE.get(course.id);
  if (cached) return cached;

  const tree = buildGenericTree(course);
  GENERIC_TREE_CACHE.set(course.id, tree);
  return tree;
}

export function getPlayableLmsCourseTreeById(
  courseId: string,
  course?: TqmsCourse | null,
): LmsCourseTree | null {
  const oa = getOaLmsCourseTree(courseId);
  if (oa) return oa;
  if (course) return getPlayableLmsCourseTree(course);
  return null;
}
