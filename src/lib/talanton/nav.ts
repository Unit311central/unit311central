import type { InternalNavSection, InternalOperationsView } from "@/lib/internal-operations-data";

/** Talanton-only operations views still used under Portfolio Companies / Training / Intelligence. */
export const TALANTON_IMPACT_VIEWS = [
  "portfolio-dashboard",
  "portfolio-directory",
  "portfolio-company",
  "portfolio-companies",
  "portfolio-intelligence-briefing",
  "portfolio-intelligence-company",
  "impact-intelligence-dashboard",
  "impact-intelligence-company",
  "opportunity-intelligence",
  "funds-dashboard",
  "funds-impact",
  "funds-momentum",
  "funds-stewards",
  "portfolio-courses",
  "portfolio-course-management",
] as const satisfies readonly InternalOperationsView[];

export type TalantonImpactView = (typeof TALANTON_IMPACT_VIEWS)[number];

export function isTalantonImpactView(view: string | null | undefined): view is TalantonImpactView {
  return (TALANTON_IMPACT_VIEWS as readonly string[]).includes(String(view ?? ""));
}

/**
 * Prepended on Talanton host after pin items —
 * Funds, Portfolio Companies, Talanton Intelligence, Board.
 */
export const TALANTON_IMPACT_NAV_SECTIONS: InternalNavSection[] = [
  {
    kind: "workspace",
    label: "Funds",
    icon: "Landmark",
    color: "#1B8A5A",
    items: [
      { label: "Fund Dashboard", icon: "LayoutDashboard", view: "funds-dashboard" },
      { label: "Impact Fund", icon: "Landmark", view: "funds-impact" },
      { label: "Momentum Fund", icon: "BarChart3", view: "funds-momentum" },
      { label: "Stewards Fund", icon: "ShieldCheck", view: "funds-stewards" },
    ],
  },
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
    label: "Talanton Intelligence",
    icon: "Sparkles",
    color: "#1B8A5A",
    items: [
      {
        label: "Portfolio Intelligence",
        icon: "Target",
        children: [
          {
            label: "Executive Briefing",
            view: "portfolio-intelligence-briefing",
          },
          {
            label: "Company Intelligence",
            view: "portfolio-intelligence-company",
          },
        ],
      },
      {
        label: "Impact Intelligence",
        icon: "HeartHandshake",
        children: [
          {
            label: "Impact Dashboard",
            view: "impact-intelligence-dashboard",
          },
          {
            label: "Company Impact",
            view: "impact-intelligence-company",
          },
        ],
      },
      {
        label: "Opportunity Intelligence",
        icon: "Lightbulb",
        view: "opportunity-intelligence",
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
