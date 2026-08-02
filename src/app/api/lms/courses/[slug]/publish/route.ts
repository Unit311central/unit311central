import { NextResponse } from "next/server";

import { isAbhiSlug } from "@/lib/abhi-surface";
import { requireLmsWorkspaceSession } from "@/lib/lms/auth";
import { publishCourse } from "@/lib/lms/service";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const auth = await requireLmsWorkspaceSession();
  if ("error" in auth) return auth.error;
  if (auth.session.userType !== "internal") {
    return NextResponse.json({ error: "Staff only." }, { status: 403 });
  }
  if (!isAbhiSlug(auth.workspace.slug)) {
    return NextResponse.json({ error: "ABHI only." }, { status: 403 });
  }

  try {
    const { slug } = await context.params;
    const course = await publishCourse(auth.workspace.id, slug);
    return NextResponse.json({ course });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to publish.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
