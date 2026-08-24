import type { InternalOperationsView } from "@/lib/internal-operations-data";

type WorkspaceLoader = () => Promise<unknown>;

const loadIntelligenceCentralWorkspace = () =>
  import("@/components/intelligence/IntelligenceCentralWorkspace");

/** Chunk loaders keyed by internal ops view. */
export const WORKSPACE_CHUNK_LOADERS: Partial<
  Record<InternalOperationsView, WorkspaceLoader>
> = {
  home: () => import("@/components/testflighthub/ExecutiveHomeDashboard"),
  crm: () => import("@/components/testflighthub/CrmWorkspace"),
  "crm-meetings": () => import("@/components/testflighthub/MeetingsWorkspace"),
  messaging: () => import("@/components/testflighthub/MessagingWorkspace"),
  communications: () => import("@/components/testflighthub/CommunicationsWorkspace"),
  projects: () => import("@/components/testflighthub/ProjectsWorkspace"),
  "projects-dashboard": () => import("@/components/testflighthub/ProjectsWorkspace"),
  "projects-internal": () => import("@/components/testflighthub/ProjectsWorkspace"),
  "projects-external": () => import("@/components/testflighthub/ProjectsWorkspace"),
  calendar: () => import("@/components/testflighthub/CalendarWorkspace"),
  financials: () => import("@/components/testflighthub/FinancialsWorkspace"),
  "general-ledger": () => import("@/components/testflighthub/GeneralLedgerWorkspace"),
  "accounts-receivable": () => import("@/components/testflighthub/AccountsReceivableWorkspace"),
  "accounts-payable": () => import("@/components/testflighthub/AccountsPayableWorkspace"),
  expenses: () => import("@/components/testflighthub/ExpensesWorkspace"),
  "financial-reports": () => import("@/components/testflighthub/FinancialReportsWorkspace"),
  clients: () => import("@/components/testflighthub/ClientManagementWorkspace"),
  "clients-dashboard": () => import("@/components/testflighthub/ClientsDashboardWorkspace"),
  "member-intelligence": loadIntelligenceCentralWorkspace,
  "regulatory-dashboard": loadIntelligenceCentralWorkspace,
  "regulatory-updates": loadIntelligenceCentralWorkspace,
  "regulatory-impact": loadIntelligenceCentralWorkspace,
  "regulatory-alerts": loadIntelligenceCentralWorkspace,
  "client-onboarding": () => import("@/components/testflighthub/ClientOnboardingWorkspace"),
  "potential-clients": () => import("@/components/testflighthub/PotentialClientsWorkspace"),
  hr: () => import("@/components/testflighthub/HrWorkspace"),
  "hr-org-chart": () => import("@/components/testflighthub/OrgChartWorkspace"),
  "hr-leave": () => import("@/components/testflighthub/LeaveManagementWorkspace"),
  "hr-performance": () => import("@/components/testflighthub/PerformanceHubWorkspace"),
  "hr-recruitment": () => import("@/components/testflighthub/RecruitmentWorkspace"),
  settings: () => import("@/components/testflighthub/SettingsWorkspace"),
  profile: () => import("@/components/testflighthub/ProfileWorkspace"),
  users: () => import("@/components/testflighthub/UserManagementWorkspace"),
  "info-email": () => import("@/components/testflighthub/InfoEmailWorkspace"),
  "files-internal": () => import("@/components/testflighthub/FileRepositoryWorkspace"),
  "files-external": () => import("@/components/testflighthub/FileRepositoryWorkspace"),
  "files-client": () => import("@/components/testflighthub/ClientFilesExplorerWorkspace"),
  "productivity-dashboard": () => import("@/components/testflighthub/ProductivityDashboardWorkspace"),
  appearance: () => import("@/components/testflighthub/AppearanceSettingsWorkspace"),
  fleet: () => import("@/components/testflighthub/FleetWorkspace"),
  assets: () => import("@/components/testflighthub/AssetManagementWorkspace"),
  "inventory-management": () => import("@/components/testflighthub/InventoryManagementWorkspace"),
  procurement: () => import("@/components/testflighthub/ProcurementWorkspace"),
  support: () => import("@/components/testflighthub/SupportWorkspace"),
  "support-overview": () => import("@/components/testflighthub/SupportWorkspace"),
  "support-mine": () => import("@/components/testflighthub/SupportWorkspace"),
  logistics: () => import("@/components/testflighthub/LogisticsWorkspace"),
  technology: () => import("@/components/testflighthub/TechnologyDashboardWorkspace"),
  "technology-dashboard": () =>
    import("@/components/testflighthub/TechnologyDashboardWorkspace"),
  "technology-architecture": () =>
    import("@/components/testflighthub/TechnologyArchitectureWorkspace"),
  "technology-devices": () =>
    import("@/components/testflighthub/TechnologyPlaceholderWorkspace"),
  "technology-software": () =>
    import("@/components/testflighthub/TechnologySoftwareWorkspace"),
  "technology-software-dashboard": () =>
    import("@/components/testflighthub/SoftwareSaasDashboardWorkspace"),
  "technology-telecommunications": () =>
    import("@/components/testflighthub/TelecommunicationsWorkspace"),
  "technology-infrastructure": () =>
    import("@/components/testflighthub/TechnologyPlaceholderWorkspace"),
  "technology-reports": () =>
    import("@/components/testflighthub/TechnologyPlaceholderWorkspace"),
  "technology-settings": () =>
    import("@/components/testflighthub/TechnologyPlaceholderWorkspace"),
  "marketing-newsletter": () => import("@/components/testflighthub/AbhiNewsletterWorkspace"),
  "marketing-events": () => import("@/components/testflighthub/AbhiEventsWorkspace"),
  "marketing-abhi-events": () =>
    import("@/components/testflighthub/AbhiCalendarEventsWorkspace"),
  "marketing-event-management": () =>
    import("@/components/testflighthub/AbhiEventManagementWorkspace"),
  "marketing-working-groups": () => import("@/components/testflighthub/AbhiProgrammesWorkspace"),
  "marketing-us-accelerator": () => import("@/components/testflighthub/AbhiProgrammesWorkspace"),
  "marketing-me-accelerator": () => import("@/components/testflighthub/AbhiProgrammesWorkspace"),
  "marketing-training": () => import("@/components/testflighthub/StaffTrainingWorkspace"),
  "marketing-mailing-list": () => import("@/components/testflighthub/AbhiMailingListWorkspace"),
  "website-uk-pavilion": () => import("@/components/testflighthub/AbhiUkPavilionWorkspace"),
  "oa-ip-overview": () => import("@/components/onwardair/OnwardAirIpPatentsWorkspace"),
  "oa-ip-dashboard": () => import("@/components/onwardair/OnwardAirIpPatentsWorkspace"),
  "oa-ip-register": () => import("@/components/onwardair/OnwardAirIpPatentsWorkspace"),
  "oa-ip-portfolio": () => import("@/components/onwardair/OnwardAirIpPatentsWorkspace"),
  "oa-ip-documents": () => import("@/components/onwardair/OnwardAirIpPatentsWorkspace"),
  "oa-ip-search": () => import("@/components/onwardair/OnwardAirIpPatentsWorkspace"),
  "oa-competitor-intelligence": loadIntelligenceCentralWorkspace,
  "oa-ecosystem-partners": loadIntelligenceCentralWorkspace,
  "oa-engineering-overview": () =>
    import("@/components/onwardair/OnwardAirEngineeringWorkspaces"),
  "oa-programs-milestones": () =>
    import("@/components/onwardair/OnwardAirEngineeringWorkspaces"),
  "oa-team-capacity": () => import("@/components/onwardair/OnwardAirEngineeringWorkspaces"),
  "oa-supply-dependencies": () =>
    import("@/components/onwardair/OnwardAirEngineeringWorkspaces"),
  "oa-assurance-certification": () =>
    import("@/components/onwardair/OnwardAirEngineeringWorkspaces"),
  "oa-engineering-risks": () =>
    import("@/components/onwardair/OnwardAirEngineeringWorkspaces"),
  "oa-engineering-integrations": () =>
    import("@/components/onwardair/OnwardAirEngineeringWorkspaces"),
  "training-dashboard": () => import("@/components/testflighthub/TrainingDashboardWorkspace"),
  "course-builder": () => import("@/components/testflighthub/CourseBuilderWorkspace"),
  training: () => import("@/components/testflighthub/StaffTrainingWorkspace"),
  "training-external": () => import("@/components/testflighthub/ExternalTrainingWorkspace"),
  "qms-training": () => import("@/components/testflighthub/QmsTrainingWorkspace"),
  "demo-company-intelligence": loadIntelligenceCentralWorkspace,
  "demo-client-intelligence": loadIntelligenceCentralWorkspace,
  "demo-market-intelligence": loadIntelligenceCentralWorkspace,
  "portfolio-intelligence-briefing": loadIntelligenceCentralWorkspace,
  "portfolio-intelligence-company": loadIntelligenceCentralWorkspace,
  "impact-intelligence-dashboard": loadIntelligenceCentralWorkspace,
  "impact-intelligence-company": loadIntelligenceCentralWorkspace,
  "opportunity-intelligence": loadIntelligenceCentralWorkspace,
};

/**
 * Predict likely next navigations from the current workspace.
 * Prefetch these quietly after the current view is stable.
 */
export const VIEW_NEIGHBOR_PREFETCH: Partial<
  Record<InternalOperationsView, InternalOperationsView[]>
> = {
  home: ["clients-dashboard", "executive-assistant"],
  clients: ["crm", "clients-dashboard", "client-onboarding", "projects"],
  "clients-dashboard": ["clients", "member-intelligence", "crm", "projects"],
  "member-intelligence": ["clients", "clients-dashboard"],
  "regulatory-dashboard": [
    "regulatory-updates",
    "regulatory-impact",
    "regulatory-alerts",
  ],
  "regulatory-updates": ["regulatory-impact", "regulatory-dashboard"],
  "regulatory-impact": ["regulatory-alerts", "regulatory-updates"],
  "regulatory-alerts": ["regulatory-impact", "member-intelligence"],
  "client-onboarding": ["clients", "crm"],
  crm: ["projects", "crm-meetings", "clients", "potential-clients"],
  "crm-meetings": ["calendar", "crm", "messaging"],
  "potential-clients": ["crm", "clients"],
  projects: ["financials", "calendar", "clients", "messaging"],
  "projects-dashboard": ["projects", "financials"],
  "projects-internal": ["projects", "financials"],
  "projects-external": ["projects", "clients"],
  financials: ["general-ledger", "accounts-receivable", "accounts-payable", "expenses"],
  "general-ledger": ["financials", "financial-reports"],
  "accounts-receivable": ["financials", "accounts-payable"],
  "accounts-payable": ["financials", "accounts-receivable"],
  expenses: ["financials"],
  calendar: ["crm-meetings", "communications", "messaging", "projects"],
  messaging: [
    "communications",
    "calendar",
    "info-email",
    "support-overview",
    "support",
    "support-mine",
  ],
  communications: ["messaging", "calendar", "crm-meetings"],
  "info-email": ["messaging", "crm", "productivity-dashboard"],
  "productivity-dashboard": [
    "files-internal",
    "info-email",
    "calendar",
    "messaging",
    "communications",
    "support-overview",
    "support",
  ],
  "files-internal": ["files-external", "files-client", "productivity-dashboard"],
  hr: ["hr-org-chart", "hr-dashboard", "hr-leave", "hr-performance", "hr-recruitment"],
  "hr-leave": ["hr", "hr-performance"],
  "hr-performance": ["hr", "hr-leave"],
  "hr-recruitment": ["hr"],
  "hr-org-chart": ["hr", "hr-dashboard"],
  fleet: ["assets", "logistics", "calendar"],
  assets: ["fleet", "inventory-management", "procurement"],
  "inventory-management": ["assets", "procurement", "logistics"],
  procurement: ["inventory-management", "assets", "logistics"],
  logistics: ["procurement", "inventory-management", "fleet"],
  "oa-engineering-overview": [
    "oa-programs-milestones",
    "oa-team-capacity",
    "oa-engineering-risks",
    "oa-supply-dependencies",
  ],
  "oa-programs-milestones": ["oa-engineering-overview", "oa-team-capacity", "oa-engineering-risks"],
  "oa-team-capacity": ["oa-engineering-overview", "oa-programs-milestones"],
  "oa-supply-dependencies": ["oa-engineering-overview", "oa-programs-milestones", "procurement"],
  "oa-assurance-certification": ["oa-engineering-overview", "oa-engineering-risks"],
  "oa-engineering-risks": ["oa-engineering-overview", "oa-programs-milestones"],
  "oa-engineering-integrations": ["oa-engineering-overview"],
  technology: [
    "technology-dashboard",
    "technology-architecture",
    "technology-devices",
    "technology-software-dashboard",
    "technology-software",
    "technology-telecommunications",
  ],
  "technology-dashboard": [
    "technology-architecture",
    "technology-devices",
    "technology-software-dashboard",
    "technology-software",
    "technology-telecommunications",
  ],
  "technology-architecture": [
    "technology-dashboard",
    "technology-software",
    "technology-devices",
  ],
  "technology-devices": [
    "technology-software",
    "technology-software-dashboard",
    "technology-dashboard",
    "technology-architecture",
    "assets",
  ],
  "technology-software-dashboard": [
    "technology-software",
    "technology-dashboard",
    "technology-devices",
    "technology-architecture",
  ],
  "technology-software": [
    "technology-software-dashboard",
    "technology-devices",
    "technology-dashboard",
    "technology-architecture",
  ],
  "technology-telecommunications": [
    "technology-devices",
    "technology-dashboard",
    "technology-architecture",
  ],
  settings: ["profile", "users"],
  profile: ["settings"],
  users: ["settings", "users-external"],
  "marketing-newsletter": ["marketing-events", "marketing-mailing-list"],
  "marketing-events": ["marketing-abhi-events", "marketing-event-management", "marketing-newsletter"],
  "marketing-abhi-events": ["marketing-events", "marketing-event-management", "marketing-newsletter"],
  "marketing-event-management": [
    "marketing-abhi-events",
    "marketing-events",
    "marketing-newsletter",
  ],
  "marketing-working-groups": ["marketing-us-accelerator", "marketing-me-accelerator"],
  "marketing-us-accelerator": ["marketing-me-accelerator", "marketing-working-groups"],
  "marketing-me-accelerator": ["marketing-us-accelerator", "marketing-working-groups"],
  "marketing-mailing-list": ["marketing-newsletter", "marketing-events"],
  "website-management": ["website-uk-pavilion", "integrations"],
  "website-uk-pavilion": ["website-management"],
  "oa-ip-overview": ["oa-ip-dashboard", "oa-ip-register", "oa-ip-portfolio"],
  "oa-ip-dashboard": ["oa-ip-overview", "oa-ip-register", "oa-ip-portfolio", "oa-ip-documents", "oa-ip-search"],
  "oa-ip-register": ["oa-ip-overview", "oa-ip-dashboard", "oa-ip-portfolio"],
  "oa-ip-portfolio": ["oa-ip-register", "oa-ip-documents"],
  "oa-ip-documents": ["oa-ip-register", "oa-ip-portfolio"],
  "oa-ip-search": ["oa-ip-register", "oa-ip-dashboard"],
};

const warmed = new Set<string>();

export function prefetchWorkspaceChunks(views: InternalOperationsView[]) {
  if (typeof window === "undefined") return;
  for (const view of views) {
    const loader = WORKSPACE_CHUNK_LOADERS[view];
    if (!loader || warmed.has(view)) continue;
    warmed.add(view);
    void loader().catch(() => {
      warmed.delete(view);
    });
  }
}

export function prefetchNeighborsForView(view: InternalOperationsView) {
  const neighbors = VIEW_NEIGHBOR_PREFETCH[view] ?? [];
  if (neighbors.length === 0) return;
  const run = () => prefetchWorkspaceChunks(neighbors);
  const ric = window.requestIdleCallback?.(run, { timeout: 3500 });
  if (ric == null) window.setTimeout(run, 900);
}

export function prefetchViewOnIntent(view: InternalOperationsView | undefined | null) {
  if (!view) return;
  prefetchWorkspaceChunks([view]);
}
