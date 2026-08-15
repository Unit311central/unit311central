import { NextResponse } from "next/server";

import { computeMarketingDashboardKpis, ensureMarketingWorkspaceSeeded } from "@/lib/marketing/marketing-service";

import { withMarketingApiAuth } from "../_lib/with-marketing-api-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  return withMarketingApiAuth(async ({ workspaceId, workspaceSlug }) => {
    await ensureMarketingWorkspaceSeeded({ workspaceId, workspaceSlug });
    const kpis = await computeMarketingDashboardKpis({ workspaceId });
    return NextResponse.json({ kpis });
  });
}
