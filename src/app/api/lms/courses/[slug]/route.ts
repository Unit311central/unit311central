import { NextResponse } from "next/server";

import { requireLmsWorkspaceSession } from "@/lib/lms/auth";
import { getCourseTree, updateCourseMeta } from "@/lib/lms/service";
import { allowsLmsAiCourseGeneration } from "@/lib/lms/workspace-gates";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, { params }: Params) {
  const auth = await requireLmsWorkspaceSession();
  if ("error" in auth) return auth.error;

  try {
    const { slug } = await params;
    const tree = await getCourseTree(auth.workspace.id, slug);
    if (!tree) {
      return NextResponse.json({ error: "Course not found." }, { status: 404 });
    }
    if (tree.status !== "published" && auth.session.userType !== "internal") {
      return NextResponse.json({ error: "Course not available." }, { status: 403 });
    }
    return NextResponse.json({ course: tree });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load course.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireLmsWorkspaceSession();
  if ("error" in auth) return auth.error;
  if (auth.session.userType !== "internal") {
    return NextResponse.json({ error: "Staff only." }, { status: 403 });
  }
  if (!allowsLmsAiCourseGeneration(auth.workspace.slug)) {
    return NextResponse.json({ error: "Not available on this workspace." }, { status: 403 });
  }

  try {
    const { slug } = await params;
    const body = (await request.json()) as {
      title?: string;
      description?: string;
      category?: string;
      durationMinutes?: number;
      passMark?: number;
    };
    const course = await updateCourseMeta(auth.workspace.id, slug, body);
    return NextResponse.json({ course });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update course.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
