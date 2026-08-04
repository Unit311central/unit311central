import type { CommandCentreHomeTileId } from "@/lib/command-centre-home-tiles";
import {
  COMMAND_CENTRE_HOME_TILE_CATALOG,
  DEFAULT_COMMAND_CENTRE_HOME_LAYOUT,
} from "@/lib/command-centre-home-tiles";
import {
  internalOperationsViews,
  internalViewTitles,
  type InternalOperationsView,
} from "@/lib/internal-operations-data";
import type { UserDepartment, UserRole } from "@/lib/user-management-data";

/** Views every internal user can always reach. */
export const ALWAYS_ALLOWED_VIEWS: readonly InternalOperationsView[] = [
  "home",
  "profile",
  "appearance",
  "settings",
  "support",
  "support-overview",
  "support-mine",
  /** Internal host UI still host-gates these views; listed so Internal operators are never blocked by grants. */
  "platform-analytics",
  "website-analytics",
];

export type ModuleGrantGroup = {
  id: string;
  label: string;
  section: string;
  views: InternalOperationsView[];
};

/** Curated module groups for the Add User wizard (maps to sidebar areas). */
export const MODULE_GRANT_GROUPS: ModuleGrantGroup[] = [
  {
    id: "executive-assistant",
    label: "Executive Assistant",
    section: "Pinned",
    views: ["executive-assistant"],
  },
  {
    id: "analytics",
    label: "Analytics",
    section: "Analytics",
    views: ["platform-analytics", "website-analytics"],
  },
  {
    id: "clients",
    label: "Clients",
    section: "Business Central",
    views: ["clients-dashboard", "clients", "member-intelligence"],
  },
  {
    id: "crm",
    label: "Customer Management / CRM",
    section: "Business Central",
    views: ["crm", "crm-meetings", "client-onboarding", "potential-clients"],
  },
  {
    id: "projects",
    label: "Projects",
    section: "Business Central",
    views: ["projects-dashboard", "projects", "projects-internal", "projects-external", "grants"],
  },
  {
    id: "financials",
    label: "Financials",
    section: "Financials",
    views: [
      "financials",
      "general-ledger",
      "accounts-receivable",
      "accounts-payable",
      "expenses",
      "wise",
      "financial-reports",
      "debtors",
      "creditors",
      "opex",
      "board-pack",
    ],
  },
  {
    id: "hr",
    label: "Human Resources",
    section: "Human Resources",
    views: [
      "hr-dashboard",
      "hr",
      "hr-org-chart",
      "hr-recruitment",
      "hr-leave",
      "hr-payroll",
      "hr-performance",
      "hr-reports",
    ],
  },
  {
    id: "marketing-events",
    label: "Marketing & Events",
    section: "Marketing & Events",
    views: [
      "marketing-newsletter",
      "marketing-events",
      "marketing-abhi-events",
      "marketing-event-management",
      "marketing-working-groups",
      "marketing-us-accelerator",
      "marketing-me-accelerator",
      "marketing-training",
      "marketing-mailing-list",
    ],
  },
  {
    id: "regulatory-intelligence",
    label: "Regulatory Intelligence",
    section: "Regulatory Intelligence",
    views: [
      "regulatory-dashboard",
      "regulatory-updates",
      "regulatory-impact",
      "regulatory-alerts",
    ],
  },
  {
    id: "corporate",
    label: "Corporate Information",
    section: "Corporate Information",
    views: [
      "corporate-dashboard",
      "corporate-information",
      "corporate-cap-table",
      "corporate-company-details",
      "office-locations",
      "corporate-bank-accounts",
      "corporate-board-directors",
      "corporate-advisers",
      "corporate-insurance",
      "corporate-software",
      "corporate-contracts",
      "unit311-details",
    ],
  },
  {
    id: "board-governance",
    label: "Board",
    section: "Board",
    views: [
      "board-dashboard",
      "board-meetings",
      "board-pack",
      "board-minutes",
      "corporate-risk-register",
      "board-members",
    ],
  },
  {
    id: "onwardair-engineering",
    label: "Engineering (OnwardAir)",
    section: "Engineering",
    views: [
      "oa-engineering-overview",
      "oa-programs-milestones",
      "oa-team-capacity",
      "oa-supply-dependencies",
      "oa-assurance-certification",
      "oa-engineering-risks",
      "oa-engineering-integrations",
    ],
  },
  {
    id: "onwardair-fundraising",
    label: "Fundraising",
    section: "Fundraising",
    views: [
      "fundraising-dashboard",
      "corporate-cap-table",
      "fundraising-investors",
      "fundraising-pipeline",
      "fundraising-meetings",
      "fundraising-pitch-decks",
      "fundraising-data-rooms",
    ],
  },
  {
    id: "onwardair-marketing-events",
    label: "Marketing & Events",
    section: "Marketing & Events",
    views: [
      "oa-marketing-dashboard",
      "social",
      "marketing-newsletter",
      "marketing-events",
      "marketing-event-management",
      "marketing-mailing-list",
    ],
  },
  {
    id: "operations-assets",
    label: "Assets & Inventory",
    section: "Operations",
    views: [
      "operations-dashboard",
      "assets",
      "inventory-management",
      "procurement",
      "fleet",
      "logistics",
    ],
  },
  {
    id: "strategy",
    label: "Strategy & Competitors",
    section: "Strategy",
    views: ["strategy", "competitors", "whiteboard", "representatives"],
  },
  {
    id: "engineering",
    label: "Engineering",
    section: "Operations",
    views: ["engineering", "engineering-dashboard", "engineering-resources", "engineering-capacity"],
  },
  {
    id: "qms",
    label: "Quality Management",
    section: "QMS",
    views: [
      "quality-management",
      "qms-training",
      "qms-document-control",
      "qms-capa",
      "qms-internal-audits",
      "qms-management-review",
      "qms-reports",
    ],
  },
  {
    id: "training",
    label: "Training",
    section: "Training",
    views: ["training", "training-dashboard", "training-external"],
  },
  {
    id: "productivity",
    label: "Calendar, Files & Comms",
    section: "Business Productivity",
    views: [
      "calendar",
      "messaging",
      "communications",
      "info-email",
      "files",
      "files-internal",
      "files-external",
      "files-client",
      "productivity-dashboard",
      "social",
    ],
  },
  {
    id: "support-desk",
    label: "Support Desk",
    section: "Support Desk",
    views: ["support-overview", "support", "support-mine"],
  },
  {
    id: "technology",
    label: "Technology",
    section: "Technology Management",
    views: [
      "technology",
      "technology-dashboard",
      "technology-devices",
      "technology-software",
      "technology-telecommunications",
      "technology-infrastructure",
      "technology-reports",
      "technology-settings",
      "webodm",
      "testing",
      "telemetry",
    ],
  },
  {
    id: "tools-admin",
    label: "Admin Tools (Users, Website, Integrations)",
    section: "Tools",
    views: [
      "users",
      "users-external",
      "external-client-access",
      "website-management",
      "website-uk-pavilion",
      "integrations",
      "module-go-live",
      "billing",
      "design-mockups",
      "sector",
      "connections",
    ],
  },
];

const FINANCE_GROUP_IDS = new Set(["financials"]);
const SALES_GROUP_IDS = new Set(["clients", "crm", "projects"]);
const ENGINEERING_GROUP_IDS = new Set([
  "operations-assets",
  "engineering",
  "qms",
  "training",
  "technology",
  "projects",
]);
const HR_GROUP_IDS = new Set(["hr", "training"]);
const OPS_GROUP_IDS = new Set(["operations-assets", "projects", "training", "qms"]);

function viewsForGroups(groupIds: Iterable<string>): InternalOperationsView[] {
  const idSet = new Set(groupIds);
  const views = new Set<InternalOperationsView>(ALWAYS_ALLOWED_VIEWS);
  for (const group of MODULE_GRANT_GROUPS) {
    if (!idSet.has(group.id)) continue;
    for (const view of group.views) views.add(view);
  }
  return [...views];
}

function allModuleViews(): InternalOperationsView[] {
  const views = new Set<InternalOperationsView>(ALWAYS_ALLOWED_VIEWS);
  for (const group of MODULE_GRANT_GROUPS) {
    for (const view of group.views) views.add(view);
  }
  for (const view of internalOperationsViews) views.add(view);
  return [...views];
}

/** Primary workspace dashboards — selectable on Add User → Dashboards. */
export const WORKSPACE_DASHBOARD_OPTIONS: ReadonlyArray<{
  id: InternalOperationsView;
  title: string;
  description: string;
  section: string;
}> = [
  {
    id: "home",
    title: "Home",
    description: "Executive operating centre.",
    section: "Core",
  },
  {
    id: "clients-dashboard",
    title: "Clients Dashboard",
    description: "Client portfolio overview.",
    section: "Business Central",
  },
  {
    id: "projects-dashboard",
    title: "Projects Dashboard",
    description: "Live and upcoming delivery.",
    section: "Business Central",
  },
  {
    id: "financials",
    title: "Financials Dashboard",
    description: "Revenue, cash, AR/AP overview.",
    section: "Financials",
  },
  {
    id: "board-pack",
    title: "Board Pack",
    description: "Board deck builder and review.",
    section: "Financials",
  },
  {
    id: "hr-dashboard",
    title: "HR Dashboard",
    description: "People, leave, and workforce KPIs.",
    section: "Human Resources",
  },
  {
    id: "corporate-dashboard",
    title: "Corporate Dashboard",
    description: "Company structure and corporate info.",
    section: "Corporate Information",
  },
  {
    id: "unit311-details",
    title: "Unit311 Details Dashboard",
    description: "Platform details and module go-live.",
    section: "Corporate Information",
  },
  {
    id: "technology-dashboard",
    title: "Technology Dashboard",
    description: "Devices, SaaS, and infrastructure.",
    section: "Technology Management",
  },
  {
    id: "engineering-dashboard",
    title: "Engineering Dashboard",
    description: "Engineering programmes and capacity.",
    section: "Technology Management",
  },
  {
    id: "productivity-dashboard",
    title: "Productivity Dashboard",
    description: "Calendar, files, and communications.",
    section: "Business Productivity",
  },
  {
    id: "training-dashboard",
    title: "Training Dashboard",
    description: "Courses and learning progress.",
    section: "Training",
  },
  {
    id: "quality-management",
    title: "QMS Dashboard",
    description: "Quality system overview.",
    section: "QMS",
  },
  {
    id: "external-client-access",
    title: "External Client Access Dashboard",
    description: "External users and portal access.",
    section: "External Client Access",
  },
];

export function isWorkspaceDashboardEnabled(
  dashboardId: InternalOperationsView,
  allowedViews: readonly InternalOperationsView[] | null | undefined,
): boolean {
  if (allowedViews == null) return true;
  return allowedViews.includes(dashboardId);
}

export function toggleWorkspaceDashboard(
  dashboardId: InternalOperationsView,
  allowedViews: InternalOperationsView[],
  enabled: boolean,
): InternalOperationsView[] {
  const next = new Set(allowedViews);
  for (const view of ALWAYS_ALLOWED_VIEWS) next.add(view);
  if (enabled) next.add(dashboardId);
  else if (!(ALWAYS_ALLOWED_VIEWS as readonly string[]).includes(dashboardId)) {
    next.delete(dashboardId);
  }
  return [...next];
}

/** Smart defaults from access tier + department. Admin can override in the wizard. */
export function defaultAllowedViews(
  role: UserRole,
  department: UserDepartment,
): InternalOperationsView[] {
  if (role === "Admin" || role === "Board" || role === "Exec") {
    return allModuleViews();
  }

  let groupIds: string[];

  if (role === "Associate") {
    groupIds = ["projects", "operations-assets", "training", "productivity", "calendar"];
    if (department === "Engineering") {
      groupIds = ["engineering", "operations-assets", "qms", "training", "projects", "productivity"];
    } else if (department === "Sales") {
      groupIds = ["clients", "crm", "projects", "calendar", "productivity"];
    } else if (department === "Finance") {
      groupIds = ["financials", "clients", "projects", "productivity"];
    } else if (department === "HR") {
      groupIds = ["hr", "training", "productivity"];
    } else if (department === "Operations") {
      groupIds = ["operations-assets", "projects", "training", "qms", "productivity"];
    } else if (department === "Technology") {
      groupIds = ["technology", "engineering", "projects", "productivity"];
    } else if (department === "Board" || department === "Exec" || department === "Manager" || department === "Corporate") {
      groupIds = ["strategy", "corporate", "clients", "projects", "productivity"];
    }
  } else {
    // Manager
    groupIds = [
      "executive-assistant",
      "clients",
      "crm",
      "projects",
      "operations-assets",
      "productivity",
      "training",
    ];
    if (department === "Engineering") {
      groupIds = [
        "executive-assistant",
        ...ENGINEERING_GROUP_IDS,
        "productivity",
        "clients",
      ];
    } else if (department === "Sales") {
      groupIds = ["executive-assistant", ...SALES_GROUP_IDS, "productivity", "calendar"];
    } else if (department === "Finance") {
      groupIds = ["executive-assistant", ...FINANCE_GROUP_IDS, "clients", "projects", "productivity"];
    } else if (department === "HR") {
      groupIds = ["executive-assistant", ...HR_GROUP_IDS, "productivity", "corporate"];
    } else if (department === "Operations") {
      groupIds = ["executive-assistant", ...OPS_GROUP_IDS, "productivity", "clients"];
    } else if (department === "Technology") {
      groupIds = ["executive-assistant", "technology", "engineering", "projects", "productivity"];
    } else if (department === "Board" || department === "Exec" || department === "Manager" || department === "Corporate") {
      groupIds = [
        "executive-assistant",
        "corporate",
        "strategy",
        "clients",
        "projects",
        "productivity",
      ];
    }
  }

  return viewsForGroups(groupIds);
}

/** Union of presets when a user holds multiple roles and/or departments. */
export function defaultAllowedViewsForRoles(
  roles: readonly UserRole[],
  department: UserDepartment | readonly UserDepartment[],
): InternalOperationsView[] {
  if (roles.includes("Admin") || roles.includes("Board") || roles.includes("Exec")) {
    return allModuleViews();
  }
  const departments = Array.isArray(department)
    ? department.length > 0
      ? department
      : (["Corporate"] as UserDepartment[])
    : [department];
  const views = new Set<InternalOperationsView>();
  const list = roles.length > 0 ? roles : (["Associate"] as UserRole[]);
  for (const dept of departments) {
    for (const role of list) {
      for (const view of defaultAllowedViews(role, dept)) views.add(view);
    }
  }
  return [...views];
}

export function defaultHomeTilesForRoles(
  roles: readonly UserRole[],
  department: UserDepartment | readonly UserDepartment[],
): CommandCentreHomeTileId[] {
  if (roles.includes("Admin") || roles.includes("Board") || roles.includes("Exec")) {
    return [...DEFAULT_COMMAND_CENTRE_HOME_LAYOUT];
  }
  const departments = Array.isArray(department)
    ? department.length > 0
      ? department
      : (["Corporate"] as UserDepartment[])
    : [department];
  const tiles = new Set<CommandCentreHomeTileId>();
  const primary = roles.includes("Manager") ? "Manager" : roles[0] ?? "Associate";
  for (const dept of departments) {
    for (const tile of defaultHomeTiles(primary, dept)) tiles.add(tile);
  }
  return tiles.size > 0 ? [...tiles] : ["executive-brief"];
}

export function defaultHomeTiles(
  role: UserRole,
  department: UserDepartment,
): CommandCentreHomeTileId[] {
  if (role === "Admin" || role === "Board" || role === "Exec") {
    return [...DEFAULT_COMMAND_CENTRE_HOME_LAYOUT];
  }

  if (department === "Engineering") {
    return ["executive-brief", "projects", "operations", "risks"];
  }
  if (department === "Sales") {
    return ["executive-brief", "commercial", "projects", "operations"];
  }
  if (department === "Finance") {
    return ["executive-brief", "financial", "commercial", "risks"];
  }
  if (department === "HR") {
    return ["executive-brief", "operations", "risks"];
  }
  if (department === "Operations") {
    return ["executive-brief", "projects", "operations", "risks"];
  }
  if (department === "Technology") {
    return ["executive-brief", "projects", "operations", "risks"];
  }
  if (department === "Board" || department === "Exec") {
    return ["executive-brief", "financial", "commercial", "risks"];
  }
  if (department === "Manager") {
    return ["executive-brief", "projects", "operations", "commercial"];
  }

  return ["executive-brief", "projects", "operations", "commercial"];
}

export function isModuleGroupEnabled(
  group: ModuleGrantGroup,
  allowedViews: readonly InternalOperationsView[] | null | undefined,
): boolean {
  if (allowedViews == null) return true;
  const allowed = new Set(allowedViews);
  return group.views.every((view) => allowed.has(view));
}

export function isModuleGroupPartiallyEnabled(
  group: ModuleGrantGroup,
  allowedViews: readonly InternalOperationsView[] | null | undefined,
): boolean {
  if (allowedViews == null) return false;
  const allowed = new Set(allowedViews);
  const enabledCount = group.views.filter((view) => allowed.has(view)).length;
  return enabledCount > 0 && enabledCount < group.views.length;
}

export function isModuleViewEnabled(
  view: InternalOperationsView,
  allowedViews: readonly InternalOperationsView[] | null | undefined,
): boolean {
  if (allowedViews == null) return true;
  return allowedViews.includes(view);
}

export function moduleViewLabel(view: InternalOperationsView): string {
  const meta = internalViewTitles[view];
  if (!meta) return view;
  if (meta.title === "Dashboard" || meta.title.toLowerCase().includes("dashboard")) {
    return `${meta.subtitle} · ${meta.title}`;
  }
  return meta.title;
}

export function toggleModuleGroup(
  group: ModuleGrantGroup,
  allowedViews: InternalOperationsView[],
  enabled: boolean,
): InternalOperationsView[] {
  const next = new Set(allowedViews);
  for (const view of ALWAYS_ALLOWED_VIEWS) next.add(view);
  if (enabled) {
    for (const view of group.views) next.add(view);
  } else {
    for (const view of group.views) next.delete(view);
  }
  return [...next];
}

export function toggleModuleView(
  view: InternalOperationsView,
  allowedViews: InternalOperationsView[],
  enabled: boolean,
): InternalOperationsView[] {
  const next = new Set(allowedViews);
  for (const always of ALWAYS_ALLOWED_VIEWS) next.add(always);
  if (enabled) next.add(view);
  else if (!(ALWAYS_ALLOWED_VIEWS as readonly string[]).includes(view)) next.delete(view);
  return [...next];
}

export function normalizeAllowedViews(
  value: unknown,
): InternalOperationsView[] | null {
  if (value == null) return null;
  if (!Array.isArray(value)) return null;
  const known = new Set(internalOperationsViews);
  const views = value
    .map((entry) => String(entry))
    .filter((entry): entry is InternalOperationsView =>
      known.has(entry as InternalOperationsView),
    );
  return views.length > 0 ? views : null;
}

export function normalizeHomeTiles(value: unknown): CommandCentreHomeTileId[] | null {
  if (value == null) return null;
  if (!Array.isArray(value)) return null;
  const known = new Set(COMMAND_CENTRE_HOME_TILE_CATALOG.map((tile) => tile.id));
  const tiles = value
    .map((entry) => String(entry))
    .filter((entry): entry is CommandCentreHomeTileId =>
      known.has(entry as CommandCentreHomeTileId),
    );
  return tiles.length > 0 ? tiles : null;
}
