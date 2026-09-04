import { NextRequest, NextResponse } from "next/server";

import {
  requireWorkPackageSession,
  workPackageActor,
  workPackageErrorResponse,
} from "@/lib/internal-work-packages/api-helpers";
import {
  answerWorkPackageQuestion,
  listWorkPackageQuestionAnswerLog,
} from "@/lib/internal-work-packages/service";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string; questionId: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }
  try {
    const session = await requireWorkPackageSession();
    const { id, questionId } = await context.params;
    const body = (await request.json()) as Record<string, unknown>;
    const question = await answerWorkPackageQuestion(
      id,
      questionId,
      { answerText: String(body.answerText ?? "") },
      workPackageActor(session),
    );
    return NextResponse.json({ question });
  } catch (error) {
    return workPackageErrorResponse(error, "Failed to save answer.");
  }
}
