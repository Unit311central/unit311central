import { NextResponse } from "next/server";

import { requireLmsWorkspaceSession } from "@/lib/lms/auth";
import { listPublishedCourses } from "@/lib/lms/service";

export const dynamic = "force-dynamic";

/** Workspace published catalog (admin / Courses view). */
export async function GET() {
  const auth = await requireLmsWorkspaceSession();
  if ("error" in auth) return auth.error;

  try {
    const courses = await listPublishedCourses(auth.workspace.id);
    return NextResponse.json({ courses });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load courses.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
