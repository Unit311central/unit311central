import type { InternalNavSection, InternalOperationsView } from "@/lib/internal-operations-data";

/** Talanton-only operations views (must not appear on Demo / Internal / CorpCentre). */
export const TALANTON_IMPACT_VIEWS = [
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
] as const satisfies readonly InternalOperationsView[];

export type TalantonImpactView = (typeof TALANTON_IMPACT_VIEWS)[number];

export function isTalantonImpactView(view: string | null | undefined): view is TalantonImpactView {
  return (TALANTON_IMPACT_VIEWS as readonly string[]).includes(String(view ?? ""));
}

/** Appended to ops nav only on the Talanton Impact host. */
export const TALANTON_IMPACT_NAV_SECTIONS: InternalNavSection[] = [
  {
    kind: "workspace",
    label: "Portfolio",
    icon: "Building2",
    color: "#1B8A5A",
    items: [
      {
        label: "Portfolio Companies",
        icon: "Building2",
        view: "portfolio-companies",
      },
    ],
  },
  {
    kind: "workspace",
    label: "Impact Training",
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
    color: "#2F80ED",
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
  {
    kind: "workspace",
    label: "Impact Reports",
    icon: "ScrollText",
    color: "#9B51E0",
    items: [
      {
        label: "Portfolio Compliance",
        icon: "ScrollText",
        view: "portfolio-report-compliance",
      },
      {
        label: "Company Compliance",
        icon: "Building2",
        view: "portfolio-report-company",
      },
      {
        label: "Training Completion",
        icon: "GraduationCap",
        view: "portfolio-report-training",
      },
    ],
  },
];
