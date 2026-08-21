/**
 * Canonical L1 module registry — extensible; not frozen at 22.
 */

import type { CanonicalModuleDefinition } from "./types";

export const CANONICAL_MODULES: readonly CanonicalModuleDefinition[] = [
  { id: "home", label: "Home", navLabelAliases: ["Home", "PIN"] },
  { id: "executive-assistant", label: "Executive Assistant", navLabelAliases: ["Executive Assistant"] },
  { id: "northstar-intelligence", label: "Northstar Intelligence", optional: true, navLabelAliases: [
    "Northstar Intelligence",
    "OnwardAir Intelligence",
    "ABHI Intelligence",
    "Talanton Intelligence",
  ] },
  { id: "business-central", label: "Business Central", navLabelAliases: ["Business Central"] },
  { id: "sales-management", label: "Sales Management", navLabelAliases: ["Sales Management"] },
  { id: "financials", label: "Finances", navLabelAliases: ["Finances", "Financials"] },
  { id: "fundraising", label: "Fundraising", optional: true, navLabelAliases: ["Fundraising"] },
  { id: "board", label: "Board", navLabelAliases: ["Board"] },
  { id: "corporate-information", label: "Corporate Information", navLabelAliases: ["Corporate Information"] },
  { id: "operations", label: "Operations", navLabelAliases: ["Operations"] },
  { id: "marketing-events", label: "Marketing & Events", optional: true, navLabelAliases: [
    "Marketing & Events",
    "Marketing & Stories",
  ] },
  { id: "engineering", label: "Engineering", optional: true, navLabelAliases: ["Engineering"] },
  { id: "technology-management", label: "Technology Management", navLabelAliases: ["Technology Management"] },
  { id: "human-resources", label: "Human Resources", navLabelAliases: ["Human Resources"] },
  { id: "support-desk", label: "Support Desk", navLabelAliases: ["Support Desk"] },
  { id: "business-productivity", label: "Business Productivity", navLabelAliases: ["Business Productivity"] },
  { id: "training", label: "Training", navLabelAliases: ["Training"] },
  { id: "qms", label: "QMS", optional: true, navLabelAliases: ["QMS"] },
  { id: "tools", label: "Tools", navLabelAliases: ["Tools"] },
  { id: "external-client-access", label: "External Client Access", navLabelAliases: ["External Client Access"] },
  { id: "project-management", label: "Project Management", navLabelAliases: ["Project Management"] },
  { id: "settings", label: "Settings", navLabelAliases: ["Settings"] },
  { id: "funds", label: "Funds", optional: true, navLabelAliases: ["Funds"] },
  { id: "portfolio-companies", label: "Portfolio Companies", optional: true, navLabelAliases: ["Portfolio Companies"] },
] as const;

const labelToModuleId = new Map<string, string>();

for (const mod of CANONICAL_MODULES) {
  for (const alias of mod.navLabelAliases) {
    labelToModuleId.set(alias.toLowerCase(), mod.id);
  }
}

export function resolveModuleIdFromNavLabel(label: string): string | null {
  return labelToModuleId.get(label.trim().toLowerCase()) ?? null;
}

export function getCanonicalModule(id: string): CanonicalModuleDefinition | null {
  return CANONICAL_MODULES.find((m) => m.id === id) ?? null;
}

export function listCanonicalModules(): readonly CanonicalModuleDefinition[] {
  return CANONICAL_MODULES;
}

/** Functional domain ids — stable identity separate from nav placement */
export const FUNCTIONAL_DOMAINS = {
  management: "management",
  capTable: "cap-table",
  contentStudio: "content-studio",
  clients: "clients",
  portfolioCompanies: "portfolio-companies",
  crm: "crm",
  projects: "projects",
  employees: "employees",
  invoices: "invoices",
  cash: "cash",
  supportTickets: "support-tickets",
  intelligence: "intelligence",
  members: "members",
  funds: "funds",
} as const;
