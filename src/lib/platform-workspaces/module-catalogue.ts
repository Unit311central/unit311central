/**
 * Top-level Unit311Central module catalogue for Workspaces provisioning (22 modules).
 * Product numbering 1–22 — Workspaces (23) is internal-only and excluded.
 */

export type WorkspaceSubModuleDefinition = {
  id: string;
  label: string;
  /** Keys written to workspace_modules.module_key when provisioning. */
  moduleKeys: string[];
};

export type WorkspaceModuleCatalogueEntry = {
  number: number;
  id: string;
  label: string;
  subModules: WorkspaceSubModuleDefinition[];
};

export const WORKSPACE_MODULE_CATALOGUE: readonly WorkspaceModuleCatalogueEntry[] = [
  {
    number: 1,
    id: "home",
    label: "HOME",
    subModules: [{ id: "dashboard", label: "Dashboard", moduleKeys: [] }],
  },
  {
    number: 2,
    id: "executive-assistant",
    label: "EXECUTIVE ASSISTANT",
    subModules: [
      { id: "assistant", label: "Executive Assistant", moduleKeys: ["executive-assistant"] },
    ],
  },
  {
    number: 3,
    id: "intelligence",
    label: "INTELLIGENCE",
    subModules: [
      { id: "company", label: "Company Intelligence", moduleKeys: ["strategy"] },
      { id: "client", label: "Client Intelligence", moduleKeys: ["strategy"] },
      { id: "market", label: "Market Intelligence", moduleKeys: ["strategy"] },
    ],
  },
  {
    number: 4,
    id: "business-central",
    label: "BUSINESS CENTRAL",
    subModules: [
      { id: "clients", label: "Clients", moduleKeys: ["clients"] },
      { id: "crm", label: "CRM", moduleKeys: ["crm"] },
      { id: "projects", label: "Projects", moduleKeys: ["projects"] },
      { id: "management", label: "Management", moduleKeys: ["strategy"] },
      { id: "grants", label: "Grants", moduleKeys: ["projects"] },
    ],
  },
  {
    number: 5,
    id: "sales-management",
    label: "SALES MANAGEMENT",
    subModules: [
      { id: "dashboard", label: "Dashboard", moduleKeys: ["crm"] },
      { id: "pipeline", label: "Pipeline", moduleKeys: ["crm"] },
      { id: "partners", label: "Partners", moduleKeys: ["crm"] },
      { id: "quotes", label: "Sales Quotes", moduleKeys: ["crm"] },
    ],
  },
  {
    number: 6,
    id: "financials",
    label: "FINANCES",
    subModules: [
      { id: "overview", label: "Overview", moduleKeys: ["financials"] },
      { id: "general-ledger", label: "General Ledger", moduleKeys: ["financials"] },
      { id: "accounts-receivable", label: "Accounts Receivable", moduleKeys: ["financials"] },
      { id: "accounts-payable", label: "Accounts Payable", moduleKeys: ["financials"] },
      { id: "expenses", label: "Expenses", moduleKeys: ["financials"] },
      { id: "bank", label: "Bank", moduleKeys: ["financials"] },
      { id: "reports", label: "Reports", moduleKeys: ["financials"] },
    ],
  },
  {
    number: 7,
    id: "fundraising",
    label: "FUNDRAISING",
    subModules: [
      { id: "dashboard", label: "Dashboard", moduleKeys: ["strategy"] },
      { id: "investors", label: "Investors", moduleKeys: ["strategy"] },
      { id: "pipeline", label: "Pipeline", moduleKeys: ["strategy"] },
      { id: "cap-table", label: "Cap Table", moduleKeys: ["strategy"] },
    ],
  },
  {
    number: 8,
    id: "board",
    label: "BOARD",
    subModules: [
      { id: "dashboard", label: "Board Dashboard", moduleKeys: ["strategy"] },
      { id: "meetings", label: "Meetings", moduleKeys: ["strategy"] },
      { id: "minutes", label: "Minutes & Decisions", moduleKeys: ["strategy"] },
      { id: "board-pack", label: "Board Pack", moduleKeys: ["strategy"] },
    ],
  },
  {
    number: 9,
    id: "corporate-information",
    label: "CORPORATE INFORMATION",
    subModules: [
      { id: "dashboard", label: "Dashboard", moduleKeys: ["strategy"] },
      { id: "company-details", label: "Company Details", moduleKeys: ["strategy"] },
      { id: "office-locations", label: "Office Locations", moduleKeys: ["strategy"] },
      { id: "bank-accounts", label: "Bank Accounts", moduleKeys: ["strategy"] },
      { id: "software", label: "Software & Licences", moduleKeys: ["profiles"] },
    ],
  },
  {
    number: 10,
    id: "operations",
    label: "OPERATIONS",
    subModules: [
      { id: "dashboard", label: "Dashboard", moduleKeys: ["assets-inventory"] },
      { id: "assets", label: "Assets", moduleKeys: ["assets-inventory"] },
      { id: "inventory", label: "Inventory Management", moduleKeys: ["assets-inventory"] },
      { id: "logistics", label: "Logistics", moduleKeys: ["logistics"] },
    ],
  },
  {
    number: 11,
    id: "marketing-events",
    label: "MARKETING AND EVENTS",
    subModules: [
      { id: "newsletter", label: "Newsletter", moduleKeys: ["social"] },
      { id: "events", label: "Events", moduleKeys: ["social"] },
      { id: "mailing-list", label: "Mailing List", moduleKeys: ["social"] },
    ],
  },
  {
    number: 12,
    id: "technology-management",
    label: "TECH MGMT",
    subModules: [
      { id: "dashboard", label: "Dashboard", moduleKeys: ["engineering-rnd"] },
      { id: "architecture", label: "Architecture", moduleKeys: ["engineering-rnd"] },
      { id: "devices", label: "Devices", moduleKeys: ["engineering-rnd"] },
      { id: "software", label: "Software & SaaS", moduleKeys: ["engineering-rnd"] },
      { id: "infrastructure", label: "Infrastructure", moduleKeys: ["engineering-rnd"] },
    ],
  },
  {
    number: 13,
    id: "human-resources",
    label: "HUMAN RESOURCES",
    subModules: [
      { id: "dashboard", label: "Dashboard", moduleKeys: ["hr"] },
      { id: "employees", label: "Employees", moduleKeys: ["hr"] },
      { id: "leave", label: "Leave", moduleKeys: ["hr"] },
      { id: "recruitment", label: "Recruitment", moduleKeys: ["careers"] },
      { id: "performance", label: "Performance", moduleKeys: ["hr"] },
    ],
  },
  {
    number: 14,
    id: "business-productivity",
    label: "BUSINESS PROD",
    subModules: [
      { id: "files", label: "File Explorer", moduleKeys: ["file-explorer"] },
      { id: "calendar", label: "Calendar", moduleKeys: ["email-calendar-messaging"] },
      { id: "email", label: "Email", moduleKeys: ["email-calendar-messaging"] },
      { id: "messaging", label: "Messaging", moduleKeys: ["email-calendar-messaging"] },
      { id: "social", label: "Social", moduleKeys: ["social"] },
    ],
  },
  {
    number: 15,
    id: "support-desk",
    label: "SUPPORT DESK",
    subModules: [
      { id: "overview", label: "Ticket Overview", moduleKeys: ["support"] },
      { id: "tickets", label: "Tickets", moduleKeys: ["support"] },
      { id: "whatsapp", label: "WhatsApp Integration", moduleKeys: ["support"] },
    ],
  },
  {
    number: 16,
    id: "project-management",
    label: "PROJECT MANAGEMENT",
    subModules: [
      { id: "dashboard", label: "Dashboard", moduleKeys: ["projects"] },
      { id: "programs", label: "Programs", moduleKeys: ["projects"] },
      { id: "internal", label: "Internal Projects", moduleKeys: ["projects"] },
      { id: "external", label: "External Projects", moduleKeys: ["projects"] },
    ],
  },
  {
    number: 17,
    id: "engineering",
    label: "ENGINEERING",
    subModules: [
      { id: "dashboard", label: "Dashboard", moduleKeys: ["engineering-rnd"] },
      { id: "programs", label: "Programs & Milestones", moduleKeys: ["engineering-rnd"] },
      { id: "resources", label: "Technology Resourcing", moduleKeys: ["engineering-rnd"] },
      { id: "capacity", label: "Team & Capacity", moduleKeys: ["engineering-rnd"] },
      { id: "risks", label: "Risks", moduleKeys: ["engineering-rnd"] },
    ],
  },
  {
    number: 18,
    id: "training",
    label: "TRAINING",
    subModules: [
      { id: "dashboard", label: "Training Dashboard", moduleKeys: ["training"] },
      { id: "staff", label: "Staff Training", moduleKeys: ["training"] },
      { id: "course-builder", label: "Course Builder", moduleKeys: ["training"] },
    ],
  },
  {
    number: 19,
    id: "qms",
    label: "QMS",
    subModules: [
      { id: "quality-system", label: "Quality Management System", moduleKeys: ["quality-management"] },
      { id: "document-control", label: "Document Control", moduleKeys: ["quality-management"] },
      { id: "capa", label: "CAPA", moduleKeys: ["quality-management"] },
    ],
  },
  {
    number: 20,
    id: "tools",
    label: "TOOLS",
    subModules: [
      { id: "website", label: "Website Management", moduleKeys: ["website-management"] },
      { id: "integrations", label: "Integrations", moduleKeys: ["users"] },
      { id: "testing", label: "Testing", moduleKeys: ["testing"] },
      { id: "telemetry", label: "Telemetry", moduleKeys: ["telemetry"] },
      { id: "users", label: "Users", moduleKeys: ["users"] },
    ],
  },
  {
    number: 21,
    id: "external-client-access",
    label: "EXTERNAL CLIENT ACCESS",
    subModules: [
      { id: "dashboard", label: "Dashboard", moduleKeys: ["users"] },
      { id: "external-users", label: "External Users", moduleKeys: ["users"] },
    ],
  },
  {
    number: 22,
    id: "settings",
    label: "SETTINGS",
    subModules: [
      { id: "profile", label: "Profile", moduleKeys: ["profiles"] },
      { id: "general", label: "General", moduleKeys: ["profiles"] },
      { id: "billing", label: "Billing", moduleKeys: ["profiles"] },
      { id: "appearance", label: "Appearance", moduleKeys: ["profiles"] },
    ],
  },
] as const;

export const WORKSPACE_MODULE_IDS = WORKSPACE_MODULE_CATALOGUE.map((entry) => entry.id);

export function getWorkspaceModuleEntry(moduleId: string): WorkspaceModuleCatalogueEntry | null {
  return WORKSPACE_MODULE_CATALOGUE.find((entry) => entry.id === moduleId) ?? null;
}

export function subModuleKey(moduleId: string, subModuleId: string): string {
  return `${moduleId}:${subModuleId}`;
}

export function parseSubModuleKey(key: string): { moduleId: string; subModuleId: string } | null {
  const idx = key.indexOf(":");
  if (idx <= 0) return null;
  return { moduleId: key.slice(0, idx), subModuleId: key.slice(idx + 1) };
}

export function defaultEnabledModules(): string[] {
  return WORKSPACE_MODULE_CATALOGUE.filter((entry) =>
    ["home", "executive-assistant", "business-central", "financials", "settings"].includes(
      entry.id,
    ),
  ).map((entry) => entry.id);
}

export function defaultEnabledSubModules(moduleIds: readonly string[]): string[] {
  const keys: string[] = [];
  for (const moduleId of moduleIds) {
    const entry = getWorkspaceModuleEntry(moduleId);
    if (!entry) continue;
    for (const sub of entry.subModules) {
      keys.push(subModuleKey(moduleId, sub.id));
    }
  }
  return keys;
}

/** Resolve workspace_modules.module_key values from wizard selections. */
export function resolveProvisioningModuleKeys(
  enabledModules: readonly string[],
  enabledSubModules: readonly string[],
): string[] {
  const keys = new Set<string>();
  const enabledModuleSet = new Set(enabledModules);

  for (const subKey of enabledSubModules) {
    const parsed = parseSubModuleKey(subKey);
    if (!parsed || !enabledModuleSet.has(parsed.moduleId)) continue;
    const entry = getWorkspaceModuleEntry(parsed.moduleId);
    const sub = entry?.subModules.find((item) => item.id === parsed.subModuleId);
    if (!sub) continue;
    for (const moduleKey of sub.moduleKeys) keys.add(moduleKey);
  }

  return [...keys];
}

export function countEnabledModules(
  enabledModules: readonly string[],
  enabledSubModules: readonly string[],
): number {
  return enabledModules.length + enabledSubModules.length;
}
