import { NextResponse } from "next/server";

import { isDemoApiRequest } from "@/lib/demo/demo-request";
import {
  deleteNorthstarMarketingResource,
  getNorthstarMarketingBundle,
  upsertNorthstarMarketingResource,
} from "@/lib/demo/northstar-marketing-store";
import type { MarketingResource } from "@/lib/marketing/client/marketing-api";
import {
  deleteMarketingCampaign,
  deleteMarketingContact,
  deleteMarketingExternalEvent,
  deleteMarketingMediaAsset,
  deleteMarketingNewsletter,
  deleteMarketingManagedEvent,
  deleteMarketingStory,
  ensureMarketingWorkspaceSeeded,
  upsertMarketingCampaign,
  upsertMarketingContact,
  upsertMarketingExternalEvent,
  upsertMarketingManagedEvent,
  upsertMarketingMediaAsset,
  upsertMarketingNewsletter,
  upsertMarketingStory,
  listMarketingCampaigns,
  listMarketingContacts,
  listMarketingExternalEvents,
  listMarketingManagedEvents,
  listMarketingMediaAssets,
  listMarketingNewsletters,
  listMarketingStories,
} from "@/lib/marketing/marketing-service";

export const dynamic = "force-dynamic";

const LISTERS = {
  contacts: listMarketingContacts,
  newsletters: listMarketingNewsletters,
  campaigns: listMarketingCampaigns,
  "external-events": listMarketingExternalEvents,
  "managed-events": listMarketingManagedEvents,
  media: listMarketingMediaAssets,
  stories: listMarketingStories,
} as const;

export type MarketingResourceKey = keyof typeof LISTERS;

export async function handleMarketingResourceGet(
  resource: string,
  workspaceId: string,
  workspaceSlug: string,
) {
  if (await isDemoApiRequest()) {
    const bundle = getNorthstarMarketingBundle();
    const map: Record<string, unknown[]> = {
      contacts: bundle.contacts,
      newsletters: bundle.newsletters,
      campaigns: bundle.campaigns,
      "external-events": bundle.externalEvents,
      "managed-events": bundle.managedEvents,
      media: bundle.media,
      stories: bundle.portfolioStories,
    };
    return NextResponse.json({ items: map[resource] ?? [] });
  }

  await ensureMarketingWorkspaceSeeded({ workspaceId, workspaceSlug });
  const lister = LISTERS[resource as MarketingResourceKey];
  if (!lister) {
    return NextResponse.json({ error: `Unknown resource: ${resource}` }, { status: 400 });
  }
  const items =
    resource === "stories"
      ? await listMarketingStories({ workspaceId })
      : await (lister as (scope: { workspaceId: string }) => Promise<unknown[]>)({ workspaceId });
  return NextResponse.json({ items });
}

export async function handleMarketingResourcePost(
  resource: string,
  workspaceId: string,
  workspaceSlug: string,
  payload: Record<string, unknown>,
) {
  if (await isDemoApiRequest()) {
    const item = upsertNorthstarMarketingResource(resource as MarketingResource, payload);
    if (!item) {
      return NextResponse.json({ error: `Unknown resource: ${resource}` }, { status: 400 });
    }
    return NextResponse.json({ item });
  }

  await ensureMarketingWorkspaceSeeded({ workspaceId, workspaceSlug });
  const scope = { workspaceId };

  switch (resource) {
    case "contacts": {
      const contact = await upsertMarketingContact(
        payload as Parameters<typeof upsertMarketingContact>[0],
        scope,
      );
      return NextResponse.json({ item: contact });
    }
    case "newsletters": {
      const newsletter = await upsertMarketingNewsletter(
        payload as Parameters<typeof upsertMarketingNewsletter>[0],
        scope,
        {
          contentSources: (payload.contentSources as Record<string, unknown>) ?? {},
          extensionData: (payload.extensionData as Record<string, unknown>) ?? {},
        },
      );
      return NextResponse.json({ item: newsletter });
    }
    case "campaigns": {
      const campaign = await upsertMarketingCampaign(
        payload as Parameters<typeof upsertMarketingCampaign>[0],
        scope,
      );
      return NextResponse.json({ item: campaign });
    }
    case "external-events": {
      const event = await upsertMarketingExternalEvent(
        payload as Parameters<typeof upsertMarketingExternalEvent>[0],
        scope,
        (payload.extensionData as Record<string, unknown>) ?? {},
      );
      return NextResponse.json({ item: event });
    }
    case "managed-events": {
      const event = await upsertMarketingManagedEvent(
        payload as Parameters<typeof upsertMarketingManagedEvent>[0],
        scope,
        (payload.extensionData as Record<string, unknown>) ?? {},
      );
      return NextResponse.json({ item: event });
    }
    case "media": {
      const asset = await upsertMarketingMediaAsset(
        payload as Parameters<typeof upsertMarketingMediaAsset>[0],
        scope,
      );
      return NextResponse.json({ item: asset });
    }
    case "stories": {
      const story = await upsertMarketingStory(
        payload as Parameters<typeof upsertMarketingStory>[0],
        scope,
      );
      return NextResponse.json({ item: story });
    }
    default:
      return NextResponse.json({ error: `Unknown resource: ${resource}` }, { status: 400 });
  }
}

export async function handleMarketingResourceDelete(
  resource: string,
  id: string,
  workspaceId: string,
  workspaceSlug: string,
) {
  if (await isDemoApiRequest()) {
    const ok = deleteNorthstarMarketingResource(resource as MarketingResource, id);
    if (!ok) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  }

  await ensureMarketingWorkspaceSeeded({ workspaceId, workspaceSlug });
  const scope = { workspaceId };

  switch (resource) {
    case "contacts":
      await deleteMarketingContact(id, scope);
      break;
    case "newsletters":
      await deleteMarketingNewsletter(id, scope);
      break;
    case "campaigns":
      await deleteMarketingCampaign(id, scope);
      break;
    case "external-events":
      await deleteMarketingExternalEvent(id, scope);
      break;
    case "managed-events":
      await deleteMarketingManagedEvent(id, scope);
      break;
    case "media":
      await deleteMarketingMediaAsset(id, scope);
      break;
    case "stories":
      await deleteMarketingStory(id, scope);
      break;
    default:
      return NextResponse.json({ error: `Unknown resource: ${resource}` }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
