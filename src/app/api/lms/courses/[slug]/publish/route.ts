import { assertDemoMutationAllowedForRequest } from "@/lib/demo/mutation-guard";
import { NextRequest, NextResponse } from "next/server";

import { requireLmsWorkspaceSession } from "@/lib/lms/auth";
import { publishCourse } from "@/lib/lms/service";
import { allowsLmsAiCourseGeneration } from "@/lib/lms/workspace-gates";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, _request: Request,
  context: { params: Promise<{ slug: string }> },) {
  const demoMutationBlock = await assertDemoMutationAllowedForRequest(request);
  if (demoMutationBlock) return demoMutationBlock;

  const auth = await requireLmsWorkspaceSession();
  if ("error" in auth) return auth.error;
  if (auth.session.userType !== "internal") {
    return NextResponse.json({ error: "Staff only." }, { status: 403 });
  }
  if (!allowsLmsAiCourseGeneration(auth.workspace.slug)) {
    return NextResponse.json({ error: "Not available on this workspace." }, { status: 403 });
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
