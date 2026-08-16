import { NextResponse } from "next/server";

import { isDemoApiRequest } from "@/lib/demo/demo-request";
import { getNorthstarMarketingBundle } from "@/lib/demo/northstar-marketing-fixtures";
import {
  computeMarketingDashboardKpis,
  ensureMarketingWorkspaceSeeded,
  getMarketingAbhiExtension,
  listMarketingCampaigns,
  listMarketingContacts,
  listMarketingExternalEvents,
  listMarketingManagedEvents,
  listMarketingMediaAssets,
  listMarketingNewsletters,
  listMarketingStories,
  upsertMarketingContact,
  upsertMarketingNewsletter,
} from "@/lib/marketing/marketing-service";

import { withMarketingApiAuth } from "../_lib/with-marketing-api-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  if (await isDemoApiRequest()) {
    return NextResponse.json(getNorthstarMarketingBundle());
  }

  return withMarketingApiAuth(async ({ workspaceId, workspaceSlug }) => {
    await ensureMarketingWorkspaceSeeded({ workspaceId, workspaceSlug });

    const [
      contacts,
      newsletters,
      campaigns,
      externalEvents,
      managedEvents,
      media,
      portfolioStories,
      journeyStories,
      kpis,
      workingGroups,
      accelerators,
    ] = await Promise.all([
      listMarketingContacts({ workspaceId }),
      listMarketingNewsletters({ workspaceId }),
      listMarketingCampaigns({ workspaceId }),
      listMarketingExternalEvents({ workspaceId }),
      listMarketingManagedEvents({ workspaceId }),
      listMarketingMediaAssets({ workspaceId }),
      listMarketingStories({ workspaceId }, "portfolio"),
      listMarketingStories({ workspaceId }, "journey"),
      computeMarketingDashboardKpis({ workspaceId }),
      getMarketingAbhiExtension<{ workingGroups: unknown[] }>("working-groups", {
        workspaceId,
      }),
      getMarketingAbhiExtension<{ acceleratorCohorts: unknown[] }>("accelerators", {
        workspaceId,
      }),
    ]);

    return NextResponse.json({
      contacts,
      newsletters,
      campaigns,
      externalEvents,
      managedEvents,
      media,
      portfolioStories,
      journeyStories,
      kpis,
      abhiExtensions: {
        workingGroups: workingGroups?.workingGroups ?? [],
        acceleratorCohorts: accelerators?.acceleratorCohorts ?? [],
      },
    });
  });
}

export async function POST(request: Request) {
  return withMarketingApiAuth(async ({ workspaceId, workspaceSlug }) => {
    await ensureMarketingWorkspaceSeeded({ workspaceId, workspaceSlug });
    const body = (await request.json()) as {
      resource?: string;
      payload?: Record<string, unknown>;
    };

    if (body.resource === "contact") {
      const contact = await upsertMarketingContact(
        body.payload as Parameters<typeof upsertMarketingContact>[0],
        { workspaceId },
      );
      return NextResponse.json({ contact });
    }

    if (body.resource === "newsletter") {
      const newsletter = await upsertMarketingNewsletter(
        body.payload as Parameters<typeof upsertMarketingNewsletter>[0],
        { workspaceId },
        {
          contentSources: (body.payload?.contentSources as Record<string, unknown>) ?? {},
          extensionData: (body.payload?.extensionData as Record<string, unknown>) ?? {},
        },
      );
      return NextResponse.json({ newsletter });
    }

    return NextResponse.json({ error: "Unsupported marketing resource" }, { status: 400 });
  });
}
