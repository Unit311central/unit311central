import { assertDemoMutationAllowedForRequest } from "@/lib/demo/mutation-guard";
import { NextRequest, NextResponse } from "next/server";

import { requireLmsWorkspaceSession } from "@/lib/lms/auth";
import { saveEnrolmentProgress } from "@/lib/lms/service";
import type { LmsEnrolment } from "@/lib/lms/types";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const demoMutationBlock = await assertDemoMutationAllowedForRequest(request);
  if (demoMutationBlock) return demoMutationBlock;

  const auth = await requireLmsWorkspaceSession();
  if ("error" in auth) return auth.error;

  try {
    const { id } = await params;
    const body = (await request.json().catch(() => ({}))) as {
      progressPct?: number;
      lessonState?: Record<string, unknown>;
      timeSpentSeconds?: number;
      lastLessonId?: string | null;
      status?: LmsEnrolment["status"];
    };

    const enrolment = await saveEnrolmentProgress({
      workspaceId: auth.workspace.id,
      enrolmentId: id,
      userId: auth.session.sub,
      progressPct: Number(body.progressPct ?? 0),
      lessonState: body.lessonState ?? {},
      timeSpentSeconds: Number(body.timeSpentSeconds ?? 0),
      lastLessonId: body.lastLessonId ?? null,
      status: body.status,
    });

    return NextResponse.json({ enrolment });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save progress.";
    const status = message.toLowerCase().includes("0 rows") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
