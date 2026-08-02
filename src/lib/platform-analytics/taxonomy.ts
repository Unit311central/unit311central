/**
 * Navigation hierarchy for Platform Analytics.
 * Workspace → Module → Section (optional) → Page
 * Built to mirror Internal Operations left-hand nav leaves.
 */

export type NavPageNode = {
  moduleKey: string;
  moduleLabel: string;
  /** Mid-level group (e.g. Clients, Courses). Null when page sits directly under module. */
  sectionKey: string | null;
  sectionLabel: string | null;
  pageKey: string;
  pageLabel: string;
  core?: boolean;
};

export type TaxonomyEntry = NavPageNode;

/** Tracked workspace keys for filters / comparison. */
export const TRACKED_WORKSPACES = [
  { key: "all", label: "All Workspaces" },
  { key: "internal", label: "Internal" },
  { key: "demo", label: "Demo" },
  { key: "abhi", label: "ABHI" },
  { key: "talantonimpact", label: "Talanton" },
  { key: "corpcentre", label: "CorpCentre" },
] as const;

export type WorkspaceFilterKey = (typeof TRACKED_WORKSPACES)[number]["key"];

export const WORKSPACE_FILTERS = TRACKED_WORKSPACES;

export const COMPARISON_WORKSPACES = TRACKED_WORKSPACES.filter((w) => w.key !== "all");

function page(
  moduleKey: string,
  moduleLabel: string,
  pageKey: string,
  pageLabel: string,
  opts?: { sectionKey?: string; sectionLabel?: string; core?: boolean },
): NavPageNode {
  return {
    moduleKey,
    moduleLabel,
    sectionKey: opts?.sectionKey ?? null,
    sectionLabel: opts?.sectionLabel ?? null,
    pageKey,
    pageLabel,
    core: opts?.core,
  };
}

/** Canonical page nodes — every navigable leaf we care about. */
export const NAV_PAGE_NODES: NavPageNode[] = [
  page("home", "Home", "home", "Home", { core: true }),
  page("executive-assistant", "Executive Assistant", "executive-assistant", "Executive Assistant", {
    core: true,
  }),

  // Analytics (Internal)
  page("analytics", "Analytics", "platform-analytics", "Platform Analytics", { core: true }),
  page("analytics", "Analytics", "website-analytics", "Website Analytics", { core: true }),

  // Business Central
  page("business-central", "Business Central", "clients-dashboard", "Clients Dashboard", {
    sectionKey: "clients",
    sectionLabel: "Clients",
    core: true,
  }),
  page("business-central", "Business Central", "clients", "Client Directory", {
    sectionKey: "clients",
    sectionLabel: "Clients",
    core: true,
  }),
  page("business-central", "Business Central", "member-intelligence", "Member Intelligence", {
    sectionKey: "clients",
    sectionLabel: "Clients",
  }),
  page("regulatory", "Regulatory Intelligence", "regulatory-dashboard", "Dashboard", {
    sectionKey: "regulatory",
    sectionLabel: "Regulatory Intelligence",
    core: true,
  }),
  page("regulatory", "Regulatory Intelligence", "regulatory-updates", "Regulatory Updates", {
    sectionKey: "regulatory",
    sectionLabel: "Regulatory Intelligence",
  }),
  page("regulatory", "Regulatory Intelligence", "regulatory-impact", "Impact Assessments", {
    sectionKey: "regulatory",
    sectionLabel: "Regulatory Intelligence",
  }),
  page("regulatory", "Regulatory Intelligence", "regulatory-alerts", "Member Alerts", {
    sectionKey: "regulatory",
    sectionLabel: "Regulatory Intelligence",
  }),
  page("business-central", "Business Central", "crm", "Pipeline", {
    sectionKey: "customer-management",
    sectionLabel: "Customer Management",
    core: true,
  }),
  page("business-central", "Business Central", "crm-meetings", "Discovery & Demo", {
    sectionKey: "customer-management",
    sectionLabel: "Customer Management",
  }),
  page("business-central", "Business Central", "client-onboarding", "Client Onboarding", {
    sectionKey: "customer-management",
    sectionLabel: "Customer Management",
  }),
  page("business-central", "Business Central", "potential-clients", "Potential Clients", {
    sectionKey: "customer-management",
    sectionLabel: "Customer Management",
  }),
  page("business-central", "Business Central", "projects-dashboard", "Projects Dashboard", {
    sectionKey: "projects",
    sectionLabel: "Projects",
    core: true,
  }),
  page("business-central", "Business Central", "projects-internal", "Internal Projects", {
    sectionKey: "projects",
    sectionLabel: "Projects",
  }),
  page("business-central", "Business Central", "projects-external", "External Projects", {
    sectionKey: "projects",
    sectionLabel: "Projects",
  }),
  page("business-central", "Business Central", "grants", "Grants", {
    sectionKey: "projects",
    sectionLabel: "Projects",
  }),
  page("business-central", "Business Central", "representatives", "Partners", { core: true }),

  // Financials
  page("financials", "Financials", "financials", "Dashboard", { core: true }),
  page("financials", "Financials", "general-ledger", "General Ledger", { core: true }),
  page("financials", "Financials", "accounts-receivable", "Accounts Receivable", { core: true }),
  page("financials", "Financials", "accounts-payable", "Accounts Payable"),
  page("financials", "Financials", "expenses", "Expenses"),
  page("financials", "Financials", "wise", "Bank"),
  page("financials", "Financials", "financial-reports", "Financial Reports"),

  // Human Resources
  page("human-resources", "Human Resources", "hr-dashboard", "Dashboard", { core: true }),
  page("human-resources", "Human Resources", "hr", "Employees", { core: true }),
  page("human-resources", "Human Resources", "hr-org-chart", "Org Chart"),
  page("human-resources", "Human Resources", "hr-recruitment", "Recruitment"),
  page("human-resources", "Human Resources", "hr-leave", "Time & Attendance"),
  page("human-resources", "Human Resources", "hr-payroll", "Payroll"),
  page("human-resources", "Human Resources", "hr-performance", "Performance"),
  page("human-resources", "Human Resources", "hr-reports", "HR Reports"),

  // Corporate Information
  page("corporate-information", "Corporate Information", "corporate-dashboard", "Dashboard", {
    core: true,
  }),
  page("corporate-information", "Corporate Information", "corporate-cap-table", "Cap Table Management"),
  page("corporate-information", "Corporate Information", "corporate-company-details", "Company Details", {
    core: true,
  }),
  page("corporate-information", "Corporate Information", "office-locations", "Office Locations"),
  page("corporate-information", "Corporate Information", "corporate-bank-accounts", "Bank Accounts"),
  page(
    "corporate-information",
    "Corporate Information",
    "corporate-board-directors",
    "Board of Directors",
    { core: true },
  ),
  page("corporate-information", "Corporate Information", "corporate-advisers", "Professional Advisors"),
  page("corporate-information", "Corporate Information", "corporate-contracts", "Contracts"),
  page(
    "corporate-information",
    "Corporate Information",
    "corporate-risk-register",
    "Risk Register",
  ),
  page("corporate-information", "Corporate Information", "board-pack", "Board deck"),
  page("corporate-information", "Corporate Information", "board-meetings", "Board Meetings"),
  page("corporate-information", "Corporate Information", "unit311-details", "Dashboard", {
    sectionKey: "unit311-details",
    sectionLabel: "Unit311 Details",
  }),
  page("corporate-information", "Corporate Information", "module-go-live", "Module Go-Live", {
    sectionKey: "unit311-details",
    sectionLabel: "Unit311 Details",
  }),

  // Technology
  page("technology", "Technology Management", "technology-dashboard", "Dashboard", { core: true }),
  page("technology", "Technology Management", "technology-devices", "Devices"),
  page("technology", "Technology Management", "technology-software", "Software & SaaS"),
  page("technology", "Technology Management", "technology-telecommunications", "Telecommunications"),
  page("technology", "Technology Management", "technology-infrastructure", "Infrastructure & Cloud"),
  page("technology", "Technology Management", "technology-reports", "Reports"),
  page("technology", "Technology Management", "technology-settings", "Settings"),

  // Business Productivity
  page("productivity", "Business Productivity", "productivity-dashboard", "Dashboard", { core: true }),
  page("productivity", "Business Productivity", "files-internal", "Internal Files", {
    sectionKey: "file-explorer",
    sectionLabel: "File Explorer",
    core: true,
  }),
  page("productivity", "Business Productivity", "files-external", "External Files", {
    sectionKey: "file-explorer",
    sectionLabel: "File Explorer",
  }),
  page("productivity", "Business Productivity", "files-client", "Client Explorer", {
    sectionKey: "file-explorer",
    sectionLabel: "File Explorer",
  }),
  page("productivity", "Business Productivity", "info-email", "Email", { core: true }),
  page("productivity", "Business Productivity", "calendar", "Calendar"),
  page("productivity", "Business Productivity", "messaging", "Messaging"),
  page("productivity", "Business Productivity", "communications", "Communications"),
  page("productivity", "Business Productivity", "social", "Social"),
  page("productivity", "Business Productivity", "support", "Tickets", {
    sectionKey: "support-desk",
    sectionLabel: "Support Desk",
    core: true,
  }),
  page("productivity", "Business Productivity", "support-mine", "My support tickets", {
    sectionKey: "support-desk",
    sectionLabel: "Support Desk",
  }),
  page("productivity", "Business Productivity", "whiteboard", "Whiteboard"),

  // Operations
  page("operations", "Operations", "assets", "Assets"),
  page("operations", "Operations", "inventory-management", "Inventory"),
  page("operations", "Operations", "procurement", "Procurement"),
  page("operations", "Operations", "logistics", "Logistics"),

  // Training
  page("training", "Training", "training-dashboard", "Dashboard", { core: true }),
  page("training", "Training", "training", "Staff Courses", {
    sectionKey: "courses",
    sectionLabel: "Courses",
    core: true,
  }),
  page("training", "Training", "qms-training", "QMS Courses", {
    sectionKey: "courses",
    sectionLabel: "Courses",
  }),
  page("training", "Training", "portfolio-courses", "Portfolio Courses", {
    sectionKey: "courses",
    sectionLabel: "Courses",
    core: true,
  }),
  page("training", "Training", "portfolio-course-management", "Course Management", {
    sectionKey: "courses",
    sectionLabel: "Courses",
  }),
  page("training", "Training", "portfolio-my-training", "My Training", {
    sectionKey: "courses",
    sectionLabel: "Courses",
  }),

  // QMS
  page("qms", "QMS", "quality-management", "Dashboard"),
  page("qms", "QMS", "qms-document-control", "Document Control"),
  page("qms", "QMS", "qms-capa", "CAPA"),
  page("qms", "QMS", "qms-internal-audits", "Internal Audits"),
  page("qms", "QMS", "qms-management-review", "Management Review"),
  page("qms", "QMS", "qms-reports", "Reporting"),

  // Tools
  page("tools", "Tools", "website-management", "Website Management"),
  page("tools", "Tools", "integrations", "Integrations"),
  page("tools", "Tools", "testing", "Testing"),
  page("tools", "Tools", "telemetry", "Telemetry"),
  page("tools", "Tools", "users", "Users"),

  // External Client Access
  page("external-client-access", "External Client Access", "external-client-access", "Dashboard", {
    core: true,
  }),
  page("external-client-access", "External Client Access", "users-external", "External Users"),

  // Settings
  page("settings", "Settings", "profile", "Profile"),
  page("settings", "Settings", "settings", "General"),
  page("settings", "Settings", "billing", "Billing"),
  page("settings", "Settings", "appearance", "Appearance"),

  // Portfolio (Talanton)
  page("portfolio", "Portfolio Companies", "portfolio-companies", "Portfolio Companies", {
    core: true,
  }),
  page("portfolio", "Portfolio Companies", "portfolio-dashboard", "Dashboard"),
  page("portfolio", "Portfolio Companies", "portfolio-directory", "Directory"),
  page("portfolio", "Portfolio Companies", "portfolio-company", "Company portal"),

  // Marketing (ABHI)
  page("marketing", "Marketing & Events", "marketing-newsletter", "Digital Newsletter"),
  page("marketing", "Marketing & Events", "marketing-events", "External Events"),
  page("marketing", "Marketing & Events", "marketing-abhi-events", "ABHI Events"),
  page("marketing", "Marketing & Events", "marketing-event-management", "Event Management"),
  page("marketing", "Marketing & Events", "marketing-working-groups", "ABHI Working Groups"),
  page("marketing", "Marketing & Events", "marketing-us-accelerator", "ABHI US Accelerator"),
  page("marketing", "Marketing & Events", "marketing-me-accelerator", "ABHI Middle East Accelerator"),
  page("marketing", "Marketing & Events", "marketing-mailing-list", "Mailing List Management"),
];

/** First taxonomy entry per pageKey (for event enrichment). */
export const VIEW_TAXONOMY: Record<string, NavPageNode> = (() => {
  const map: Record<string, NavPageNode> = {};
  for (const node of NAV_PAGE_NODES) {
    if (!map[node.pageKey]) map[node.pageKey] = node;
  }
  return map;
})();

export function resolveTaxonomyForView(view: string | null | undefined): NavPageNode | null {
  if (!view) return null;
  return VIEW_TAXONOMY[view] ?? null;
}

export function moduleLabel(moduleKey: string): string {
  const hit = NAV_PAGE_NODES.find((n) => n.moduleKey === moduleKey);
  return hit?.moduleLabel ?? moduleKey;
}

export function workspaceLabel(workspaceKey: string): string {
  return TRACKED_WORKSPACES.find((w) => w.key === workspaceKey)?.label ?? workspaceKey;
}

export function isWorkspaceFilterKey(value: string | null | undefined): value is WorkspaceFilterKey {
  return TRACKED_WORKSPACES.some((w) => w.key === value);
}

export function pagesForModule(moduleKey: string): NavPageNode[] {
  return NAV_PAGE_NODES.filter((n) => n.moduleKey === moduleKey);
}

export function allModuleKeys(): string[] {
  return [...new Set(NAV_PAGE_NODES.map((n) => n.moduleKey))];
}
