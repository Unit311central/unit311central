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
  "annual-impact-report",
  "quarterly-portfolio-update",
  "opportunity-intelligence",
  "portfolio-stories",
  "journey-stories",
  "stories-newsletter",
  "stories-media-library",
  "stories-mailing-list",
  "funds-dashboard",
  "funds-impact",
  "funds-momentum",
  "funds-stewards",
  "funds-investors",
  "funds-commitments",
  "funds-performance",
  "portfolio-courses",
  "portfolio-course-management",
  "learning-library",
  "training-certifications",
  "company-progress",
] as const satisfies readonly InternalOperationsView[];

export type TalantonImpactView = (typeof TALANTON_IMPACT_VIEWS)[number];

export function isTalantonImpactView(view: string | null | undefined): view is TalantonImpactView {
  return (TALANTON_IMPACT_VIEWS as readonly string[]).includes(String(view ?? ""));
}

/**
 * Prepended on Talanton host after pin items —
 * Funds, Portfolio Companies, Talanton Intelligence, Marketing & Stories, Board.
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
      { label: "Investors", icon: "Users", view: "funds-investors" },
      { label: "Capital Commitments", icon: "Wallet", view: "funds-commitments" },
      { label: "Fund Performance", icon: "Target", view: "funds-performance" },
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
          {
            label: "Quarterly Portfolio Update",
            view: "quarterly-portfolio-update",
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
          {
            label: "Annual Impact Report",
            view: "annual-impact-report",
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
    label: "Marketing & Stories",
    icon: "PenLine",
    color: "#1B8A5A",
    items: [
      { label: "Portfolio Stories", icon: "PenLine", view: "portfolio-stories" },
      { label: "Journey Stories", icon: "MapPin", view: "journey-stories" },
      { label: "Digital Newsletter", icon: "Mail", view: "stories-newsletter" },
      { label: "Media Library", icon: "FolderOpen", view: "stories-media-library" },
      { label: "Mailing List Management", icon: "Users", view: "stories-mailing-list" },
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
      { label: "Risk Register", icon: "AlertTriangle", view: "corporate-risk-register" },
      { label: "Board Members", icon: "Users", view: "board-members" },
    ],
  },
];
