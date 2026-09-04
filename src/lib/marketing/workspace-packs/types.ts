import type { InternalOperationsView } from "@/lib/internal-operations-data";
import type { MarketingWorkspaceKey } from "@/lib/marketing/workspace-context";

/** Stable renderer ids — mapped to concrete components in MarketingViewHost. */
export const MARKETING_RENDERER_IDS = {
  SOCIAL: "social",
  CENTRAL_DASHBOARD: "central-dashboard",
  CENTRAL_NEWSLETTER: "central-newsletter",
  CENTRAL_MAILING: "central-mailing",
  CENTRAL_EXTERNAL_EVENTS: "central-external-events",
  CENTRAL_MANAGED_EVENTS: "central-managed-events",
  CENTRAL_MEDIA_LIBRARY: "central-media-library",
  CENTRAL_STORIES: "central-stories",
  OA_MARKETING: "oa-marketing",
  ABHI_NEWSLETTER: "abhi-newsletter",
  ABHI_EVENTS: "abhi-events",
  ABHI_CALENDAR_EVENTS: "abhi-calendar-events",
  ABHI_EVENT_MANAGEMENT: "abhi-event-management",
  ABHI_MAILING_LIST: "abhi-mailing-list",
  ABHI_PROGRAMMES: "abhi-programmes",
  ABHI_COMPLIANCE_TRAINING: "abhi-compliance-training",
  STAFF_TRAINING: "staff-training",
  TALANTON_PORTFOLIO_STORIES: "talanton-portfolio-stories",
  TALANTON_JOURNEY_STORIES: "talanton-journey-stories",
  TALANTON_STORIES_NEWSLETTER: "talanton-stories-newsletter",
  TALANTON_MEDIA_LIBRARY: "talanton-media-library",
  TALANTON_STORIES_MAILING_LIST: "talanton-stories-mailing-list",
  GREENDESERT_MARKETING_DASHBOARD: "greendesert-marketing-dashboard",
  GREENDESERT_EXTERNAL_EVENTS: "greendesert-external-events",
  GREENDESERT_EVENT_MANAGEMENT: "greendesert-event-management",
  GREENDESERT_NEWSLETTER: "greendesert-newsletter",
  GREENDESERT_MAILING_LIST: "greendesert-mailing-list",
  GREENDESERT_CLIENT_STORIES: "greendesert-client-stories",
  UNAVAILABLE: "unavailable",
} as const;

export type MarketingRendererId =
  (typeof MARKETING_RENDERER_IDS)[keyof typeof MARKETING_RENDERER_IDS];

export type MarketingViewResolution = {
  rendererId: MarketingRendererId;
  props?: Record<string, unknown>;
  unavailableTitle?: string;
  unavailableMessage?: string;
};

export type MarketingResolveContext = {
  workspaceKey: MarketingWorkspaceKey;
  workspaceSlug?: string | null;
};

export type MarketingWorkspacePack = {
  id: MarketingWorkspaceKey | string;
  label: string;
  workspaceKeys: readonly MarketingWorkspaceKey[];
  resolveView: (
    view: InternalOperationsView,
    ctx: MarketingResolveContext,
  ) => MarketingViewResolution | null;
};
