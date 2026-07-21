import { NextRequest, NextResponse } from "next/server";

import {
  getAiQualitySummary,
  recordAnonymousFeedback,
} from "@/lib/ai-operating-assistant/feedback-service";
import type { FeedbackVerdict } from "@/lib/ai-operating-assistant/explainability";
import { getPlatformSession } from "@/lib/platform-session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const VERDICTS = new Set<FeedbackVerdict>([
  "helpful",
  "not_helpful",
  "incorrect",
  "missing_data",
]);

/**
 * POST — anonymous feedback on AI recommendations.
 * GET — AI quality summary (authenticated operators).
 */
export async function POST(request: NextRequest) {
  try {
    // Auth preferred but feedback stays anonymous (no user id stored).
    await getPlatformSession();

    const body = (await request.json()) as Record<string, unknown>;
    const verdict = body.verdict as FeedbackVerdict;
    if (!VERDICTS.has(verdict)) {
      return NextResponse.json({ error: "Invalid verdict." }, { status: 400 });
    }

    const targetId = typeof body.targetId === "string" ? body.targetId : "";
    const targetType = typeof body.targetType === "string" ? body.targetType : "other";
    const anonymousSessionId =
      typeof body.anonymousSessionId === "string" && body.anonymousSessionId.trim()
        ? body.anonymousSessionId.trim()
        : `anon_${Date.now().toString(36)}`;

    if (!targetId) {
      return NextResponse.json({ error: "targetId is required." }, { status: 400 });
    }

    const record = await recordAnonymousFeedback({
      verdict,
      targetType: targetType as
        | "insight"
        | "brief"
        | "health"
        | "message"
        | "recommendation"
        | "other",
      targetId,
      comment: typeof body.comment === "string" ? body.comment : null,
      anonymousSessionId,
      contextView: typeof body.contextView === "string" ? body.contextView : null,
    });

    return NextResponse.json({ ok: true, feedback: record });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to record feedback" },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const session = await getPlatformSession();
    if (!session) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }
    const summary = await getAiQualitySummary();
    return NextResponse.json({ quality: summary });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load quality summary" },
      { status: 500 },
    );
  }
}
