import type { InternalNavSection, InternalOperationsView } from "@/lib/internal-operations-data";

/** Talanton-only operations views still used under Portfolio Companies / Training. */
export const TALANTON_IMPACT_VIEWS = [
  "portfolio-dashboard",
  "portfolio-directory",
  "portfolio-company",
  "portfolio-companies",
  "portfolio-courses",
  "portfolio-course-management",
] as const satisfies readonly InternalOperationsView[];

export type TalantonImpactView = (typeof TALANTON_IMPACT_VIEWS)[number];

export function isTalantonImpactView(view: string | null | undefined): view is TalantonImpactView {
  return (TALANTON_IMPACT_VIEWS as readonly string[]).includes(String(view ?? ""));
}

/** Prepended on Talanton host after pin items — Portfolio Companies + Board. */
export const TALANTON_IMPACT_NAV_SECTIONS: InternalNavSection[] = [
  {
    kind: "workspace",
    label: "Portfolio Companies",
    icon: "Building2",
    color: "#1B8A5A",
    items: [
      {
        label: "Dashboard",
        icon: "LayoutDashboard",
        view: "portfolio-dashboard",
      },
      {
        label: "Directory",
        icon: "Building2",
        view: "portfolio-directory",
      },
    ],
  },
  {
    kind: "workspace",
    label: "Board",
    icon: "ShieldCheck",
    color: "#1B8A5A",
    items: [
      { label: "Board Dashboard", icon: "LayoutDashboard", view: "board-dashboard" },
      { label: "Board Meetings", icon: "CalendarDays", view: "board-meetings" },
      { label: "Board Decks", icon: "ScrollText", view: "board-pack" },
      { label: "Minutes & Decisions", icon: "ClipboardCheck", view: "board-minutes" },
      { label: "Risk Register", icon: "AlertTriangle", view: "corporate-risk-register" },
      { label: "Board Members", icon: "Users", view: "board-members" },
    ],
  },
];
