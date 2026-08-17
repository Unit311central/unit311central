import { assertDemoMutationAllowedForRequest } from "@/lib/demo/mutation-guard";
import { NextRequest, NextResponse } from "next/server";

import { requireLmsWorkspaceSession, resolveLmsClientId } from "@/lib/lms/auth";
import {
  ensureEnrolment,
  getCourseBySlug,
  getCourseTree,
  submitAssessmentAttempt,
} from "@/lib/lms/service";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const demoMutationBlock = await assertDemoMutationAllowedForRequest(request);
  if (demoMutationBlock) return demoMutationBlock;

  const auth = await requireLmsWorkspaceSession();
  if ("error" in auth) return auth.error;

  try {
    const body = (await request.json().catch(() => ({}))) as {
      courseSlug?: string;
      enrolmentId?: string;
      questionIds?: string[];
      answers?: Record<string, string>;
    };

    const courseSlug = String(body.courseSlug ?? "").trim();
    const questionIds = Array.isArray(body.questionIds) ? body.questionIds.map(String) : [];
    const answers =
      body.answers && typeof body.answers === "object" ? body.answers : {};

    if (!courseSlug) {
      return NextResponse.json({ error: "courseSlug is required." }, { status: 400 });
    }
    if (questionIds.length === 0) {
      return NextResponse.json({ error: "questionIds are required." }, { status: 400 });
    }

    const course = await getCourseBySlug(auth.workspace.id, courseSlug);
    if (!course || course.status !== "published") {
      return NextResponse.json({ error: "Course not found." }, { status: 404 });
    }

    const tree = await getCourseTree(auth.workspace.id, courseSlug);
    let passMark = course.passMark;
    for (const mod of tree?.modules ?? []) {
      for (const lesson of mod.lessons) {
        if (lesson.content.type === "assessment") {
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

    if (body.enrolmentId && body.enrolmentId !== enrolment.id) {
      return NextResponse.json({ error: "Enrolment mismatch." }, { status: 403 });
    }

    const result = await submitAssessmentAttempt({
      workspaceId: auth.workspace.id,
      courseId: course.id,
      enrolmentId: enrolment.id,
      userId: auth.session.sub,
      answers,
      questionIds,
      passMark,
    });

    return NextResponse.json({
      ...result,
      passMark,
      enrolmentId: enrolment.id,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to submit assessment.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
