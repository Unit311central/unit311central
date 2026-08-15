import type { MarketingWorkspaceKey } from "@/lib/marketing/workspace-context";

/** Workspace pack ids that provide social platform configuration. */
export const SOCIAL_WORKSPACE_PACK_IDS = [
  "internal",
  "demo",
  "onwardair",
  "talanton",
  "abhi",
] as const satisfies readonly MarketingWorkspaceKey[];

export type SocialWorkspacePackId = (typeof SOCIAL_WORKSPACE_PACK_IDS)[number];

export const MARKETING_GRANT_GROUP_ID = "marketing-events-central";

export const CENTRAL_MARKETING_GRANT_VIEWS = [
  "social",
  "marketing-newsletter",
  "marketing-events",
  "marketing-event-management",
  "marketing-mailing-list",
  "oa-marketing-dashboard",
  "portfolio-stories",
  "journey-stories",
  "stories-newsletter",
  "stories-media-library",
  "stories-mailing-list",
] as const;
