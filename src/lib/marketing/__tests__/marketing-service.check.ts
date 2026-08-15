/**
 * Run: node --import tsx src/lib/marketing/__tests__/marketing-service.check.ts
 */
import assert from "node:assert/strict";

import { MARKETING_MODULE_VIEWS, isMarketingModuleView } from "@/lib/marketing/views";
import { resolveMarketingViewForWorkspace } from "@/lib/marketing/view-resolver";
import { MARKETING_RENDERER_IDS } from "@/lib/marketing/workspace-packs/types";
import { CENTRAL_MARKETING_GRANT_VIEWS } from "@/lib/marketing/permissions";
import { getSocialWorkspaceSeoConfig } from "@/lib/marketing/social/seo-config";
import { resolveSocialPlatforms } from "@/lib/marketing/social/platforms";
import {
  ensureMarketingWorkspacePacksRegistered,
  registerMarketingWorkspacePack,
  resetMarketingWorkspacePacksForTests,
} from "@/lib/marketing/workspace-packs/registry";
import type { MarketingWorkspacePack } from "@/lib/marketing/workspace-packs/types";

const futureWorkspacePack: MarketingWorkspacePack = {
  id: "future-generic",
  label: "Future Workspace X",
  workspaceKeys: ["unknown"],
  resolveView(view) {
    if (view === "marketing-newsletter") {
      return { rendererId: MARKETING_RENDERER_IDS.CENTRAL_NEWSLETTER };
    }
    if (view === "social") {
      return { rendererId: MARKETING_RENDERER_IDS.SOCIAL };
    }
    return null;
  },
};

function main() {
  assert.ok(isMarketingModuleView("marketing-newsletter"));
  assert.ok(!isMarketingModuleView("financials"));

  for (const view of CENTRAL_MARKETING_GRANT_VIEWS) {
    assert.ok(
      MARKETING_MODULE_VIEWS.includes(view as never),
      `grant view ${view} should be in MARKETING_MODULE_VIEWS`,
    );
  }

  const internalNewsletter = resolveMarketingViewForWorkspace("marketing-newsletter", "internal");
  assert.equal(internalNewsletter?.rendererId, MARKETING_RENDERER_IDS.CENTRAL_NEWSLETTER);

  const talantonStories = resolveMarketingViewForWorkspace("journey-stories", "talanton");
  assert.equal(talantonStories?.rendererId, MARKETING_RENDERER_IDS.TALANTON_JOURNEY_STORIES);

  const talantonSeo = getSocialWorkspaceSeoConfig("talanton");
  assert.ok(talantonSeo.keywords.length > 0);
  assert.ok(talantonSeo.ppcCampaigns.length > 0);
  assert.equal(talantonSeo.domain, "talantonimpact.com");

  const internalPlatforms = resolveSocialPlatforms();
  assert.ok(internalPlatforms.length > 0);

  resetMarketingWorkspacePacksForTests();
  ensureMarketingWorkspacePacksRegistered();
  registerMarketingWorkspacePack(futureWorkspacePack);
  const futureNewsletter = resolveMarketingViewForWorkspace("marketing-newsletter", "unknown");
  assert.equal(futureNewsletter?.rendererId, MARKETING_RENDERER_IDS.CENTRAL_NEWSLETTER);
  const futureSocial = resolveMarketingViewForWorkspace("social", "unknown");
  assert.equal(futureSocial?.rendererId, MARKETING_RENDERER_IDS.SOCIAL);

  console.log("marketing-service.check.ts — all assertions passed");
}

main();
