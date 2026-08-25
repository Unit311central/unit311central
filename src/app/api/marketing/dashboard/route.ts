import { NextResponse } from "next/server";

import { computeMarketingDashboardKpis, ensureMarketingWorkspaceSeeded } from "@/lib/marketing/marketing-service";
import { getNorthstarMarketingKpis } from "@/lib/demo/northstar-api-fixtures";
import { getSaecMarketingKpis } from "@/lib/saec/marketing-seed-data";
import { isSaecSlug } from "@/lib/saec-surface";
import { isDemoApiRequest } from "@/lib/demo/demo-request";

import { withMarketingApiAuth } from "../_lib/with-marketing-api-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  if (await isDemoApiRequest()) {
    return NextResponse.json({ kpis: getNorthstarMarketingKpis() });
  }

  return withMarketingApiAuth(async ({ workspaceId, workspaceSlug }) => {
    if (isSaecSlug(workspaceSlug)) {
      await ensureMarketingWorkspaceSeeded({ workspaceId, workspaceSlug });
      const kpis = await computeMarketingDashboardKpis({ workspaceId });
      const hasData =
        (kpis.mailingSubscribers ?? 0) > 0 ||
        (kpis.sentNewsletterCount ?? 0) > 0 ||
        (kpis.externalEventsTotal ?? 0) > 0;
      return NextResponse.json({ kpis: hasData ? kpis : getSaecMarketingKpis() });
    }
    await ensureMarketingWorkspaceSeeded({ workspaceId, workspaceSlug });
    const kpis = await computeMarketingDashboardKpis({ workspaceId });
    return NextResponse.json({ kpis });
  });
}
