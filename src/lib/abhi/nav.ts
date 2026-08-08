import type { InternalNavSection, InternalOperationsView } from "@/lib/internal-operations-data";

/** ABHI-only Marketing & Events views. */
export const ABHI_MARKETING_VIEWS = [
  "marketing-newsletter",
  "marketing-events",
  "marketing-abhi-events",
  "marketing-event-management",
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

/** ABHI-only Regulatory Intelligence views. */
export const ABHI_REGULATORY_VIEWS = [
  "regulatory-dashboard",
  "regulatory-updates",
  "regulatory-impact",
  "regulatory-alerts",
] as const satisfies readonly InternalOperationsView[];

export type AbhiRegulatoryView = (typeof ABHI_REGULATORY_VIEWS)[number];

export function isAbhiRegulatoryView(view: string | null | undefined): view is AbhiRegulatoryView {
  return (ABHI_REGULATORY_VIEWS as readonly string[]).includes(String(view ?? ""));
}

const ABHI_REGULATORY_NAV_ITEMS: InternalNavSection["items"] = [
  {
    label: "Dashboard",
    icon: "LayoutDashboard",
    view: "regulatory-dashboard",
  },
  {
    label: "Regulatory Updates",
    icon: "ScrollText",
    view: "regulatory-updates",
  },
  {
    label: "Impact Assessments",
    icon: "AlertTriangle",
    view: "regulatory-impact",
  },
  {
    label: "Member Alerts",
    icon: "Users",
    view: "regulatory-alerts",
  },
];

/** Legacy standalone section — items now live under ABHI Intelligence. */
export const ABHI_REGULATORY_NAV_SECTION: InternalNavSection = {
  kind: "workspace",
  label: "Regulatory Intelligence",
  icon: "Landmark",
  color: "#C2185B",
  items: ABHI_REGULATORY_NAV_ITEMS,
};

/** ABHI Intelligence — Member + Regulatory (inserted after Executive Assistant on ABHI host). */
export const ABHI_INTELLIGENCE_NAV_SECTION: InternalNavSection = {
  kind: "workspace",
  label: "ABHI Intelligence",
  icon: "Sparkles",
  color: "#C2185B",
  items: [
    {
      label: "Member Intelligence",
      icon: "Users",
      view: "member-intelligence",
    },
    {
      label: "Regulatory Intelligence",
      icon: "Landmark",
      children: ABHI_REGULATORY_NAV_ITEMS.map((item) => ({
        label: item.label,
        view: item.view!,
      })),
    },
  ],
};

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
      label: "Social",
      icon: "Share2",
      view: "social",
    },
    {
      label: "External Events",
      icon: "CalendarDays",
      view: "marketing-events",
    },
    {
      label: "ABHI Events",
      icon: "CalendarDays",
      view: "marketing-abhi-events",
    },
    {
      label: "Event Management",
      icon: "ClipboardCheck",
      view: "marketing-event-management",
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
