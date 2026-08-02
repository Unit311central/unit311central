import { NextRequest, NextResponse } from "next/server";

import { requireLmsWorkspaceSession } from "@/lib/lms/auth";
import { createCourseTree, listAllCoursesForWorkspace, listPublishedCourses } from "@/lib/lms/service";
import type { LmsCourseCreateInput } from "@/lib/lms/types";
import { allowsLmsAiCourseGeneration } from "@/lib/lms/workspace-gates";

export const dynamic = "force-dynamic";

/** Workspace catalog. Internal staff see drafts on ABHI when ?all=1. */
export async function GET(request: NextRequest) {
  const auth = await requireLmsWorkspaceSession();
  if ("error" in auth) return auth.error;

  try {
    const all = request.nextUrl.searchParams.get("all") === "1";
    const courses =
      all && auth.session.userType === "internal"
        ? await listAllCoursesForWorkspace(auth.workspace.id)
        : await listPublishedCourses(auth.workspace.id);
    return NextResponse.json({ courses });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load courses.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** Create a draft/published course tree (ABHI staff). */
export async function POST(request: NextRequest) {
  const auth = await requireLmsWorkspaceSession();
  if ("error" in auth) return auth.error;
  if (auth.session.userType !== "internal") {
    return NextResponse.json({ error: "Staff only." }, { status: 403 });
  }
  if (!allowsLmsAiCourseGeneration(auth.workspace.slug)) {
    return NextResponse.json(
      { error: "Course creation is not available on this workspace." },
      { status: 403 },
    );
  }

  try {
    const body = (await request.json()) as LmsCourseCreateInput;
    if (!body?.title || !Array.isArray(body.modules) || body.modules.length === 0) {
      return NextResponse.json({ error: "title and modules are required." }, { status: 400 });
    }
    const course = await createCourseTree(auth.workspace.id, {
      ...body,
      status: body.status ?? "draft",
    });
    return NextResponse.json({ course });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create course.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
