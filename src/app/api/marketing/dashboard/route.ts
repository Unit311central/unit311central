import { NextResponse } from "next/server";

import { computeMarketingDashboardKpis, ensureMarketingWorkspaceSeeded } from "@/lib/marketing/marketing-service";
import { getNorthstarMarketingKpis } from "@/lib/demo/northstar-api-fixtures";
import { isDemoApiRequest } from "@/lib/demo/demo-request";

import { withMarketingApiAuth } from "../_lib/with-marketing-api-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  if (await isDemoApiRequest()) {
    return NextResponse.json({ kpis: getNorthstarMarketingKpis() });
  }

  return withMarketingApiAuth(async ({ workspaceId, workspaceSlug }) => {
    await ensureMarketingWorkspaceSeeded({ workspaceId, workspaceSlug });
    const kpis = await computeMarketingDashboardKpis({ workspaceId });
    return NextResponse.json({ kpis });
  });
}
