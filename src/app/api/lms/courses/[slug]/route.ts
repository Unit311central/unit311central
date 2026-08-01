import { NextResponse } from "next/server";

import { requireLmsWorkspaceSession } from "@/lib/lms/auth";
import { getCourseTree } from "@/lib/lms/service";

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
