import type { InternalOperationsView } from "@/lib/internal-operations-data";

/** Views owned by the central Marketing & Events module resolver. */
export const MARKETING_MODULE_VIEWS = [
  "oa-marketing-dashboard",
  "marketing-newsletter",
  "marketing-events",
  "marketing-abhi-events",
  "marketing-event-management",
  "marketing-working-groups",
  "marketing-us-accelerator",
  "marketing-me-accelerator",
  "marketing-training",
  "marketing-mailing-list",
  "social",
  "portfolio-stories",
  "journey-stories",
  "stories-newsletter",
  "stories-media-library",
  "stories-mailing-list",
] as const satisfies readonly InternalOperationsView[];

export type MarketingModuleView = (typeof MARKETING_MODULE_VIEWS)[number];

const MARKETING_VIEW_SET = new Set<string>(MARKETING_MODULE_VIEWS);

export function isMarketingModuleView(
  view: string | null | undefined,
): view is MarketingModuleView {
  return MARKETING_VIEW_SET.has(String(view ?? ""));
}
