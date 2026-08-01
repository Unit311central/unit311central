import type { InternalNavSection, InternalOperationsView } from "@/lib/internal-operations-data";

/** Talanton-only operations views (must not appear on Demo / Internal / CorpCentre). */
export const TALANTON_IMPACT_VIEWS = [
  "portfolio-dashboard",
  "portfolio-directory",
  "portfolio-company",
  "portfolio-companies",
  "portfolio-courses",
  "portfolio-my-training",
  "portfolio-compliance-dashboard",
  "portfolio-policies",
  "portfolio-risk-register",
  "portfolio-action-tracking",
  "portfolio-report-compliance",
  "portfolio-report-company",
  "portfolio-report-training",
  "portfolio-analytics-performance",
  "portfolio-analytics-revenue",
  "portfolio-analytics-compliance",
  "portfolio-analytics-risk",
  "portfolio-analytics-geo",
  "portfolio-analytics-quarterly",
  "portfolio-quarterly-reporting",
] as const satisfies readonly InternalOperationsView[];

export type TalantonImpactView = (typeof TALANTON_IMPACT_VIEWS)[number];

export function isTalantonImpactView(view: string | null | undefined): view is TalantonImpactView {
  return (TALANTON_IMPACT_VIEWS as readonly string[]).includes(String(view ?? ""));
}

/** Prepended on Talanton host after pin items — Portfolio Companies is primary. */
export const TALANTON_IMPACT_NAV_SECTIONS: InternalNavSection[] = [
  {
    kind: "workspace",
    label: "Portfolio Companies",
    icon: "Building2",
    color: "#1B8A5A",
    items: [
      {
        label: "Portfolio Dashboard",
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
    label: "Quarterly Reporting",
    icon: "ClipboardCheck",
    color: "#9B51E0",
    items: [
      {
        label: "Reporting Hub",
        icon: "ClipboardCheck",
        view: "portfolio-quarterly-reporting",
      },
    ],
  },
  {
    kind: "workspace",
    label: "Analytics",
    icon: "ScrollText",
    color: "#2F80ED",
    items: [
      {
        label: "Portfolio Performance",
        icon: "ScrollText",
        view: "portfolio-analytics-performance",
      },
      {
        label: "Revenue Trends",
        icon: "ScrollText",
        view: "portfolio-analytics-revenue",
      },
      {
        label: "Compliance Dashboard",
        icon: "ShieldCheck",
        view: "portfolio-analytics-compliance",
      },
      {
        label: "Risk Dashboard",
        icon: "Target",
        view: "portfolio-analytics-risk",
      },
      {
        label: "Geographic Portfolio",
        icon: "MapPin",
        view: "portfolio-analytics-geo",
      },
      {
        label: "Quarterly Reporting",
        icon: "ClipboardCheck",
        view: "portfolio-analytics-quarterly",
      },
    ],
  },
  {
    kind: "workspace",
    label: "Portfolio Training",
    icon: "GraduationCap",
    color: "#F2994A",
    items: [
      {
        label: "Portfolio Courses",
        icon: "GraduationCap",
        view: "portfolio-courses",
      },
      {
        label: "My Training",
        icon: "Users",
        view: "portfolio-my-training",
      },
      {
        label: "Compliance Dashboard",
        icon: "LayoutDashboard",
        view: "portfolio-compliance-dashboard",
      },
    ],
  },
  {
    kind: "workspace",
    label: "Governance",
    icon: "ShieldCheck",
    color: "#27AE60",
    items: [
      {
        label: "Policies",
        icon: "ScrollText",
        view: "portfolio-policies",
      },
      {
        label: "Risk Register",
        icon: "Target",
        view: "portfolio-risk-register",
      },
      {
        label: "Action Tracking",
        icon: "ClipboardCheck",
        view: "portfolio-action-tracking",
      },
    ],
  },
];
