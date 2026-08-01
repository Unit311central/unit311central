import type { InternalNavSection, InternalOperationsView } from "@/lib/internal-operations-data";

/** ABHI-only Marketing & Events views. */
export const ABHI_MARKETING_VIEWS = [
  "marketing-newsletter",
  "marketing-events",
  "marketing-abhi-events",
  "marketing-working-groups",
  "marketing-us-accelerator",
  "marketing-me-accelerator",
  "marketing-training",
  "marketing-mailing-list",
] as const satisfies readonly InternalOperationsView[];

export type AbhiMarketingView = (typeof ABHI_MARKETING_VIEWS)[number];

export function isAbhiMarketingView(view: string | null | undefined): view is AbhiMarketingView {
  return (ABHI_MARKETING_VIEWS as readonly string[]).includes(String(view ?? ""));
}

/** Inserted on ABHI host immediately after Human Resources. */
export const ABHI_MARKETING_NAV_SECTION: InternalNavSection = {
  kind: "workspace",
  label: "Marketing & Events",
  icon: "Share2",
  color: "#E11D48",
  items: [
    {
      label: "Digital Newsletter",
      icon: "Mail",
      view: "marketing-newsletter",
    },
    {
      label: "External Events",
      icon: "CalendarDays",
      children: [
        { label: "Overview", view: "marketing-events" },
        { label: "ABHI Events", view: "marketing-abhi-events" },
      ],
    },
    {
      label: "ABHI Working Groups",
      icon: "Users",
      view: "marketing-working-groups",
    },
    {
      label: "ABHI US Accelerator",
      icon: "Target",
      view: "marketing-us-accelerator",
    },
    {
      label: "ABHI Middle East Accelerator",
      icon: "Globe",
      view: "marketing-me-accelerator",
    },
    {
      label: "Mailing List Management",
      icon: "Mail",
      view: "marketing-mailing-list",
    },
  ],
};
