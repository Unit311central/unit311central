import { NextRequest, NextResponse } from "next/server";

import { getRequestHost } from "@/lib/app-domains";
import { isWolfClonedAnalyticsHost } from "@/lib/wolf/wolf-analytics-access";
import { getPlatformSession } from "@/lib/platform-session";
import { isPlatformAnalyticsPeriod } from "@/lib/platform-analytics/period";
import { buildPlatformAnalyticsSummary } from "@/lib/platform-analytics/service";
import { isWorkspaceFilterKey } from "@/lib/platform-analytics/taxonomy";
import type { PlatformAnalyticsPeriod } from "@/lib/platform-analytics/types";
import type { WorkspaceFilterKey } from "@/lib/platform-analytics/taxonomy";

export const dynamic = "force-dynamic";

/**
 * Aggregate Platform Analytics for Internal operators only.
 * Query: period=7d|30d|90d|12m|all & workspace=all|internal|demo|abhi|talantonimpact|corpcentre
 */
export async function GET(request: NextRequest) {
  try {
    const host = getRequestHost(request);
    if (!isWolfClonedAnalyticsHost(host)) {
      return NextResponse.json({ error: "Not available on this host." }, { status: 403 });
    }

    const session = await getPlatformSession();
    if (!session) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }
    if (session.userType !== "internal") {
      return NextResponse.json({ error: "Internal operators only." }, { status: 403 });
    }

    const rawPeriod = request.nextUrl.searchParams.get("period") ?? "30d";
    const period: PlatformAnalyticsPeriod = isPlatformAnalyticsPeriod(rawPeriod)
      ? rawPeriod
      : "30d";

    const rawWorkspace = request.nextUrl.searchParams.get("workspace") ?? "all";
    const workspaceFilter: WorkspaceFilterKey = isWorkspaceFilterKey(rawWorkspace)
      ? rawWorkspace
      : "all";

    const summary = await buildPlatformAnalyticsSummary(period, workspaceFilter);
    return NextResponse.json(summary, {
      headers: { "Cache-Control": "private, max-age=30" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load analytics.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
