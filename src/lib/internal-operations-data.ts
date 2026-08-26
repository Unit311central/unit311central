import type { SurveyOperationsBasePath } from "@/lib/survey-operations-mock-data";
import { buildFinancesNavSection } from "@/lib/finances-nav";
import { EXECUTIVE_ASSISTANT_VISIBLE } from "@/lib/product-surface-flags";
import { buildProjectManagementNavSection } from "@/lib/project-management-nav";
import { buildCentralBusinessCentralNavSection } from "@/lib/platform-workspaces/central-product-nav";
import { buildSalesManagementNavSection } from "@/lib/sales-management-nav";
import {
  DEFAULT_SALES_MANAGEMENT_TAB,
  isSalesManagementTab,
} from "@/lib/sales-management-tabs";

export type InternalOperationsView =
  | "home"
  | "clients"
  | "clients-dashboard"
  | "member-intelligence"
  | "crm"
  | "crm-meetings"
  | "sales-quotes"
  | "crm-questions-test"
  | "connections"
  | "representatives"
  | "office-locations"
  | "corporate-dashboard"
  | "corporate-information"
  | "corporate-company-details"
  | "corporate-cap-table"
  | "corporate-bank-accounts"
  | "corporate-advisers"
  | "corporate-board-directors"
  | "corporate-insurance"
  | "corporate-software"
  | "corporate-contracts"
  | "corporate-risk-register"
  | "board-dashboard"
  | "board-meetings"
  | "board-minutes"
  | "board-members"
  | "financials"
  | "general-ledger"
  | "accounts-receivable"
  | "accounts-payable"
  | "financial-reports"
  | "finances-ar-collections"
  | "finances-ar-reporting"
  | "finances-ap-payments"
  | "finances-expense-approvals"
  | "finances-expense-categories"
  | "finances-banking-cash-position"
  | "finances-banking-reconciliation"
  | "finances-planning-budget"
  | "finances-planning-actual-vs-budget"
  | "finances-planning-cash-flow"
  | "finances-planning-forecast"
  | "finances-planning-kpis"
  | "finances-planning-management-accounts"
  | "opex"
  | "wise"
  | "board-pack"
  | "debtors"
  | "creditors"
  | "expenses"
  | "hr"
  | "hr-dashboard"
  | "hr-org-chart"
  | "hr-recruitment"
  | "hr-leave"
  | "hr-performance"
  | "hr-reports"
  | "hr-payroll"
  | "strategy"
  | "potential-clients"
  | "whiteboard"
  | "competitors"
  | "assets"
  | "inventory-management"
  | "procurement"
  | "fleet"
  | "testing"
  | "qa-tasks"
  | "projects"
  | "projects-dashboard"
  | "projects-internal"
  | "projects-external"
  | "grants"
  | "recent-missions"
  | "webodm"
  | "messaging"
  | "communications"
  | "social"
  | "settings"
  | "billing"
  | "calendar"
  | "info-email"
  | "files"
  | "files-internal"
  | "files-external"
  | "files-client"
  | "productivity-dashboard"
  | "unit311-details"
  | "information-repository"
  | "module-go-live"
  | "users"
  | "users-external"
  | "external-client-access"
  | "support"
  | "support-overview"
  | "support-mine"
  | "whatsapp-integration"
  | "telemetry"
  | "design-mockups"
  | "sector"
  | "training"
  | "training-dashboard"
  | "course-builder"
  | "training-external"
  | "logistics"
  | "client-onboarding"
  | "quality-management"
  | "qms-training"
  | "qms-document-control"
  | "qms-capa"
  | "qms-internal-audits"
  | "qms-management-review"
  | "qms-reports"
  | "profile"
  | "appearance"
  | "executive-assistant"
  | "demo-company-intelligence"
  | "demo-client-intelligence"
  | "demo-market-intelligence"
  | "platform-analytics"
  | "website-analytics"
  | "system-health"
  | "workspaces-overview"
  | "workspaces-new"
  | "website-management"
  | "website-uk-pavilion"
  | "integrations"
  | "unit311-support"
  | "unit311-platform-support"
  | "engineering"
  | "engineering-dashboard"
  | "engineering-programs"
  | "engineering-resources"
  | "engineering-capacity"
  | "engineering-risks"
  | "engineering-technical-files"
  | "engineering-sops"
  | "engineering-sops-dashboard"
  | "engineering-sops-library"
  | "engineering-sops-tasks"
  | "engineering-sops-runs"
  | "engineering-sops-reviews"
  | "engineering-sops-templates"
  | "engineering-sops-reports"
  | "technology"
  | "technology-dashboard"
  | "technology-architecture"
  | "technology-devices"
  | "technology-software-dashboard"
  | "technology-software"
  | "technology-telecommunications"
  | "technology-infrastructure"
  | "technology-reports"
  | "technology-settings"
  | "portfolio-companies"
  | "portfolio-dashboard"
  | "portfolio-directory"
  | "portfolio-portal-overview"
  | "portfolio-company"
  | "portfolio-intelligence-briefing"
  | "portfolio-intelligence-company"
  | "impact-intelligence-dashboard"
  | "impact-intelligence-company"
  | "annual-impact-report"
  | "quarterly-portfolio-update"
  | "opportunity-intelligence"
  | "portfolio-stories"
  | "journey-stories"
  | "stories-newsletter"
  | "stories-media-library"
  | "stories-mailing-list"
  | "funds-dashboard"
  | "funds-impact"
  | "funds-momentum"
  | "funds-stewards"
  | "funds-investors"
  | "funds-commitments"
  | "funds-performance"
  | "portfolio-courses"
  | "portfolio-course-management"
  | "learning-library"
  | "training-certifications"
  | "company-progress"
  | "portfolio-my-training"
  | "portfolio-compliance-dashboard"
  | "portfolio-policies"
  | "portfolio-risk-register"
  | "portfolio-action-tracking"
  | "portfolio-report-compliance"
  | "portfolio-report-company"
  | "portfolio-report-training"
  | "portfolio-analytics-performance"
  | "portfolio-analytics-revenue"
  | "portfolio-analytics-compliance"
  | "portfolio-analytics-risk"
  | "portfolio-analytics-geo"
  | "portfolio-analytics-quarterly"
  | "portfolio-quarterly-reporting"
  | "marketing-newsletter"
  | "marketing-events"
  | "marketing-abhi-events"
  | "marketing-event-management"
  | "marketing-working-groups"
  | "marketing-us-accelerator"
  | "marketing-me-accelerator"
  | "marketing-training"
  | "marketing-mailing-list"
  | "regulatory-dashboard"
  | "regulatory-updates"
  | "regulatory-impact"
  | "regulatory-alerts"
  | "oa-test-plans"
  | "oa-test-runs"
  | "oa-defects"
  | "oa-uat-tracking"
  | "oa-platform-health"
  | "oa-monitoring"
  | "oa-incident-management"
  | "oa-change-management"
  | "oa-release-tracking"
  | "operations-dashboard"
  | "fundraising-dashboard"
  | "fundraising-investors"
  | "fundraising-cap-table"
  | "fundraising-pipeline"
  | "fundraising-meetings"
  | "fundraising-pitch-decks"
  | "fundraising-data-rooms"
  | "oa-engineering-overview"
  | "oa-programs-milestones"
  | "oa-team-capacity"
  | "oa-supply-dependencies"
  | "oa-assurance-certification"
  | "oa-engineering-risks"
  | "oa-engineering-integrations"
  | "oa-ip-overview"
  | "oa-ip-dashboard"
  | "oa-ip-register"
  | "oa-ip-portfolio"
  | "oa-ip-documents"
  | "oa-ip-search"
  | "oa-competitor-intelligence"
  | "oa-ecosystem-partners"
  | "oa-marketing-dashboard"
  | "business-central-dashboard"
  | "management"
  | "content-studio"
  | "internal-work-packages"
  | "sales-management"
  | "saec-installations-dashboard"
  | "saec-installations-elevators"
  | "saec-installations-escalators";

/** App Router folder path (middleware may rewrite `/` → this on the internal host). */
export const INTERNAL_OPERATIONS_APP_PATH = "/internaldashboard";

/**
 * Browser URL base for the internal app.
 * On internal.unit311central.com this is `/`; locally it stays `/internaldashboard`.
 */
export const INTERNAL_OPERATIONS_BASE_PATH: SurveyOperationsBasePath =
  "/internaldashboard";

export const INTERNAL_GRANTS_OPERATIONS_BASE_PATH: SurveyOperationsBasePath =
  "/internaldashboard_grants";

export function resolveInternalOperationsBasePath(
  hostname?: string | null,
): SurveyOperationsBasePath {
  const host = (hostname ?? "").split(":")[0].trim().toLowerCase();
  if (host === "internal.unit311central.com" || host === "internal.localhost") {
    return "/";
  }
  // Demo uses the same public /dashboard shell as customer workspace hosts.
  // Links must not use /?view=… — demo apex / clears dc_platform_session in middleware.
  if (host === "demo.unit311central.com" || host === "demo.localhost") {
    return "/dashboard";
  }
  // Customer workspace hosts use /dashboard as the public app URL.
  if (
    host.endsWith(".unit311central.com") &&
    host !== "unit311central.com" &&
    host !== "www.unit311central.com" &&
    host !== "internal.unit311central.com" &&
    host !== "demo.unit311central.com"
  ) {
    return "/dashboard";
  }
  if (
    host.endsWith(".localhost") &&
    host !== "localhost" &&
    host !== "internal.localhost" &&
    host !== "demo.localhost"
  ) {
    return "/dashboard";
  }
  return INTERNAL_OPERATIONS_BASE_PATH;
}

export const internalOperationsViews: InternalOperationsView[] = [
  "home",
  "clients",
  "clients-dashboard",
  "member-intelligence",
  "crm",
  "crm-meetings",
  "sales-quotes",
  "crm-questions-test",
  "connections",
  "representatives",
  "office-locations",
  "corporate-dashboard",
  "corporate-information",
  "corporate-company-details",
  "corporate-cap-table",
  "corporate-bank-accounts",
  "corporate-advisers",
  "corporate-board-directors",
  "corporate-insurance",
  "corporate-software",
  "corporate-contracts",
  "corporate-risk-register",
  "board-dashboard",
  "board-meetings",
  "board-minutes",
  "board-members",
  "financials",
  "general-ledger",
  "accounts-receivable",
  "accounts-payable",
  "financial-reports",
  "finances-ar-collections",
  "finances-ar-reporting",
  "finances-ap-payments",
  "finances-expense-approvals",
  "finances-expense-categories",
  "finances-banking-cash-position",
  "finances-banking-reconciliation",
  "finances-planning-budget",
  "finances-planning-actual-vs-budget",
  "finances-planning-cash-flow",
  "finances-planning-forecast",
  "finances-planning-kpis",
  "finances-planning-management-accounts",
  "opex",
  "wise",
  "board-pack",
  "debtors",
  "creditors",
  "expenses",
  "hr",
  "hr-dashboard",
  "hr-org-chart",
  "hr-recruitment",
  "hr-leave",
  "hr-performance",
  "hr-reports",
  "hr-payroll",
  "strategy",
  "potential-clients",
  "whiteboard",
  "competitors",
  "assets",
  "inventory-management",
  "procurement",
  "fleet",
  "testing",
  "qa-tasks",
  "projects",
  "projects-dashboard",
  "projects-internal",
  "projects-external",
  "grants",
  "recent-missions",
  "webodm",
  "messaging",
  "communications",
  "social",
  "settings",
  "billing",
  "calendar",
  "info-email",
  "files",
  "files-internal",
  "files-external",
  "files-client",
  "productivity-dashboard",
  "unit311-details",
  "information-repository",
  "module-go-live",
  "users",
  "users-external",
  "external-client-access",
  "support",
  "support-overview",
  "support-mine",
  "whatsapp-integration",
  "telemetry",
  "design-mockups",
  "sector",
  "training",
  "training-dashboard",
  "course-builder",
  "training-external",
  "logistics",
  "client-onboarding",
  "quality-management",
  "qms-training",
  "qms-document-control",
  "qms-capa",
  "qms-internal-audits",
  "qms-management-review",
  "qms-reports",
  "profile",
  "appearance",
  "executive-assistant",
  "demo-company-intelligence",
  "demo-client-intelligence",
  "demo-market-intelligence",
  "platform-analytics",
  "website-analytics",
  "system-health",
  "workspaces-overview",
  "workspaces-new",
  "website-management",
  "website-uk-pavilion",
  "integrations",
  "unit311-support",
  "unit311-platform-support",
  "engineering",
  "engineering-dashboard",
  "engineering-programs",
  "engineering-resources",
  "engineering-capacity",
  "engineering-risks",
  "engineering-technical-files",
  "engineering-sops",
  "engineering-sops-dashboard",
  "engineering-sops-library",
  "engineering-sops-tasks",
  "engineering-sops-runs",
  "engineering-sops-reviews",
  "engineering-sops-templates",
  "engineering-sops-reports",
  "technology",
  "technology-dashboard",
  "technology-architecture",
  "technology-devices",
  "technology-software-dashboard",
  "technology-software",
  "technology-telecommunications",
  "technology-infrastructure",
  "technology-reports",
  "technology-settings",
  "portfolio-companies",
  "portfolio-dashboard",
  "portfolio-directory",
  "portfolio-portal-overview",
  "portfolio-company",
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
  "marketing-newsletter",
  "marketing-events",
  "marketing-abhi-events",
  "marketing-event-management",
  "marketing-working-groups",
  "marketing-us-accelerator",
  "marketing-me-accelerator",
  "marketing-training",
  "marketing-mailing-list",
  "regulatory-dashboard",
  "regulatory-updates",
  "regulatory-impact",
  "regulatory-alerts",
  "oa-test-plans",
  "oa-test-runs",
  "oa-defects",
  "oa-uat-tracking",
  "oa-platform-health",
  "oa-monitoring",
  "oa-incident-management",
  "oa-change-management",
  "oa-release-tracking",
  "operations-dashboard",
  "saec-installations-dashboard",
  "saec-installations-elevators",
  "saec-installations-escalators",
  "fundraising-dashboard",
  "fundraising-investors",
  "fundraising-cap-table",
  "fundraising-pipeline",
  "fundraising-meetings",
  "fundraising-pitch-decks",
  "fundraising-data-rooms",
  "oa-engineering-overview",
  "oa-programs-milestones",
  "oa-team-capacity",
  "oa-supply-dependencies",
  "oa-assurance-certification",
  "oa-engineering-risks",
  "oa-engineering-integrations",
  "oa-ip-overview",
  "oa-ip-dashboard",
  "oa-ip-register",
  "oa-ip-portfolio",
  "oa-ip-documents",
  "oa-ip-search",
  "oa-competitor-intelligence",
  "oa-ecosystem-partners",
  "oa-marketing-dashboard",
  "business-central-dashboard",
  "management",
  "content-studio",
  "internal-work-packages",
  "sales-management",
  "saec-installations-dashboard",
  "saec-installations-elevators",
  "saec-installations-escalators",
];

/** Nav aliases that share one implementation until modules are redesigned. */
export const PROJECTS_NAV_VIEWS = [
  "projects",
  "projects-dashboard",
  "projects-internal",
  "projects-external",
] as const satisfies readonly InternalOperationsView[];

export const ENGINEERING_NAV_VIEWS = [
  "engineering",
  "engineering-dashboard",
  "engineering-programs",
  "engineering-resources",
  "engineering-capacity",
  "engineering-risks",
  "engineering-technical-files",
  "engineering-sops",
  "engineering-sops-dashboard",
  "engineering-sops-library",
  "engineering-sops-tasks",
  "engineering-sops-runs",
  "engineering-sops-reviews",
  "engineering-sops-templates",
  "engineering-sops-reports",
] as const satisfies readonly InternalOperationsView[];

export const TECHNOLOGY_NAV_VIEWS = [
  "technology",
  "technology-dashboard",
  "technology-architecture",
  "technology-devices",
  "technology-software-dashboard",
  "technology-software",
  "technology-telecommunications",
] as const satisfies readonly InternalOperationsView[];

export const ASSETS_NAV_VIEWS = [
  "operations-dashboard",
  "assets",
  "inventory-management",
  "procurement",
  "logistics",
] as const satisfies readonly InternalOperationsView[];

export const FUNDRAISING_NAV_VIEWS = [
  "fundraising-dashboard",
  "fundraising-investors",
  "fundraising-cap-table",
  "fundraising-pipeline",
  "fundraising-meetings",
  "fundraising-pitch-decks",
  "fundraising-data-rooms",
] as const satisfies readonly InternalOperationsView[];

export const OA_ENGINEERING_NAV_VIEWS = [
  "oa-engineering-overview",
  "oa-programs-milestones",
  "oa-team-capacity",
  "oa-assurance-certification",
  "oa-engineering-risks",
  "oa-engineering-integrations",
  "engineering-technical-files",
] as const satisfies readonly InternalOperationsView[];

export function isProjectsNavView(view: InternalOperationsView): boolean {
  return (PROJECTS_NAV_VIEWS as readonly string[]).includes(view);
}

export function isEngineeringNavView(view: InternalOperationsView): boolean {
  return (ENGINEERING_NAV_VIEWS as readonly string[]).includes(view);
}

export function isTechnologyNavView(view: InternalOperationsView): boolean {
  return (TECHNOLOGY_NAV_VIEWS as readonly string[]).includes(view);
}

export function isAssetsNavView(view: InternalOperationsView): boolean {
  return (ASSETS_NAV_VIEWS as readonly string[]).includes(view);
}

export function isInternalOperationsView(value: string | null): value is InternalOperationsView {
  return internalOperationsViews.includes(value as InternalOperationsView);
}

/** Corporate Information workspace tabs (UI shell only — APIs remain per capability). */
export const CORPORATE_INFORMATION_TABS = [
  { key: "company-details", label: "Company Details" },
  { key: "cap-table", label: "Cap Table" },
  { key: "office-locations", label: "Office Locations" },
  { key: "bank-accounts", label: "Bank Accounts" },
  { key: "board-directors", label: "Board of Directors" },
  { key: "professional-advisors", label: "Professional Advisors" },
  { key: "contracts", label: "Contracts" },
] as const;

export type CorporateInformationTab = (typeof CORPORATE_INFORMATION_TABS)[number]["key"];

export function isCorporateInformationTab(value: string | null): value is CorporateInformationTab {
  return CORPORATE_INFORMATION_TABS.some((tab) => tab.key === value);
}

/** Legacy leaf views that now open the tabbed Corporate Information workspace. */
export function legacyCorporateViewToTab(
  view: string | null,
): CorporateInformationTab | null {
  switch (view) {
    case "corporate-company-details":
      return "company-details";
    case "office-locations":
      return "office-locations";
    case "corporate-bank-accounts":
      return "bank-accounts";
    case "corporate-advisers":
      return "professional-advisors";
    case "corporate-board-directors":
      return "board-directors";
    case "corporate-contracts":
      return "contracts";
    default:
      return null;
  }
}

/** Map Corporate Information tab → leaf view id (for chrome titles / breadcrumbs). */
export function corporateTabToLegacyView(
  tab: CorporateInformationTab,
): InternalOperationsView {
  switch (tab) {
    case "company-details":
      return "corporate-company-details";
    case "office-locations":
      return "office-locations";
    case "bank-accounts":
      return "corporate-bank-accounts";
    case "professional-advisors":
      return "corporate-advisers";
    case "board-directors":
      return "corporate-board-directors";
    case "contracts":
      return "corporate-contracts";
    case "cap-table":
      return "corporate-cap-table";
  }
}

export function normalizeInternalOperationsView(value: string | null): InternalOperationsView {
  if (value === "live-projects") return "projects";
  if (value === "sector-mining") return "sector";
  if (value === "files") return "productivity-dashboard";
  if (value === "debtors") return "accounts-receivable";
  if (value === "creditors") return "accounts-payable";
  if (value === "opex") return "financials";
  if (value === "voice-video" || value === "voice-and-video") {
    return "communications";
  }
  // Software Licences moved from Corporate Information → Technology Management.
  if (value === "corporate-software" || value === "software-licences") {
    return "technology-software";
  }
  if (value === "technology") return "technology-dashboard";
  if (value === "portfolio-companies") return "portfolio-dashboard";
  // Keep corporate leaf ids (company details, offices, …) so breadcrumbs/titles stay correct.
  return isInternalOperationsView(value) ? value : "home";
}

/** Views that use non-durable mock/seed data — show Demo badge + banner.
 * Cleared: operators asked to drop Demo labels from the product surface.
 * Persistence honesty is tracked in Module Go-Live, not nav Demo pills.
 */
export const DEMO_OPERATIONS_VIEWS: ReadonlySet<InternalOperationsView> = new Set([]);

/** Banner for nav leaves that reuse an existing module. */
export function getNavImplementationNotice(
  view: InternalOperationsView,
): "demo" | "uses-current" | "coming-soon" | null {
  if (DEMO_OPERATIONS_VIEWS.has(view)) return "demo";
  return null;
}

export type InternalNavChildItem = {
  readonly label: string;
  readonly view?: InternalOperationsView;
  readonly href?: string;
  readonly query?: Record<string, string>;
  /** Nested groups (e.g. Clients → Dashboard). */
  readonly children?: readonly InternalNavChildItem[];
  /** Honest product surface: demo / non-durable data. */
  readonly badge?: "demo";
};

export type InternalNavItem = {
  readonly label: string;
  readonly icon: string;
  readonly view?: InternalOperationsView;
  readonly href?: string;
  readonly query?: Record<string, string>;
  readonly indented?: boolean;
  readonly children?: readonly InternalNavChildItem[];
  readonly badge?: "demo";
};

export type InternalNavSection = {
  readonly label: string | null;
  /** Pin items sit above workspace cards (Home, Executive Assistant). */
  readonly kind?: "pin" | "workspace";
  /** Workspace card accent colour. */
  readonly color?: string;
  /** Workspace card header icon (Lucide name). */
  readonly icon?: string;
  /** When true, nested nav parents under this module stay expanded (Finances catalogue). */
  readonly expandChildrenByDefault?: boolean;
  readonly items: readonly InternalNavItem[];
};

export const internalSurveyNavSections: readonly InternalNavSection[] = [
  {
    kind: "pin",
    label: null,
    color: "#2F80ED",
    items: [{ label: "HOME", icon: "LayoutDashboard", view: "home" as const }],
  },
  ...(EXECUTIVE_ASSISTANT_VISIBLE
    ? [
        {
          kind: "pin" as const,
          label: null,
          /** Distinct mint — not used by other modules. */
          color: "#12B886",
          items: [
            {
              label: "EXECUTIVE ASSISTANT",
              icon: "Bot",
              view: "executive-assistant" as const,
            },
          ],
        } satisfies InternalNavSection,
      ]
    : []),
  buildCentralBusinessCentralNavSection(),
  buildProjectManagementNavSection({ includeGrants: true }),
  buildSalesManagementNavSection(),
  buildFinancesNavSection(),
  {
    kind: "workspace",
    label: "Human Resources",
    icon: "Users",
    color: "#DB2777",
    items: [
      { label: "Dashboard", icon: "LayoutDashboard", view: "hr-dashboard" as const },
      { label: "Employees", icon: "Users", view: "hr" as const },
      { label: "Org Chart", icon: "Network", view: "hr-org-chart" as const },
      {
        label: "Recruitment",
        icon: "ContactRound",
        view: "hr-recruitment" as const,
      },
      {
        label: "Time & Attendance",
        icon: "CalendarDays",
        view: "hr-leave" as const,
      },
      { label: "Payroll", icon: "Wallet", view: "hr-payroll" as const },
      {
        label: "Performance",
        icon: "Target",
        view: "hr-performance" as const,
      },
      {
        label: "HR Reports",
        icon: "ScrollText",
        view: "hr-reports" as const,
      },
    ],
  },
  {
    kind: "workspace",
    label: "Corporate Information",
    icon: "Building2",
    color: "#78716C",
    items: [
      { label: "Dashboard", icon: "LayoutDashboard", view: "corporate-dashboard" as const },
      {
        label: "Cap Table Management",
        icon: "Layers",
        view: "corporate-cap-table" as const,
      },
      { label: "Company Details", icon: "Building2", view: "corporate-company-details" as const },
      {
        label: "Office Locations",
        icon: "MapPin",
        view: "office-locations" as const,
      },
      {
        label: "Bank Accounts",
        icon: "Landmark",
        view: "corporate-bank-accounts" as const,
      },
      {
        label: "Board of Directors",
        icon: "Users",
        view: "corporate-board-directors" as const,
      },
      {
        label: "Professional Advisors",
        icon: "Handshake",
        view: "corporate-advisers" as const,
      },
      {
        label: "Contracts",
        icon: "ScrollText",
        view: "corporate-contracts" as const,
      },
      {
        label: "Risk Register",
        icon: "AlertTriangle",
        view: "corporate-risk-register" as const,
      },
      {
        label: "Board deck",
        icon: "ScrollText",
        view: "board-pack" as const,
      },
      {
        label: "Board Meetings",
        icon: "CalendarDays",
        view: "board-meetings" as const,
      },
      {
        label: "Unit311 Details",
        icon: "ShieldCheck",
        children: [
          { label: "Dashboard", view: "unit311-details" as const },
          { label: "Module Go-Live", view: "module-go-live" as const },
        ],
      },
    ],
  },
  {
    kind: "workspace",
    label: "Technology Management",
    icon: "Cpu",
    color: "#4F46E5",
    items: [
      { label: "Dashboard", icon: "LayoutDashboard", view: "technology-dashboard" as const },
      { label: "Architecture Diagrams", icon: "Network", view: "technology-architecture" as const },
      { label: "Technology Assets", icon: "Laptop", view: "technology-devices" as const },
      {
        label: "Software & SaaS Dashboard",
        icon: "BarChart3",
        view: "technology-software-dashboard" as const,
      },
      { label: "Software & SaaS", icon: "KeyRound", view: "technology-software" as const },
      {
        label: "Telecommunications",
        icon: "Radio",
        view: "technology-telecommunications" as const,
      },
    ],
  },
  {
    kind: "workspace",
    label: "Business Productivity",
    icon: "MessageSquare",
    color: "#0891B2",
    items: [
      { label: "Dashboard", icon: "LayoutDashboard", view: "productivity-dashboard" as const },
      { label: "Content Studio", icon: "Presentation", view: "content-studio" as const },
      {
        label: "Internal Work Packages",
        icon: "ClipboardList",
        view: "internal-work-packages" as const,
      },
      {
        label: "File Explorer",
        icon: "FolderOpen",
        children: [
          { label: "Internal Files", view: "files-internal" as const },
          { label: "External Files", view: "files-external" as const },
          { label: "Client Explorer", view: "files-client" as const },
        ],
      },
      { label: "Email", icon: "Mail", view: "info-email" as const },
      { label: "Calendar", icon: "CalendarDays", view: "calendar" as const },
      { label: "Messaging", icon: "MessageSquare", view: "messaging" as const },
      { label: "Communications", icon: "Video", view: "communications" as const },
      { label: "Social", icon: "Share2", view: "social" as const },
      { label: "Whiteboard", icon: "PenLine", view: "whiteboard" as const },
    ],
  },
  {
    kind: "workspace",
    label: "Support Desk",
    icon: "LifeBuoy",
    /** Alert red — distinct from BP cyan (#0891B2) and Ops sky (#0284C7). */
    color: "#DC2626",
    items: [
      { label: "Ticket Overview", icon: "BarChart3", view: "support-overview" as const },
      { label: "Tickets", icon: "Ticket", view: "support" as const },
      { label: "My support tickets", icon: "UserRound", view: "support-mine" as const },
      { label: "WhatsApp Integration", icon: "MessageCircle", view: "whatsapp-integration" as const },
    ],
  },
  {
    kind: "workspace",
    label: "Operations",
    icon: "Package",
    color: "#0284C7",
    items: [
      { label: "Dashboard", icon: "LayoutDashboard", view: "operations-dashboard" as const },
      { label: "Assets", icon: "Package", view: "assets" as const },
      {
        label: "Inventory",
        icon: "Layers",
        view: "inventory-management" as const,
      },
      {
        label: "Procurement",
        icon: "Receipt",
        view: "procurement" as const,
      },
      { label: "Logistics", icon: "Truck", view: "logistics" as const },
    ],
  },
  {
    kind: "workspace",
    label: "Training",
    icon: "GraduationCap",
    color: "#CA8A04",
    items: [
      {
        label: "Dashboard",
        icon: "LayoutDashboard",
        view: "training-dashboard" as const,
      },
      {
        label: "Course Builder",
        icon: "Sparkles",
        view: "course-builder" as const,
      },
      {
        label: "Courses",
        icon: "GraduationCap",
        children: [
          { label: "Staff Courses", view: "training" as const },
          { label: "External Courses", view: "training-external" as const },
          { label: "QMS Courses", view: "qms-training" as const },
        ],
      },
    ],
  },
  {
    kind: "workspace",
    label: "QMS",
    icon: "ShieldCheck",
    color: "#65A30D",
    items: [
      {
        label: "Dashboard",
        icon: "LayoutDashboard",
        view: "quality-management" as const,
      },
      {
        label: "Document Control",
        icon: "ScrollText",
        view: "qms-document-control" as const,
      },
      { label: "CAPA", icon: "Target", view: "qms-capa" as const },
      {
        label: "Internal Audits",
        icon: "ClipboardCheck",
        view: "qms-internal-audits" as const,
      },
      {
        label: "Management Review",
        icon: "Users",
        view: "qms-management-review" as const,
      },
      {
        label: "Reporting",
        icon: "ScrollText",
        view: "qms-reports" as const,
      },
    ],
  },
  {
    kind: "workspace",
    label: "Tools",
    icon: "FlaskConical",
    color: "#6C63FF",
    items: [
      {
        label: "Website Management",
        icon: "Globe",
        view: "website-management" as const,
      },
      { label: "Integrations", icon: "Plug", view: "integrations" as const },
      { label: "Testing", icon: "FlaskConical", view: "testing" as const },
      { label: "Telemetry", icon: "Radio", view: "telemetry" as const },
      { label: "Users", icon: "Users", view: "users" as const },
      {
        label: "Unit311 Support",
        icon: "Headphones",
        view: "unit311-support" as const,
      },
    ],
  },
  {
    kind: "workspace",
    label: "External Client Access",
    icon: "KeyRound",
    /** Deep teal — not Tools/Settings purple cluster. */
    color: "#0F766E",
    items: [
      {
        label: "Dashboard",
        icon: "LayoutDashboard",
        view: "external-client-access" as const,
      },
      { label: "External Users", icon: "Users", view: "users-external" as const },
    ],
  },
  {
    kind: "workspace",
    label: "Settings",
    icon: "Settings",
    /** Slate — not Tools purple (#6C63FF). */
    color: "#64748B",
    items: [
      { label: "Profile", icon: "Users", view: "profile" as const },
      { label: "General", icon: "Settings", view: "settings" as const },
      { label: "Billing", icon: "Wallet", view: "billing" as const },
      { label: "Appearance", icon: "Layers", view: "appearance" as const },
    ],
  },
];

export const internalSurveyNavItems: InternalNavItem[] = internalSurveyNavSections.flatMap(
  (section) => [...section.items],
);

export const internalViewTitles: Record<
  InternalOperationsView,
  { title: string; subtitle: string }
> = {
  home: { title: "Home", subtitle: "Executive Dashboard" },
  clients: { title: "Client Directory", subtitle: "Clients" },
  "clients-dashboard": { title: "Dashboard", subtitle: "Clients" },
  "member-intelligence": { title: "Member Intelligence", subtitle: "ABHI Intelligence" },
  crm: { title: "Pipeline", subtitle: "Customer Management" },
  "crm-meetings": {
    title: "Discovery",
    subtitle: "Customer Management",
  },
  "sales-quotes": {
    title: "Sales Quotes",
    subtitle: "Customer Management",
  },
  "crm-questions-test": {
    title: "CRM Discovery Questions (Test)",
    subtitle: "Internal test workspace",
  },
  connections: { title: "Connections", subtitle: "Internal Operations" },
  representatives: { title: "Partners", subtitle: "Sales Management" },
  "office-locations": { title: "Office Locations", subtitle: "Corporate Information" },
  "corporate-dashboard": { title: "Dashboard", subtitle: "Corporate Information" },
  "corporate-information": { title: "Company Details", subtitle: "Corporate Information" },
  "corporate-company-details": { title: "Company Information", subtitle: "Corporate Information" },
  "corporate-cap-table": { title: "Cap Table Management", subtitle: "Corporate Information" },
  "corporate-bank-accounts": { title: "Bank Accounts", subtitle: "Corporate Information" },
  "corporate-board-directors": { title: "Board of Directors", subtitle: "Corporate Information" },
  "corporate-advisers": { title: "Professional Advisors", subtitle: "Corporate Information" },
  "corporate-insurance": { title: "Insurance", subtitle: "Corporate Information" },
  "corporate-software": { title: "Software", subtitle: "Technology Management" },
  "corporate-contracts": { title: "Contracts", subtitle: "Corporate Information" },
  "corporate-risk-register": { title: "Risk Register", subtitle: "Corporate Information" },
  "board-dashboard": { title: "Board Dashboard", subtitle: "Board" },
  "board-meetings": { title: "Board Meetings", subtitle: "Board" },
  "board-minutes": { title: "Minutes & Decisions", subtitle: "Board" },
  "board-members": { title: "Board Members", subtitle: "Board" },
  financials: { title: "Dashboard", subtitle: "Finances" },
  "general-ledger": { title: "General Ledger", subtitle: "Finances · Accounting" },
  "accounts-receivable": { title: "Accounts Receivable", subtitle: "Finances" },
  "accounts-payable": { title: "Accounts Payable", subtitle: "Finances" },
  "financial-reports": { title: "Financial Reports", subtitle: "Finances" },
  "finances-ar-collections": { title: "Collections", subtitle: "Finances · Accounts Receivable" },
  "finances-ar-reporting": { title: "AR Reporting", subtitle: "Finances · Accounts Receivable" },
  "finances-ap-payments": { title: "Payments", subtitle: "Finances · Accounts Payable" },
  "finances-expense-approvals": { title: "Approvals", subtitle: "Finances · Expenses" },
  "finances-expense-categories": { title: "Categories", subtitle: "Finances · Expenses" },
  "finances-banking-cash-position": { title: "Cash Position", subtitle: "Finances · Banking & Cash" },
  "finances-banking-reconciliation": { title: "Reconciliation", subtitle: "Finances · Banking & Cash" },
  "finances-planning-budget": { title: "Budget", subtitle: "Finances · Planning & Management" },
  "finances-planning-actual-vs-budget": {
    title: "Actual vs Budget",
    subtitle: "Finances · Planning & Management",
  },
  "finances-planning-cash-flow": { title: "Cash Flow", subtitle: "Finances · Planning & Management" },
  "finances-planning-forecast": { title: "Forecast", subtitle: "Finances · Planning & Management" },
  "finances-planning-kpis": { title: "Financial KPIs", subtitle: "Finances · Planning & Management" },
  "finances-planning-management-accounts": {
    title: "Management Accounts",
    subtitle: "Finances · Planning & Management",
  },
  opex: { title: "Opex", subtitle: "Finances" },
  wise: { title: "Bank", subtitle: "Finances · Banking & Cash" },
  "board-pack": { title: "Board deck", subtitle: "Corporate Information" },
  debtors: { title: "Accounts Receivable", subtitle: "Finances" },
  creditors: { title: "Accounts Payable", subtitle: "Finances" },
  expenses: { title: "Expenses", subtitle: "Finances" },
  hr: { title: "Employees", subtitle: "Human Resources" },
  "hr-dashboard": { title: "Dashboard", subtitle: "Human Resources" },
  "hr-org-chart": { title: "Org Chart", subtitle: "Human Resources" },
  "hr-recruitment": { title: "Recruitment", subtitle: "Human Resources" },
  "hr-leave": { title: "Time & Attendance", subtitle: "Human Resources" },
  "hr-performance": { title: "Performance", subtitle: "Human Resources" },
  "hr-reports": { title: "HR Reports", subtitle: "Human Resources" },
  "hr-payroll": { title: "Payroll", subtitle: "Human Resources" },
  strategy: { title: "Strategy", subtitle: "Strategy" },
  "potential-clients": { title: "Potential Clients", subtitle: "CRM" },
  whiteboard: { title: "Whiteboard", subtitle: "Business Productivity" },
  competitors: { title: "Competitors", subtitle: "Strategy" },
  assets: { title: "Assets", subtitle: "Operations" },
  "inventory-management": { title: "Inventory", subtitle: "Operations" },
  procurement: { title: "Procurement", subtitle: "Operations" },
  fleet: { title: "Fleet", subtitle: "Internal Operations" },
  testing: { title: "Flight Simulator Testing", subtitle: "Tools" },
  "qa-tasks": { title: "QA Tasks", subtitle: "Tools" },
  projects: { title: "Projects", subtitle: "Projects" },
  "projects-dashboard": { title: "Projects Dashboard", subtitle: "Projects" },
  "projects-internal": { title: "Internal Projects", subtitle: "Projects" },
  "projects-external": { title: "External Projects", subtitle: "Projects" },
  grants: { title: "Grants", subtitle: "Projects" },
  "recent-missions": { title: "Recent Missions", subtitle: "Internal Operations" },
  webodm: { title: "WebODM Processing", subtitle: "Internal Operations" },
  messaging: { title: "Messaging", subtitle: "Business Productivity" },
  communications: { title: "Communications", subtitle: "Business Productivity" },
  social: { title: "Social", subtitle: "Marketing & Events" },
  settings: { title: "General", subtitle: "Settings" },
  billing: { title: "Billing", subtitle: "Settings" },
  calendar: { title: "Calendar", subtitle: "Business Productivity" },
  "info-email": { title: "Email", subtitle: "Business Productivity" },
  files: { title: "Dashboard", subtitle: "Business Productivity" },
  "productivity-dashboard": { title: "Dashboard", subtitle: "Business Productivity" },
  management: { title: "Management", subtitle: "Business Central" },
  "content-studio": { title: "Content Studio", subtitle: "Business Productivity" },
  "internal-work-packages": {
    title: "Internal Work Packages",
    subtitle: "Business Productivity",
  },
  "sales-management": { title: "Dashboard", subtitle: "Sales Management" },
  "files-internal": { title: "Internal Files", subtitle: "File Explorer" },
  "unit311-details": { title: "Dashboard", subtitle: "Unit311 Details" },
  "information-repository": {
    title: "Information Repository",
    subtitle: "Business Central",
  },
  "module-go-live": {
    title: "Module Go-Live",
    subtitle: "Unit311 Details",
  },
  "files-external": { title: "External Files", subtitle: "File Explorer" },
  "files-client": { title: "Client Explorer", subtitle: "File Explorer" },
  users: { title: "Internal Users", subtitle: "Tools" },
  "users-external": { title: "External Users", subtitle: "External Client Access" },
  "external-client-access": {
    title: "Portal Management",
    subtitle: "Training",
  },
  support: { title: "Tickets", subtitle: "Support Desk" },
  "support-overview": { title: "Ticket Overview", subtitle: "Support Desk" },
  "support-mine": { title: "My support tickets", subtitle: "Support Desk" },
  "whatsapp-integration": { title: "WhatsApp Integration", subtitle: "Support Desk" },
  telemetry: { title: "Live Telemetry", subtitle: "Tools" },
  "design-mockups": { title: "Design Concepts", subtitle: "Internal Operations" },
  sector: { title: "Sector Intelligence", subtitle: "Unit311" },
  training: { title: "Staff Courses", subtitle: "Training" },
  "course-builder": { title: "Course Builder", subtitle: "Training" },
  "training-dashboard": { title: "Training Dashboard", subtitle: "Training" },
  "training-external": { title: "External Courses", subtitle: "Training" },
  logistics: { title: "Logistics", subtitle: "Operations" },
  "client-onboarding": { title: "Client Onboarding", subtitle: "Customer Management" },
  "quality-management": { title: "Quality Management System", subtitle: "QMS" },
  "qms-training": { title: "QMS Courses", subtitle: "Training" },
  "qms-document-control": { title: "Document Control", subtitle: "QMS" },
  "qms-capa": { title: "CAPA", subtitle: "QMS" },
  "qms-internal-audits": { title: "Internal Audits", subtitle: "QMS" },
  "qms-management-review": { title: "Management Review", subtitle: "QMS" },
  "qms-reports": { title: "Reporting", subtitle: "Training & QMS" },
  profile: { title: "Profile", subtitle: "Settings" },
  appearance: { title: "Appearance", subtitle: "Settings" },
  "executive-assistant": { title: "Executive Assistant", subtitle: "Executive" },
  "demo-company-intelligence": { title: "Company Intelligence", subtitle: "Northstar Intelligence" },
  "demo-client-intelligence": { title: "Client Intelligence", subtitle: "Northstar Intelligence" },
  "demo-market-intelligence": { title: "Market Intelligence", subtitle: "Northstar Intelligence" },
  "platform-analytics": { title: "Platform Analytics", subtitle: "Analytics" },
  "website-analytics": { title: "Website Analytics", subtitle: "Analytics" },
  "system-health": { title: "System Health", subtitle: "Analytics" },
  "workspaces-overview": { title: "Workspace Overview", subtitle: "Workspaces" },
  "workspaces-new": { title: "New Workspace", subtitle: "Workspaces" },
  "website-management": { title: "Website Management", subtitle: "Tools" },
  "website-uk-pavilion": {
    title: "UK Healthcare Pavilion Management",
    subtitle: "Website Management",
  },
  integrations: { title: "Integrations", subtitle: "Tools" },
  "unit311-support": { title: "Unit311 Support", subtitle: "Tools" },
  "unit311-platform-support": { title: "Tickets", subtitle: "Support" },
  engineering: { title: "Dashboard", subtitle: "Engineering" },
  "engineering-dashboard": { title: "Dashboard", subtitle: "Engineering" },
  "engineering-programs": { title: "Programs & Milestones", subtitle: "Engineering" },
  "engineering-resources": {
    title: "Technology Resourcing",
    subtitle: "Technology Management",
  },
  "engineering-capacity": { title: "Team & Capacity", subtitle: "Engineering" },
  "engineering-risks": { title: "Risks", subtitle: "Engineering" },
  "engineering-technical-files": { title: "Technical Files", subtitle: "Engineering" },
  "engineering-sops": { title: "Standard Operating Procedures", subtitle: "Engineering" },
  "engineering-sops-dashboard": { title: "SOP Dashboard", subtitle: "Engineering" },
  "engineering-sops-library": { title: "SOP Library", subtitle: "Engineering" },
  "engineering-sops-tasks": { title: "My Tasks", subtitle: "Engineering" },
  "engineering-sops-runs": { title: "Active Runs", subtitle: "Engineering" },
  "engineering-sops-reviews": { title: "Reviews & Approvals", subtitle: "Engineering" },
  "engineering-sops-templates": { title: "SOP Templates", subtitle: "Engineering" },
  "engineering-sops-reports": { title: "SOP Reports", subtitle: "Engineering" },
  technology: { title: "Technology Management", subtitle: "Technology Management" },
  "technology-dashboard": { title: "Dashboard", subtitle: "Technology Management" },
  "technology-architecture": {
    title: "Architecture Diagrams",
    subtitle: "Technology Management",
  },
  "technology-devices": { title: "Technology Assets", subtitle: "Technology Management" },
  "technology-software-dashboard": {
    title: "Software & SaaS Dashboard",
    subtitle: "Technology Management",
  },
  "technology-software": { title: "Software & SaaS", subtitle: "Technology Management" },
  "technology-telecommunications": {
    title: "Telecommunications",
    subtitle: "Technology Management",
  },
  "technology-infrastructure": {
    title: "Infrastructure",
    subtitle: "Technology Management",
  },
  "technology-reports": { title: "Reports", subtitle: "Technology Management" },
  "technology-settings": { title: "Settings", subtitle: "Technology Management" },
  "portfolio-companies": { title: "Portfolio Companies", subtitle: "Portfolio Companies" },
  "portfolio-dashboard": { title: "Portfolio Dashboard", subtitle: "Portfolio Companies" },
  "portfolio-directory": { title: "Directory", subtitle: "Portfolio Companies" },
  "portfolio-portal-overview": {
    title: "Portfolio Portal Overview",
    subtitle: "Portfolio Companies",
  },
  "portfolio-company": { title: "Company Profile", subtitle: "Portfolio Companies" },
  "portfolio-intelligence-briefing": {
    title: "Executive Briefing",
    subtitle: "Talanton Intelligence · Portfolio Intelligence",
  },
  "portfolio-intelligence-company": {
    title: "Company Intelligence",
    subtitle: "Talanton Intelligence · Portfolio Intelligence",
  },
  "impact-intelligence-dashboard": {
    title: "Impact Dashboard",
    subtitle: "Talanton Intelligence · Impact Intelligence",
  },
  "impact-intelligence-company": {
    title: "Company Impact",
    subtitle: "Talanton Intelligence · Impact Intelligence",
  },
  "annual-impact-report": {
    title: "Annual Impact Report",
    subtitle: "Talanton Intelligence · Impact Intelligence",
  },
  "quarterly-portfolio-update": {
    title: "Quarterly Portfolio Update",
    subtitle: "Talanton Intelligence · Portfolio Intelligence",
  },
  "funds-dashboard": { title: "Fund Dashboard", subtitle: "Funds" },
  "funds-impact": { title: "Impact Fund", subtitle: "Funds" },
  "funds-momentum": { title: "Momentum Fund", subtitle: "Funds" },
  "funds-stewards": { title: "Stewards Fund", subtitle: "Funds" },
  "funds-investors": { title: "Investors", subtitle: "Funds" },
  "funds-commitments": { title: "Capital Commitments", subtitle: "Funds" },
  "funds-performance": { title: "Fund Performance", subtitle: "Funds" },
  "opportunity-intelligence": {
    title: "Opportunity Intelligence",
    subtitle: "Talanton Intelligence",
  },
  "portfolio-stories": {
    title: "Portfolio Stories",
    subtitle: "Marketing & Stories",
  },
  "journey-stories": {
    title: "Journey Stories",
    subtitle: "Marketing & Stories",
  },
  "stories-newsletter": {
    title: "Digital Newsletter",
    subtitle: "Marketing & Stories",
  },
  "stories-media-library": {
    title: "Media Library",
    subtitle: "Marketing & Stories",
  },
  "stories-mailing-list": {
    title: "Mailing List Management",
    subtitle: "Marketing & Stories",
  },
  "portfolio-courses": { title: "Portfolio Courses", subtitle: "Training" },
  "portfolio-course-management": {
    title: "Course Management",
    subtitle: "Training",
  },
  "learning-library": { title: "Learning Library", subtitle: "Training" },
  "training-certifications": { title: "Certifications", subtitle: "Training" },
  "company-progress": { title: "Company Progress", subtitle: "Training" },
  "portfolio-my-training": { title: "My Training", subtitle: "Portfolio Training" },
  "portfolio-compliance-dashboard": {
    title: "Compliance Dashboard",
    subtitle: "Training",
  },
  "portfolio-policies": { title: "Policies", subtitle: "Governance" },
  "portfolio-risk-register": { title: "Risk Register", subtitle: "Governance" },
  "portfolio-action-tracking": { title: "Action Tracking", subtitle: "Governance" },
  "portfolio-report-compliance": {
    title: "Portfolio Compliance",
    subtitle: "Impact Reports",
  },
  "portfolio-report-company": {
    title: "Company Compliance",
    subtitle: "Impact Reports",
  },
  "portfolio-report-training": {
    title: "Training Completion",
    subtitle: "Impact Reports",
  },
  "portfolio-analytics-performance": {
    title: "Portfolio Performance",
    subtitle: "Analytics",
  },
  "portfolio-analytics-revenue": { title: "Revenue Trends", subtitle: "Analytics" },
  "portfolio-analytics-compliance": {
    title: "Compliance Dashboard",
    subtitle: "Analytics",
  },
  "portfolio-analytics-risk": { title: "Risk Dashboard", subtitle: "Analytics" },
  "portfolio-analytics-geo": { title: "Geographic Portfolio", subtitle: "Analytics" },
  "portfolio-analytics-quarterly": {
    title: "Quarterly Reporting Dashboard",
    subtitle: "Analytics",
  },
  "portfolio-quarterly-reporting": {
    title: "Reporting Hub",
    subtitle: "Quarterly Reporting",
  },
  "marketing-newsletter": { title: "Digital Newsletter", subtitle: "Marketing & Events" },
  "marketing-events": { title: "External Events", subtitle: "Marketing & Events" },
  "marketing-abhi-events": { title: "ABHI Events", subtitle: "Marketing & Events" },
  "marketing-event-management": {
    title: "Event Management",
    subtitle: "Marketing & Events",
  },
  "marketing-working-groups": { title: "ABHI Working Groups", subtitle: "Marketing & Events" },
  "marketing-us-accelerator": { title: "ABHI US Accelerator", subtitle: "Marketing & Events" },
  "marketing-me-accelerator": {
    title: "ABHI Middle East Accelerator",
    subtitle: "Marketing & Events",
  },
  "marketing-training": { title: "Internal Training", subtitle: "Training" },
  "marketing-mailing-list": { title: "Mailing List Management", subtitle: "Marketing & Events" },
  "regulatory-dashboard": { title: "Dashboard", subtitle: "ABHI Intelligence" },
  "regulatory-updates": { title: "Regulatory Updates", subtitle: "ABHI Intelligence" },
  "regulatory-impact": { title: "Impact Assessments", subtitle: "ABHI Intelligence" },
  "regulatory-alerts": { title: "Member Alerts", subtitle: "ABHI Intelligence" },
  "oa-test-plans": { title: "Test Plans", subtitle: "Engineering" },
  "oa-test-runs": { title: "Test Runs", subtitle: "Engineering" },
  "oa-defects": { title: "Defects", subtitle: "Engineering" },
  "oa-uat-tracking": { title: "UAT Tracking", subtitle: "Engineering" },
  "oa-platform-health": { title: "Platform Health", subtitle: "Operations" },
  "oa-monitoring": { title: "Monitoring", subtitle: "Operations" },
  "oa-incident-management": { title: "Incident Management", subtitle: "Operations" },
  "oa-change-management": { title: "Change Management", subtitle: "Operations" },
  "oa-release-tracking": { title: "Release Tracking", subtitle: "Operations" },
  "operations-dashboard": { title: "Dashboard", subtitle: "Operations" },
  "saec-installations-dashboard": { title: "Dashboard", subtitle: "Operations · Installations" },
  "saec-installations-elevators": { title: "Elevators", subtitle: "Operations · Installations" },
  "saec-installations-escalators": { title: "Escalators", subtitle: "Operations · Installations" },
  "fundraising-dashboard": { title: "Dashboard", subtitle: "Fundraising" },
  "fundraising-investors": { title: "Investors", subtitle: "Fundraising" },
  "fundraising-cap-table": { title: "Cap Table Management", subtitle: "Fundraising" },
  "fundraising-pipeline": { title: "Pipeline", subtitle: "Fundraising" },
  "fundraising-meetings": { title: "Meetings", subtitle: "Fundraising" },
  "fundraising-pitch-decks": { title: "Pitch Decks", subtitle: "Fundraising" },
  "fundraising-data-rooms": { title: "Data Rooms", subtitle: "Fundraising" },
  "oa-engineering-overview": { title: "Engineering Overview", subtitle: "Engineering" },
  "oa-programs-milestones": { title: "Programs & Milestones", subtitle: "Engineering" },
  "oa-team-capacity": { title: "Team & Capacity", subtitle: "Engineering" },
  "oa-supply-dependencies": { title: "Supply & Dependencies", subtitle: "Engineering" },
  "oa-assurance-certification": { title: "Assurance & Certification", subtitle: "Engineering" },
  "oa-engineering-risks": { title: "Engineering Risks", subtitle: "Engineering" },
  "oa-engineering-integrations": { title: "Integrations", subtitle: "Engineering" },
  "oa-ip-overview": { title: "IP Overview", subtitle: "IP & Patents" },
  "oa-ip-dashboard": { title: "Patents Dashboard", subtitle: "IP & Patents" },
  "oa-ip-register": { title: "Patent Register", subtitle: "IP & Patents" },
  "oa-ip-portfolio": { title: "Patent Portfolio", subtitle: "IP & Patents" },
  "oa-ip-documents": { title: "Patent Documents", subtitle: "IP & Patents" },
  "oa-ip-search": { title: "IP Search", subtitle: "IP & Patents" },
  "oa-competitor-intelligence": {
    title: "Competitor Intelligence",
    subtitle: "OnwardAir Intelligence",
  },
  "oa-ecosystem-partners": {
    title: "Ecosystem Partners",
    subtitle: "OnwardAir Intelligence",
  },
  "oa-marketing-dashboard": {
    title: "Dashboard",
    subtitle: "Marketing & Events",
  },
  "business-central-dashboard": {
    title: "Dashboard",
    subtitle: "Business Central",
  },
};

/** Breadcrumb labels for the active internal leaf (section → … → page).
 * Uses navigation labels only — never appends the page title (h1 owns that).
 */
export function getInternalNavBreadcrumb(
  activeView: InternalOperationsView,
): readonly string[] {
  const titles = resolveInternalViewTitles(activeView);

  let navSections: readonly InternalNavSection[] = internalSurveyNavSections;
  try {
    const { filterInternalNavSectionsForDemoSurface } =
      require("@/lib/internal-role-views") as typeof import("@/lib/internal-role-views");
    navSections = filterInternalNavSectionsForDemoSurface(internalSurveyNavSections);
  } catch {
    /* role-view filter optional at build edges */
  }

  const sectionLists: Array<readonly InternalNavSection[]> = [navSections];
  try {
    const { TALANTON_IMPACT_NAV_SECTIONS } =
      require("@/lib/talanton/nav") as typeof import("@/lib/talanton/nav");
    sectionLists.push(TALANTON_IMPACT_NAV_SECTIONS);
  } catch {
    /* Talanton nav optional at build edges */
  }

  for (const sections of sectionLists) {
    for (const section of sections) {
      for (const item of section.items) {
        const trail = findNavTrailLabels(item, activeView, []);
        if (trail) {
          return section.label != null ? [section.label, ...trail] : [...trail];
        }
      }
    }
  }

  const pageTitle = titles?.title ?? activeView;
  return titles?.subtitle ? [titles.subtitle, pageTitle] : [pageTitle];
}

/**
 * Workspace accent colour for the active leaf — matches the LHS module vertical stripe
 * (e.g. Financials green). Includes pin accents (Home / Executive Assistant).
 */
export function resolveInternalNavSectionAccent(
  activeView: InternalOperationsView,
): string | null {
  // Pin accents — OnwardAir Home uses brand teal RGB(38, 123, 144).
  if (activeView === "home") {
    if (typeof window !== "undefined") {
      try {
        const { isBrowserOnwardAirSurface, ONWARDAIR_HOME_ACCENT } =
          require("@/lib/onwardair-surface") as typeof import("@/lib/onwardair-surface");
        if (isBrowserOnwardAirSurface()) return ONWARDAIR_HOME_ACCENT;
      } catch {
        /* fall through */
      }
    }
  }
  if (activeView === "executive-assistant") return "#12B886";

  let navSections: readonly InternalNavSection[] = internalSurveyNavSections;
  try {
    const { filterInternalNavSectionsForDemoSurface } =
      require("@/lib/internal-role-views") as typeof import("@/lib/internal-role-views");
    navSections = filterInternalNavSectionsForDemoSurface(internalSurveyNavSections);
  } catch {
    /* role-view filter optional at build edges */
  }

  const sectionLists: Array<readonly InternalNavSection[]> = [navSections];
  try {
    const { TALANTON_IMPACT_NAV_SECTIONS } =
      require("@/lib/talanton/nav") as typeof import("@/lib/talanton/nav");
    sectionLists.push(TALANTON_IMPACT_NAV_SECTIONS);
  } catch {
    /* Talanton nav optional at build edges */
  }

  for (const sections of sectionLists) {
    for (const section of sections) {
      for (const item of section.items) {
        if (findNavTrailLabels(item, activeView, [])) {
          return section.color ?? null;
        }
      }
    }
  }

  return null;
}

/** View chrome titles — ABHI renames Clients → Members in the UI shell. */
export function resolveInternalViewTitles(activeView: InternalOperationsView): {
  title: string;
  subtitle: string;
} {
  const base = internalViewTitles[activeView];
  if (typeof window !== "undefined") {
    try {
      const { isBrowserAbhiSurface } =
        require("@/lib/abhi-surface") as typeof import("@/lib/abhi-surface");
      if (isBrowserAbhiSurface()) {
        if (activeView === "clients") {
          return { title: "Member Directory", subtitle: "Members" };
        }
        if (activeView === "clients-dashboard") {
          return { title: "Dashboard", subtitle: "Members" };
        }
        if (activeView === "member-intelligence") {
          return { title: "Member Intelligence", subtitle: "Members" };
        }
        if (activeView === "client-onboarding") {
          return { title: "Member Onboarding", subtitle: "Customer Management" };
        }
        if (activeView === "files-client") {
          return { title: "Member Explorer", subtitle: "File Explorer" };
        }
        if (activeView === "unit311-details") {
          return { title: "Dashboard", subtitle: "ABHI Details" };
        }
        if (activeView === "module-go-live") {
          return { title: "Module Go-Live", subtitle: "ABHI Details" };
        }
        if (activeView === "social") {
          return { title: "Social", subtitle: "Marketing & Events" };
        }
        if (
          activeView === "projects" ||
          activeView === "projects-dashboard" ||
          activeView === "projects-internal" ||
          activeView === "projects-external"
        ) {
          return {
            title: base.title,
            subtitle: "Project Management",
          };
        }
        if (activeView === "grants") {
          return {
            title: base.title,
            subtitle: "Business Central",
          };
        }
      }
    } catch {
      /* ignore */
    }

    try {
      const { isBrowserOnwardAirSurface } =
        require("@/lib/onwardair-surface") as typeof import("@/lib/onwardair-surface");
      if (isBrowserOnwardAirSurface()) {
        if (
          activeView === "projects" ||
          activeView === "projects-dashboard" ||
          activeView === "projects-internal" ||
          activeView === "projects-external"
        ) {
          return {
            title: base.title,
            subtitle: "Project Management",
          };
        }
        if (activeView === "grants" || activeView === "business-central-dashboard") {
          return {
            title: base.title,
            subtitle: "Business Central",
          };
        }
        if (activeView === "potential-clients") {
          return {
            title: base.title,
            subtitle: "OnwardAir Intelligence",
          };
        }
        if (activeView === "corporate-cap-table") {
          return {
            title: "Cap Table Management",
            subtitle: "Fundraising",
          };
        }
        if (activeView === "social") {
          return { title: "Social", subtitle: "Marketing & Events" };
        }
        if (activeView === "board-dashboard") {
          return {
            title: "Dashboard",
            subtitle: "Board",
          };
        }
        if (activeView === "board-members" || activeView === "corporate-board-directors") {
          return {
            title: "Board Members",
            subtitle: "Board",
          };
        }
      }
    } catch {
      /* ignore */
    }

    try {
      const { isBrowserDemoSurface } =
        require("@/lib/demo-enterprise") as typeof import("@/lib/demo-enterprise");
      if (isBrowserDemoSurface()) {
        if (activeView === "unit311-details") {
          return { title: "Architecture Diagrams", subtitle: "Technology Management" };
        }
        if (activeView === "technology-architecture") {
          return { title: "Architecture Diagrams", subtitle: "Technology Management" };
        }
        if (activeView === "corporate-cap-table") {
          return {
            title: "Cap Table Management",
            subtitle: "Fundraising",
          };
        }
        if (activeView === "board-dashboard") {
          return {
            title: "Dashboard",
            subtitle: "Board",
          };
        }
        if (activeView === "board-members" || activeView === "corporate-board-directors") {
          return {
            title: "Board Members",
            subtitle: "Board",
          };
        }
        if (activeView === "oa-marketing-dashboard") {
          return { title: "Marketing and Events", subtitle: "Marketing and Events" };
        }
        if (activeView === "portfolio-stories") {
          return { title: "Client Stories", subtitle: "Marketing and Events" };
        }
        if (
          activeView === "marketing-newsletter" ||
          activeView === "marketing-events" ||
          activeView === "marketing-event-management" ||
          activeView === "marketing-mailing-list"
        ) {
          return { title: base.title, subtitle: "Marketing and Events" };
        }
      }
    } catch {
      /* ignore */
    }
  }
  return base;
}

function findNavTrailLabels(
  item: InternalNavItem | InternalNavChildItem,
  activeView: InternalOperationsView,
  ancestors: string[],
): string[] | null {
  const nextAncestors = [...ancestors, item.label];

  if (item.view === activeView) {
    return nextAncestors;
  }

  if (item.children?.length) {
    for (const child of item.children) {
      const found = findNavTrailLabels(child, activeView, nextAncestors);
      if (found) return found;
    }
  }

  return null;
}

export const internalHomeTileRows = [
  [
    {
      id: "clients",
      view: "clients" as const,
      icon: "clients" as const,
      title: "Clients",
      description: "Client accounts, contracts, and contacts.",
      accent: "from-sky-500/20 to-blue-600/10 border-sky-400/30",
    },
    {
      id: "projects",
      view: "projects" as const,
      icon: "projects" as const,
      title: "Projects",
      description: "Live and upcoming client mobilisations.",
      accent: "from-amber-500/20 to-orange-600/10 border-amber-400/30",
    },
    {
      id: "recent-missions",
      view: "recent-missions" as const,
      icon: "recent-missions" as const,
      title: "Recent Missions",
      description: "Mission history by region.",
      accent: "from-cyan-500/20 to-sky-600/10 border-cyan-400/30",
    },
  ],
  [
    {
      id: "crm",
      view: "crm" as const,
      icon: "crm" as const,
      title: "CRM",
      description: "Lead pipeline, status, and next actions.",
      accent: "from-indigo-500/20 to-blue-600/10 border-indigo-400/30",
    },
    {
      id: "assets",
      view: "assets" as const,
      icon: "assets" as const,
      title: "Assets",
      description: "Matrice 4T fleet registry.",
      accent: "from-violet-500/20 to-indigo-600/10 border-violet-400/30",
    },
    {
      id: "testing",
      view: "testing" as const,
      icon: "testing" as const,
      title: "Testing",
      description: "FlightHub simulator testing.",
      accent: "from-emerald-500/20 to-teal-600/10 border-emerald-400/30",
    },
  ],
  [
    {
      id: "messaging",
      view: "messaging" as const,
      icon: "messaging" as const,
      title: "Messaging",
      description: "Channels, DMs, and chat history.",
      accent: "from-blue-500/20 to-sky-600/10 border-blue-400/30",
    },
    {
      id: "communications",
      view: "communications" as const,
      icon: "testing" as const,
      title: "Communications",
      description: "Voice, video, and live meetings.",
      accent: "from-emerald-500/20 to-teal-600/10 border-emerald-400/30",
    },
    {
      id: "files",
      view: "files-internal" as const,
      icon: "files" as const,
      title: "File Explorer",
      description: "Document repository.",
      accent: "from-slate-500/20 to-zinc-600/10 border-slate-400/30",
    },
    {
      id: "users",
      view: "users" as const,
      icon: "users" as const,
      title: "Users",
      description: "Operator roster and roles.",
      accent: "from-orange-500/20 to-amber-600/10 border-orange-400/30",
    },
  ],
  [
    {
      id: "telemetry",
      view: "telemetry" as const,
      icon: "telemetry" as const,
      title: "Live Telemetry",
      description: "Live drone OSD feed.",
      accent: "from-rose-500/20 to-red-600/10 border-rose-400/30",
    },
    {
      id: "webodm",
      view: "webodm" as const,
      icon: "webodm" as const,
      title: "WebODM",
      description: "Orthophotos and 3D models.",
      accent: "from-fuchsia-500/20 to-purple-600/10 border-fuchsia-400/30",
    },
    {
      id: "strategy",
      view: "strategy" as const,
      icon: "strategy" as const,
      title: "Strategy",
      description: "Capability matrix, notes, and priorities.",
      accent: "from-teal-500/20 to-emerald-600/10 border-teal-400/30",
    },
  ],
] as const;

export type InternalHomeTile = (typeof internalHomeTileRows)[number][number];

export function getInternalNavHref(
  view: InternalOperationsView | null,
  basePath: SurveyOperationsBasePath = INTERNAL_OPERATIONS_BASE_PATH,
  query?: Record<string, string>,
) {
  if (view === "corporate-information") {
    const params = new URLSearchParams({
      view: "corporate-information",
      tab: query?.tab && isCorporateInformationTab(query.tab) ? query.tab : "company-details",
    });
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (key === "view" || key === "tab") continue;
        params.set(key, value);
      }
    }
    return `${basePath === "/" ? "/" : basePath}?${params.toString()}`;
  }

  if (view === "sales-management") {
    const params = new URLSearchParams({
      view: "sales-management",
      tab:
        query?.tab && isSalesManagementTab(query.tab)
          ? query.tab
          : DEFAULT_SALES_MANAGEMENT_TAB,
    });
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (key === "view" || key === "tab") continue;
        params.set(key, value);
      }
    }
    return `${basePath === "/" ? "/" : basePath}?${params.toString()}`;
  }

  if (!view || view === "home") {
    if (!query || Object.keys(query).length === 0) {
      return basePath;
    }
    const params = new URLSearchParams(query);
    return `${basePath === "/" ? "/" : basePath}?${params.toString()}`;
  }

  const params = new URLSearchParams({ view });
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      params.set(key, value);
    }
  }
  return `${basePath === "/" ? "/" : basePath}?${params.toString()}`;
}

function internalNavQueryMatches(
  expectedQuery: Record<string, string>,
  searchParams: URLSearchParams | null | undefined,
) {
  if (!searchParams) return false;
  return Object.entries(expectedQuery).every(([key, value]) => searchParams.get(key) === value);
}

export function isInternalNavChildActive(
  item: InternalNavChildItem,
  activeView: InternalOperationsView = "home",
  pathname = "",
  basePath: SurveyOperationsBasePath = INTERNAL_OPERATIONS_BASE_PATH,
  searchParams?: URLSearchParams | null,
): boolean {
  if (item.children?.length) {
    return item.children.some((child) =>
      isInternalNavChildActive(child, activeView, pathname, basePath, searchParams),
    );
  }

  if (item.href) {
    if (item.href.includes("?")) {
      const [hrefPath, hrefQuery] = item.href.split("?", 2);
      if (pathname !== hrefPath && !pathname.startsWith(`${hrefPath}/`)) {
        return false;
      }
      const expected = Object.fromEntries(new URLSearchParams(hrefQuery).entries());
      return internalNavQueryMatches(expected, searchParams);
    }
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  }

  if (item.view && item.query) {
    return item.view === activeView && internalNavQueryMatches(item.query, searchParams);
  }
  if (item.view === "management") {
    const param = searchParams?.get("section");
    return activeView === "management" && (!param || param === "dashboard");
  }
  // Shared implementations (Projects / Engineering / Assets) must highlight only the
  // selected leaf. Parent expansion still works via children.some(...) above.
  return item.view === activeView;
}

export function isInternalNavItemActive(
  pathname: string,
  item: InternalNavItem,
  activeView: InternalOperationsView = "home",
  basePath: SurveyOperationsBasePath = INTERNAL_OPERATIONS_BASE_PATH,
  searchParams?: URLSearchParams | null,
) {
  if (item.href) {
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  }

  const childHrefActive =
    item.children?.some((child) =>
      isInternalNavChildActive(child, activeView, pathname, basePath, searchParams),
    ) ?? false;

  if (pathname !== basePath) {
    return childHrefActive;
  }

  if (item.view && item.query) {
    return item.view === activeView && internalNavQueryMatches(item.query, searchParams);
  }

  if (item.view) {
    return item.view === activeView;
  }

  return childHrefActive || (item.children?.some((child) => child.view === activeView) ?? false);
}
