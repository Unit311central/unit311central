import { NextResponse } from "next/server";

import { requireLmsWorkspaceSession, resolveLmsClientId } from "@/lib/lms/auth";
import { listAssignedCoursesForUser } from "@/lib/lms/service";

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
      courses: items.map(({ course, enrolment }) => ({
        ...course,
        enrolment,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load catalog.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
