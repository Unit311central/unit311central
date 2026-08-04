import { NextRequest, NextResponse } from "next/server";

import { getIsoWeekKey } from "@/lib/onwardair/competitor-intelligence-feed-store";
import { listCompetitors } from "@/lib/onwardair/competitor-intelligence-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * Weekly Competitor Intelligence cadence ping.
 * Client workspaces auto-create the week’s brief on Home / CI open.
 * This cron documents the schedule and returns the current week key for ops.
 */
function isAuthorizedCron(request: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: NextRequest) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const weekKey = getIsoWeekKey();
  const competitors = listCompetitors();
  const inCertification = competitors.filter(
    (c) => c.certificationCategory === "In Certification",
  ).length;

  return NextResponse.json({
    ok: true,
    cron: true,
    module: "onwardair-competitor-intelligence",
    weekKey,
    trackedCompetitors: competitors.length,
    inCertification,
    note: "Weekly briefs are ensured client-side when OnwardAir Home or Competitor Intelligence opens.",
  });
}
