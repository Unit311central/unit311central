import { assertDemoMutationAllowedForRequest } from "@/lib/demo/mutation-guard";
import { NextRequest, NextResponse } from "next/server";

import { requireLmsWorkspaceSession, resolveLmsClientId } from "@/lib/lms/auth";
import { learnerCanAccessCourse } from "@/lib/lms/course-learner-access";
import { sceneForQuestion } from "@/lib/lms/question-scenes";
import {
  drawAssessmentQuestions,
  ensureEnrolment,
  getCourseBySlug,
  getCourseTree,
  listCourseQuestions,
} from "@/lib/lms/service";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const demoMutationBlock = await assertDemoMutationAllowedForRequest(request);
  if (demoMutationBlock) return demoMutationBlock;

  const auth = await requireLmsWorkspaceSession();
  if ("error" in auth) return auth.error;

  try {
    const body = (await request.json().catch(() => ({}))) as { courseSlug?: string };
    const courseSlug = String(body.courseSlug ?? "").trim();
    if (!courseSlug) {
      return NextResponse.json({ error: "courseSlug is required." }, { status: 400 });
    }

    const course = await getCourseBySlug(auth.workspace.id, courseSlug);
    if (!course || !learnerCanAccessCourse(course, auth.session)) {
      return NextResponse.json({ error: "Course not found." }, { status: 404 });
    }

    const tree = await getCourseTree(auth.workspace.id, courseSlug);
    let drawCount = 20;
    let passMark = course.passMark;
    for (const mod of tree?.modules ?? []) {
      for (const lesson of mod.lessons) {
        if (lesson.content.type === "assessment") {
          drawCount = lesson.content.drawCount;
          passMark = lesson.content.passMark;
        }
      }
    }

    const clientId = resolveLmsClientId(auth.session, auth.workspace.slug);
    const enrolment = await ensureEnrolment({
      workspaceId: auth.workspace.id,
      courseId: course.id,
      userId: auth.session.sub,
      clientId,
    });

    const bank = await listCourseQuestions(auth.workspace.id, course.id);
    const questions = await drawAssessmentQuestions({
      workspaceId: auth.workspace.id,
      courseId: course.id,
      drawCount,
    });

    function shuffleChoices<T>(items: T[]): T[] {
      const arr = [...items];
      for (let i = arr.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j]!, arr[i]!];
      }
      return arr;
    }

    return NextResponse.json({
      enrolmentId: enrolment.id,
      drawCount,
      questionBankCount: bank.length,
      passMark,
      questions: questions.map((q) => {
        const scene = sceneForQuestion({ stem: q.stem, id: q.id });
        return {
          id: q.id,
          questionType: q.questionType,
          stem: q.stem,
          choices: shuffleChoices(q.choices),
          difficulty: q.difficulty,
          imageUrl: scene.imageUrl,
          sceneLabel: scene.label,
        };
      }),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to draw assessment.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
