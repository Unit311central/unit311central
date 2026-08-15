/**
 * Run: node --import tsx src/lib/marketing/__tests__/view-resolver.check.ts
 */
import assert from "node:assert/strict";

import type { InternalOperationsView } from "@/lib/internal-operations-data";
import { MARKETING_MODULE_VIEWS } from "@/lib/marketing/views";
import { resolveMarketingViewForWorkspace } from "@/lib/marketing/view-resolver";
import { MARKETING_RENDERER_IDS } from "@/lib/marketing/workspace-packs/types";
import {
  ensureMarketingWorkspacePacksRegistered,
  resetMarketingWorkspacePacksForTests,
} from "@/lib/marketing/workspace-packs/registry";
import type { MarketingWorkspaceKey } from "@/lib/marketing/workspace-context";

const ABHI_RENDERERS = new Set<string>([
  MARKETING_RENDERER_IDS.ABHI_NEWSLETTER,
  MARKETING_RENDERER_IDS.ABHI_EVENTS,
  MARKETING_RENDERER_IDS.ABHI_CALENDAR_EVENTS,
  MARKETING_RENDERER_IDS.ABHI_EVENT_MANAGEMENT,
  MARKETING_RENDERER_IDS.ABHI_MAILING_LIST,
  MARKETING_RENDERER_IDS.ABHI_PROGRAMMES,
  MARKETING_RENDERER_IDS.ABHI_COMPLIANCE_TRAINING,
]);

const CENTRAL_RENDERERS = new Set<string>([
  MARKETING_RENDERER_IDS.CENTRAL_DASHBOARD,
  MARKETING_RENDERER_IDS.CENTRAL_NEWSLETTER,
  MARKETING_RENDERER_IDS.CENTRAL_MAILING,
  MARKETING_RENDERER_IDS.CENTRAL_EXTERNAL_EVENTS,
  MARKETING_RENDERER_IDS.CENTRAL_MANAGED_EVENTS,
  MARKETING_RENDERER_IDS.CENTRAL_MEDIA_LIBRARY,
  MARKETING_RENDERER_IDS.CENTRAL_STORIES,
]);

const PLATFORM_CENTRAL_VIEWS: Partial<Record<InternalOperationsView, string>> = {
  "oa-marketing-dashboard": MARKETING_RENDERER_IDS.CENTRAL_DASHBOARD,
  "marketing-newsletter": MARKETING_RENDERER_IDS.CENTRAL_NEWSLETTER,
  "marketing-events": MARKETING_RENDERER_IDS.CENTRAL_EXTERNAL_EVENTS,
  "marketing-event-management": MARKETING_RENDERER_IDS.CENTRAL_MANAGED_EVENTS,
  "marketing-mailing-list": MARKETING_RENDERER_IDS.CENTRAL_MAILING,
  "portfolio-stories": MARKETING_RENDERER_IDS.CENTRAL_STORIES,
  "journey-stories": MARKETING_RENDERER_IDS.CENTRAL_STORIES,
  "stories-newsletter": MARKETING_RENDERER_IDS.CENTRAL_NEWSLETTER,
  "stories-media-library": MARKETING_RENDERER_IDS.CENTRAL_MEDIA_LIBRARY,
  "stories-mailing-list": MARKETING_RENDERER_IDS.CENTRAL_MAILING,
  social: MARKETING_RENDERER_IDS.SOCIAL,
  "marketing-training": MARKETING_RENDERER_IDS.STAFF_TRAINING,
};

const OA_VIEWS: Partial<Record<InternalOperationsView, string>> = {
  "oa-marketing-dashboard": MARKETING_RENDERER_IDS.OA_MARKETING,
  "marketing-newsletter": MARKETING_RENDERER_IDS.OA_MARKETING,
  "marketing-events": MARKETING_RENDERER_IDS.OA_MARKETING,
  "marketing-event-management": MARKETING_RENDERER_IDS.OA_MARKETING,
  "marketing-mailing-list": MARKETING_RENDERER_IDS.OA_MARKETING,
  social: MARKETING_RENDERER_IDS.SOCIAL,
  "marketing-training": MARKETING_RENDERER_IDS.STAFF_TRAINING,
};

const TALANTON_VIEWS: Partial<Record<InternalOperationsView, string>> = {
  "portfolio-stories": MARKETING_RENDERER_IDS.TALANTON_PORTFOLIO_STORIES,
  "journey-stories": MARKETING_RENDERER_IDS.TALANTON_JOURNEY_STORIES,
  "stories-newsletter": MARKETING_RENDERER_IDS.TALANTON_STORIES_NEWSLETTER,
  "stories-media-library": MARKETING_RENDERER_IDS.TALANTON_MEDIA_LIBRARY,
  "stories-mailing-list": MARKETING_RENDERER_IDS.TALANTON_STORIES_MAILING_LIST,
  social: MARKETING_RENDERER_IDS.SOCIAL,
  "marketing-training": MARKETING_RENDERER_IDS.STAFF_TRAINING,
};

const ABHI_VIEWS: Partial<Record<InternalOperationsView, string>> = {
  "marketing-newsletter": MARKETING_RENDERER_IDS.ABHI_NEWSLETTER,
  "marketing-events": MARKETING_RENDERER_IDS.ABHI_EVENTS,
  "marketing-abhi-events": MARKETING_RENDERER_IDS.ABHI_CALENDAR_EVENTS,
  "marketing-event-management": MARKETING_RENDERER_IDS.ABHI_EVENT_MANAGEMENT,
  "marketing-mailing-list": MARKETING_RENDERER_IDS.ABHI_MAILING_LIST,
  "marketing-working-groups": MARKETING_RENDERER_IDS.ABHI_PROGRAMMES,
  "marketing-us-accelerator": MARKETING_RENDERER_IDS.ABHI_PROGRAMMES,
  "marketing-me-accelerator": MARKETING_RENDERER_IDS.ABHI_PROGRAMMES,
  "marketing-training": MARKETING_RENDERER_IDS.ABHI_COMPLIANCE_TRAINING,
  social: MARKETING_RENDERER_IDS.SOCIAL,
};

function assertNeverAbhiForPlatform(workspace: MarketingWorkspaceKey) {
  for (const view of MARKETING_MODULE_VIEWS) {
    const resolution = resolveMarketingViewForWorkspace(view, workspace);
    assert.ok(resolution, `expected resolution for ${workspace}:${view}`);
    assert.ok(
      !ABHI_RENDERERS.has(resolution.rendererId),
      `${workspace} must not resolve ${view} to ABHI renderer ${resolution.rendererId}`,
    );
  }
}

function assertExpected(
  workspace: MarketingWorkspaceKey,
  expectations: Partial<Record<InternalOperationsView, string>>,
) {
  for (const [view, rendererId] of Object.entries(expectations) as Array<
    [InternalOperationsView, string]
  >) {
    const resolution = resolveMarketingViewForWorkspace(view, workspace);
    assert.equal(
      resolution?.rendererId,
      rendererId,
      `${workspace}:${view} should resolve to ${rendererId}`,
    );
  }
}

function main() {
  resetMarketingWorkspacePacksForTests();
  ensureMarketingWorkspacePacksRegistered();

  assertNeverAbhiForPlatform("internal");
  assertNeverAbhiForPlatform("demo");

  assertExpected("internal", PLATFORM_CENTRAL_VIEWS);
  assertExpected("demo", PLATFORM_CENTRAL_VIEWS);

  for (const view of MARKETING_MODULE_VIEWS) {
    if (view in PLATFORM_CENTRAL_VIEWS) continue;
    const resolution = resolveMarketingViewForWorkspace(view, "internal");
    assert.equal(
      resolution?.rendererId,
      MARKETING_RENDERER_IDS.UNAVAILABLE,
      `internal:${view} should be unavailable`,
    );
  }

  for (const rendererId of Object.values(PLATFORM_CENTRAL_VIEWS)) {
    if (rendererId === MARKETING_RENDERER_IDS.SOCIAL) continue;
    assert.ok(CENTRAL_RENDERERS.has(rendererId) || rendererId === MARKETING_RENDERER_IDS.STAFF_TRAINING);
  }

  assertExpected("onwardair", OA_VIEWS);
  assertExpected("talanton", TALANTON_VIEWS);
  assertExpected("abhi", ABHI_VIEWS);

  for (const view of MARKETING_MODULE_VIEWS) {
    if (view in OA_VIEWS) continue;
    const resolution = resolveMarketingViewForWorkspace(view, "onwardair");
    assert.equal(
      resolution?.rendererId,
      MARKETING_RENDERER_IDS.UNAVAILABLE,
      `onwardair:${view} should be unavailable`,
    );
  }

  console.log("marketing view-resolver.check.ts — all assertions passed");
}

main();
