import { NextRequest, NextResponse } from "next/server";

import {
  ensureWeeklyCompetitorIntelligenceRefresh,
  getIsoWeekKey,
  listCompetitorIntelFeed,
} from "@/lib/onwardair/competitor-intelligence-feed-store";
import { listCompetitors } from "@/lib/onwardair/competitor-intelligence-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * Weekly Competitor Intelligence cadence ping.
 * Ensures the server-side feed (EA + cron) has the current ISO week brief/signals.
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
  const refresh = ensureWeeklyCompetitorIntelligenceRefresh();
  const feed = listCompetitorIntelFeed();
  const competitors = listCompetitors();
  const inCertification = competitors.filter(
    (c) => c.certificationCategory === "In Certification",
  ).length;

  return NextResponse.json({
    ok: true,
    cron: true,
    module: "onwardair-competitor-intelligence",
    weekKey,
    refreshCreated: refresh.created,
    intelFeedItems: feed.length,
    trackedCompetitors: competitors.length,
    inCertification,
    note: "Server feed warmed for EA; clients still merge localStorage on open.",
  });
}
