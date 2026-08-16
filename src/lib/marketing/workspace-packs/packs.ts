import type { InternalOperationsView } from "@/lib/internal-operations-data";
import {
  MARKETING_RENDERER_IDS,
  type MarketingResolveContext,
  type MarketingViewResolution,
  type MarketingWorkspacePack,
} from "./types";

function unavailable(
  view: InternalOperationsView,
  ctx: MarketingResolveContext,
): MarketingViewResolution {
  return {
    rendererId: MARKETING_RENDERER_IDS.UNAVAILABLE,
    unavailableTitle: "Marketing & Events",
    unavailableMessage: `“${view}” is not configured for the ${ctx.workspaceKey} workspace. Enable a workspace Marketing pack or use Social under Business Productivity.`,
  };
}

function centralPlatformPack(
  id: "internal" | "demo",
  label: string,
): MarketingWorkspacePack {
  return {
    id,
    label,
    workspaceKeys: [id],
    resolveView(view, ctx) {
      switch (view) {
        case "social":
          return { rendererId: MARKETING_RENDERER_IDS.SOCIAL };
        case "marketing-training":
          return { rendererId: MARKETING_RENDERER_IDS.STAFF_TRAINING };
        case "oa-marketing-dashboard":
          return { rendererId: MARKETING_RENDERER_IDS.CENTRAL_DASHBOARD };
        case "marketing-newsletter":
        case "stories-newsletter":
          return { rendererId: MARKETING_RENDERER_IDS.CENTRAL_NEWSLETTER };
        case "marketing-events":
          return { rendererId: MARKETING_RENDERER_IDS.CENTRAL_EXTERNAL_EVENTS };
        case "marketing-event-management":
          return { rendererId: MARKETING_RENDERER_IDS.CENTRAL_MANAGED_EVENTS };
        case "marketing-mailing-list":
        case "stories-mailing-list":
          return { rendererId: MARKETING_RENDERER_IDS.CENTRAL_MAILING };
        case "portfolio-stories":
          return {
            rendererId: MARKETING_RENDERER_IDS.CENTRAL_STORIES,
            props: { storyKind: "portfolio" },
          };
        case "journey-stories":
          return {
            rendererId: MARKETING_RENDERER_IDS.CENTRAL_STORIES,
            props: { storyKind: "journey" },
          };
        case "stories-media-library":
          return { rendererId: MARKETING_RENDERER_IDS.CENTRAL_MEDIA_LIBRARY };
        case "marketing-abhi-events":
        case "marketing-working-groups":
        case "marketing-us-accelerator":
        case "marketing-me-accelerator":
          return unavailable(view, ctx);
        default:
          return unavailable(view, ctx);
      }
    },
  };
}

export const internalMarketingPack = centralPlatformPack("internal", "Unit311 Internal");

export const demoMarketingPack: MarketingWorkspacePack = {
  id: "demo",
  label: "Northstar Demo",
  workspaceKeys: ["demo"],
  resolveView(view, ctx) {
    switch (view) {
      case "social":
        return { rendererId: MARKETING_RENDERER_IDS.SOCIAL };
      case "marketing-training":
        return { rendererId: MARKETING_RENDERER_IDS.STAFF_TRAINING };
      case "oa-marketing-dashboard":
        return { rendererId: MARKETING_RENDERER_IDS.CENTRAL_DASHBOARD };
      case "marketing-newsletter":
      case "stories-newsletter":
        return { rendererId: MARKETING_RENDERER_IDS.ABHI_NEWSLETTER };
      case "marketing-events":
        return { rendererId: MARKETING_RENDERER_IDS.ABHI_EVENTS };
      case "marketing-event-management":
        return { rendererId: MARKETING_RENDERER_IDS.ABHI_EVENT_MANAGEMENT };
      case "marketing-mailing-list":
      case "stories-mailing-list":
        return { rendererId: MARKETING_RENDERER_IDS.ABHI_MAILING_LIST };
      case "portfolio-stories":
        return { rendererId: MARKETING_RENDERER_IDS.TALANTON_PORTFOLIO_STORIES };
      case "journey-stories":
        return { rendererId: MARKETING_RENDERER_IDS.TALANTON_JOURNEY_STORIES };
      case "stories-media-library":
        return { rendererId: MARKETING_RENDERER_IDS.TALANTON_MEDIA_LIBRARY };
      case "marketing-abhi-events":
      case "marketing-working-groups":
      case "marketing-us-accelerator":
      case "marketing-me-accelerator":
        return unavailable(view, ctx);
      default:
        return unavailable(view, ctx);
    }
  },
};

export const onwardAirMarketingPack: MarketingWorkspacePack = {
  id: "onwardair",
  label: "OnwardAir",
  workspaceKeys: ["onwardair"],
  resolveView(view) {
    switch (view) {
      case "social":
        return { rendererId: MARKETING_RENDERER_IDS.SOCIAL };
      case "oa-marketing-dashboard":
        return {
          rendererId: MARKETING_RENDERER_IDS.OA_MARKETING,
          props: { page: "dashboard" },
        };
      case "marketing-newsletter":
        return {
          rendererId: MARKETING_RENDERER_IDS.OA_MARKETING,
          props: { page: "newsletter" },
        };
      case "marketing-events":
        return {
          rendererId: MARKETING_RENDERER_IDS.OA_MARKETING,
          props: { page: "events" },
        };
      case "marketing-event-management":
        return {
          rendererId: MARKETING_RENDERER_IDS.OA_MARKETING,
          props: { page: "event-management" },
        };
      case "marketing-mailing-list":
        return {
          rendererId: MARKETING_RENDERER_IDS.OA_MARKETING,
          props: { page: "mailing-list" },
        };
      case "marketing-training":
        return { rendererId: MARKETING_RENDERER_IDS.STAFF_TRAINING };
      default:
        return null;
    }
  },
};

export const abhiMarketingPack: MarketingWorkspacePack = {
  id: "abhi",
  label: "ABHI",
  workspaceKeys: ["abhi"],
  resolveView(view) {
    switch (view) {
      case "social":
        return { rendererId: MARKETING_RENDERER_IDS.SOCIAL };
      case "marketing-newsletter":
        return { rendererId: MARKETING_RENDERER_IDS.ABHI_NEWSLETTER };
      case "marketing-events":
        return { rendererId: MARKETING_RENDERER_IDS.ABHI_EVENTS };
      case "marketing-abhi-events":
        return { rendererId: MARKETING_RENDERER_IDS.ABHI_CALENDAR_EVENTS };
      case "marketing-event-management":
        return { rendererId: MARKETING_RENDERER_IDS.ABHI_EVENT_MANAGEMENT };
      case "marketing-mailing-list":
        return { rendererId: MARKETING_RENDERER_IDS.ABHI_MAILING_LIST };
      case "marketing-working-groups":
        return {
          rendererId: MARKETING_RENDERER_IDS.ABHI_PROGRAMMES,
          props: { mode: "working-groups" },
        };
      case "marketing-us-accelerator":
        return {
          rendererId: MARKETING_RENDERER_IDS.ABHI_PROGRAMMES,
          props: { mode: "us-accelerator" },
        };
      case "marketing-me-accelerator":
        return {
          rendererId: MARKETING_RENDERER_IDS.ABHI_PROGRAMMES,
          props: { mode: "me-accelerator" },
        };
      case "marketing-training":
        return {
          rendererId: MARKETING_RENDERER_IDS.ABHI_COMPLIANCE_TRAINING,
          props: { mode: "courses" },
        };
      default:
        return null;
    }
  },
};

export const talantonMarketingPack: MarketingWorkspacePack = {
  id: "talanton",
  label: "Talanton Impact",
  workspaceKeys: ["talanton"],
  resolveView(view) {
    switch (view) {
      case "social":
        return { rendererId: MARKETING_RENDERER_IDS.SOCIAL };
      case "portfolio-stories":
        return { rendererId: MARKETING_RENDERER_IDS.TALANTON_PORTFOLIO_STORIES };
      case "journey-stories":
        return { rendererId: MARKETING_RENDERER_IDS.TALANTON_JOURNEY_STORIES };
      case "stories-newsletter":
        return { rendererId: MARKETING_RENDERER_IDS.TALANTON_STORIES_NEWSLETTER };
      case "stories-media-library":
        return { rendererId: MARKETING_RENDERER_IDS.TALANTON_MEDIA_LIBRARY };
      case "stories-mailing-list":
        return { rendererId: MARKETING_RENDERER_IDS.TALANTON_STORIES_MAILING_LIST };
      case "marketing-training":
        return { rendererId: MARKETING_RENDERER_IDS.STAFF_TRAINING };
      default:
        return null;
    }
  },
};
