import type { CommandCentreHomeTileId } from "@/lib/command-centre-home-tiles";
import {
  COMMAND_CENTRE_HOME_TILE_CATALOG,
  DEFAULT_COMMAND_CENTRE_HOME_LAYOUT,
} from "@/lib/command-centre-home-tiles";
import {
  internalOperationsViews,
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
    id: "clients",
    label: "Clients",
    section: "Business Central",
    views: ["clients-dashboard", "clients"],
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
      "hr-recruitment",
      "hr-leave",
      "hr-payroll",
      "hr-performance",
      "hr-reports",
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
      "corporate-advisers",
      "corporate-insurance",
      "corporate-software",
      "corporate-contracts",
      "unit311-details",
    ],
  },
  {
    id: "strategy",
    label: "Strategy & Competitors",
    section: "Strategy",
    views: ["strategy", "competitors", "whiteboard", "representatives"],
  },
  {
    id: "operations-assets",
    label: "Assets & Inventory",
    section: "Operations",
    views: ["assets", "inventory-management", "procurement", "fleet", "logistics"],
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
    views: ["training", "training-dashboard"],
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
    } else if (department === "Corporate") {
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
