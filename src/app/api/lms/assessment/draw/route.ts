import { NextRequest, NextResponse } from "next/server";

import { requireLmsWorkspaceSession, resolveLmsClientId } from "@/lib/lms/auth";
import {
  drawAssessmentQuestions,
  ensureEnrolment,
  getCourseBySlug,
  getCourseTree,
} from "@/lib/lms/service";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const auth = await requireLmsWorkspaceSession();
  if ("error" in auth) return auth.error;

  try {
    const body = (await request.json().catch(() => ({}))) as { courseSlug?: string };
    const courseSlug = String(body.courseSlug ?? "").trim();
    if (!courseSlug) {
      return NextResponse.json({ error: "courseSlug is required." }, { status: 400 });
    }

    const course = await getCourseBySlug(auth.workspace.id, courseSlug);
    if (!course || course.status !== "published") {
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

    const questions = await drawAssessmentQuestions({
      workspaceId: auth.workspace.id,
      courseId: course.id,
      drawCount,
    });

    return NextResponse.json({
      enrolmentId: enrolment.id,
      drawCount,
      passMark,
      questions: questions.map((q) => ({
        id: q.id,
        questionType: q.questionType,
        stem: q.stem,
        choices: q.choices,
        difficulty: q.difficulty,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to draw assessment.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
