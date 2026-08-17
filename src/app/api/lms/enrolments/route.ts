import { assertDemoMutationAllowedForRequest } from "@/lib/demo/mutation-guard";
import { NextRequest, NextResponse } from "next/server";

import { requireLmsWorkspaceSession, resolveLmsClientId } from "@/lib/lms/auth";
import {
  ensureEnrolment,
  getCourseBySlug,
  listAssignedCoursesForUser,
  saveEnrolmentProgress,
} from "@/lib/lms/service";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireLmsWorkspaceSession();
  if ("error" in auth) return auth.error;

  try {
    const clientId = resolveLmsClientId(auth.session, auth.workspace.slug);
    const items = await listAssignedCoursesForUser({
      workspaceId: auth.workspace.id,
      userId: auth.session.sub,
      clientId,
    });
    return NextResponse.json({
      enrolments: items
        .filter((item) => item.enrolment)
        .map(({ course, enrolment }) => ({
          ...enrolment!,
          courseSlug: course.slug,
          courseTitle: course.title,
        })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load enrolments.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const demoMutationBlock = await assertDemoMutationAllowedForRequest(request);
  if (demoMutationBlock) return demoMutationBlock;

  const auth = await requireLmsWorkspaceSession();
  if ("error" in auth) return auth.error;

  try {
    const body = (await request.json().catch(() => ({}))) as {
      courseSlug?: string;
      start?: boolean;
    };
    const courseSlug = String(body.courseSlug ?? "").trim();
    if (!courseSlug) {
      return NextResponse.json({ error: "courseSlug is required." }, { status: 400 });
    }

    const course = await getCourseBySlug(auth.workspace.id, courseSlug);
    if (!course || course.status !== "published") {
      return NextResponse.json({ error: "Course not found." }, { status: 404 });
    }

    const clientId = resolveLmsClientId(auth.session, auth.workspace.slug);
    let enrolment = await ensureEnrolment({
      workspaceId: auth.workspace.id,
      courseId: course.id,
      userId: auth.session.sub,
      clientId,
    });

    if (body.start !== false && enrolment.status === "assigned") {
      enrolment = await saveEnrolmentProgress({
        workspaceId: auth.workspace.id,
        enrolmentId: enrolment.id,
        userId: auth.session.sub,
        progressPct: enrolment.progressPct,
        lessonState: enrolment.lessonState,
        timeSpentSeconds: enrolment.timeSpentSeconds,
        lastLessonId: enrolment.lastLessonId,
        status: "in_progress",
      });
    }

    return NextResponse.json({ enrolment, course });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to start enrolment.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
