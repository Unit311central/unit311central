import { NextRequest, NextResponse } from "next/server";

import {
  getGoalPlan,
  toExecutionSummary,
  toPlanSummary,
  toPlanViewerModel,
} from "@/lib/ai-operating-assistant/actions/planning";
import { getPlatformSession } from "@/lib/platform-session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/executive-assistant/planning/goals/[id]
 * Read-only. Execution is not available on this route.
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const session = await getPlatformSession();
    if (!session) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const { id } = await context.params;
    const plan = await getGoalPlan(id, session.sub);
    if (!plan) {
      return NextResponse.json({ error: "Goal plan not found." }, { status: 404 });
    }

    return NextResponse.json({
      plan,
      summary: toPlanSummary(plan),
      viewer: toPlanViewerModel(plan),
      execution: toExecutionSummary(plan),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load goal plan";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST disabled — single write path is Action Framework plans.
 */
export async function POST(_request: NextRequest, _context: RouteContext) {
  void _request;
  void _context;
  return NextResponse.json(
    {
      error:
        "Goal plan execute is disabled. Approve via Plan Viewer → POST /api/executive-assistant/actions/plans/{id} → executeActionPlan().",
    },
    { status: 410 },
  );
}
