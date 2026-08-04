/**
 * Playable OnwardAir LMS course trees (client fixtures).
 * Used by Staff / External / QMS Training — horizontal CoursePlayer scroller.
 */

import type { LmsCourseTree, LmsLesson, LessonContent } from "@/lib/lms/types";
import type { TqmsCourse } from "@/lib/tqms-data";
import {
  OA_EXTERNAL_COURSES,
  OA_QMS_COURSES,
  OA_STAFF_COURSES,
} from "@/lib/onwardair/training-data";

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

function buildTree(course: TqmsCourse, accentHint: string): LmsCourseTree {
  const courseId = `lms-${course.id}`;
  const mod1 = `${courseId}-m1`;
  const mod2 = `${courseId}-m2`;
  const topic = course.title;
  const desc =
    course.description ||
    `${topic} for OnwardAir Houston · Vertex VTOL™ / FLEX Pod™ programmes.`;

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
          {
            kind: "paragraph",
            text: desc,
          },
          {
            kind: "callout",
            tone: "info",
            title: "OnwardAir standard",
            text: `Complete this module before operating on ${accentHint}. Escalate grey areas to your lead.`,
          },
          {
            kind: "bullet_list",
            items: [
              "Follow Houston site and hangar rules",
              "Protect Vertex and FLEX Pod configuration baselines",
              "Record evidence for programme gates",
              "Ask early when unsure",
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
          { id: "1", label: "Prepare", body: "Read the brief and confirm configuration.", icon: "01" },
          { id: "2", label: "Execute", body: "Follow the controlled procedure.", icon: "02" },
          { id: "3", label: "Verify", body: "Capture evidence for the gate pack.", icon: "03" },
          { id: "4", label: "Close", body: "Sign off or escalate findings.", icon: "04" },
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
        "Pause work and escalate to your lead / Quality",
        [
          "Continue and document later if asked",
          "Skip the step to keep the schedule",
          "Ask a contractor to decide for you",
        ],
        "OnwardAir expects early escalation — do not invent a workaround under time pressure.",
      ),
    },
  ];

  const lessons2: Omit<LmsLesson, "courseId">[] = [
    {
      id: `${mod2}-l1`,
      moduleId: mod2,
      title: "Houston scenario",
      lessonType: "scenario",
      sortOrder: 0,
      estimatedMinutes: 4,
      content: {
        type: "scenario",
        story: `During a Vertex taxi campaign, a colleague suggests skipping a ${course.code} control to save 20 minutes before a Board visit. The checklist still shows an open item.`,
        character: { name: "Jordan", role: "Flight Test tech" },
        choices: [
          {
            id: "skip",
            label: "Skip it — the Board visit is more important",
            correct: false,
            feedback:
              "Incorrect. Programme optics never override controlled procedures or safety evidence.",
          },
          {
            id: "hold",
            label: "Hold the activity, close the control, then proceed",
            correct: true,
            feedback:
              "Correct. Close the open control, capture evidence, then continue the campaign.",
          },
          {
            id: "hide",
            label: "Mark it complete without doing the work",
            correct: false,
            feedback: "Incorrect. False evidence is a quality and safety failure.",
          },
        ],
      },
    },
    {
      id: `${mod2}-l2`,
      moduleId: mod2,
      title: "Match the response",
      lessonType: "drag_drop",
      sortOrder: 1,
      estimatedMinutes: 3,
      content: {
        type: "drag_drop",
        prompt: "Match each situation to the right first response.",
        mode: "match",
        items: [
          { id: "i1", label: "Open checklist item before taxi", correctZoneId: "z1" },
          { id: "i2", label: "Unsure which revision is current", correctZoneId: "z2" },
          { id: "i3", label: "Suspected safety risk on hangar floor", correctZoneId: "z3" },
        ],
        zones: [
          { id: "z1", label: "Hold & close control" },
          { id: "z2", label: "Check document control" },
          { id: "z3", label: "Stop & escalate" },
        ],
      },
    },
    {
      id: `${mod2}-l3`,
      moduleId: mod2,
      title: "Voice recap",
      lessonType: "narration",
      sortOrder: 2,
      estimatedMinutes: 2,
      content: {
        type: "narration",
        title: "Remember the essentials",
        script: `At OnwardAir Houston, ${topic} protects people, aircraft, and programme evidence. Prepare, execute the controlled step, verify with records, and escalate early when unsure. You are ready to complete this course.`,
        voiceHint: "OnwardAir coach",
      },
    },
    {
      id: `${mod2}-l4`,
      moduleId: mod2,
      title: "Final check",
      lessonType: "quiz",
      sortOrder: 3,
      estimatedMinutes: 5,
      content: {
        type: "quiz",
        passMark: 80,
        inlineQuestions: [
          {
            id: "q1",
            stem: `Which statement best reflects OnwardAir expectations for “${topic}”?`,
            choices: [
              { id: "a", label: "Follow controlled steps and capture gate evidence" },
              { id: "b", label: "Prioritise schedule over open checklist items" },
              { id: "c", label: "Only apply rules when auditors are present" },
              { id: "d", label: "Let contractors set the procedure" },
            ],
            correctId: "a",
            explanation: "Controlled execution and evidence keep Vertex / FLEX Pod gates safe.",
          },
          {
            id: "q2",
            stem: "When should you escalate?",
            choices: [
              { id: "a", label: "As soon as you are unsure" },
              { id: "b", label: "Only after a near miss" },
              { id: "c", label: "Only if Board asks" },
              { id: "d", label: "Never — use personal judgement" },
            ],
            correctId: "a",
            explanation: "Early escalation is expected on Houston programmes.",
          },
        ],
      },
    },
  ];

  const attach = (lessons: Omit<LmsLesson, "courseId">[]): LmsLesson[] =>
    lessons.map((lesson) => ({ ...lesson, courseId }));

  return {
    id: courseId,
    workspaceId: "onwardair",
    code: course.code,
    slug: slugify(course.code),
    title: course.title,
    description: desc,
    category: course.category,
    durationMinutes: Math.max(15, Math.round(course.durationHours * 60)),
    passMark: 80,
    status: "published",
    certificatePrefix: "OA",
    sortOrder: 0,
    coverImageUrl: null,
    questionCount: 2,
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

const ALL_OA_COURSES = [...OA_STAFF_COURSES, ...OA_EXTERNAL_COURSES, ...OA_QMS_COURSES];

const TREE_BY_TQMS_ID = new Map<string, LmsCourseTree>(
  ALL_OA_COURSES.map((course) => {
    const hint =
      course.category === "External"
        ? "vendor / regulator programmes"
        : course.category === "QMS"
          ? "quality and configuration control"
          : "staff operations at Houston HQ";
    return [course.id, buildTree(course, hint)];
  }),
);

export function getOaLmsCourseTree(tqmsCourseId: string): LmsCourseTree | null {
  return TREE_BY_TQMS_ID.get(tqmsCourseId) ?? null;
}

export function listOaLmsCourseTrees(filter?: (course: TqmsCourse) => boolean): LmsCourseTree[] {
  return ALL_OA_COURSES.filter((c) => (filter ? filter(c) : true)).map(
    (c) => TREE_BY_TQMS_ID.get(c.id)!,
  );
}
