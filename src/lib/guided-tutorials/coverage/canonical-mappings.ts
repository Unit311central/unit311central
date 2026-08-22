import { FINANCES_MODULE_LABEL } from "@/lib/finances-nav";
import { listTutorialDefinitions } from "@/lib/guided-tutorials/registry";
import {
  internalViewTitles,
  type InternalOperationsView,
} from "@/lib/internal-operations-data";
import { SALES_MANAGEMENT_MODULE_LABEL } from "@/lib/sales-management-nav";

import type { DiscoveredNavLeaf } from "./types";
import { runtimeBindingKey } from "./nav-leaves";

import type { TutorialMappingConfidence } from "./types";

export type CanonicalProductMapping = {
  tutorialId: string;
  moduleSlug: string;
  functionSlug: string;
  moduleLabel: string;
  functionLabel: string;
  sectionLabel: string;
  mappingConfidence: TutorialMappingConfidence;
};

/** Product module slug from canonical platform labels (not workspace/pack names). */
export const PRODUCT_MODULE_SLUG_BY_LABEL: Readonly<Record<string, string>> = {
  "Business Central": "business-central",
  [SALES_MANAGEMENT_MODULE_LABEL]: "sales-management",
  [FINANCES_MODULE_LABEL]: "financials",
  "Human Resources": "human-resources",
  "Corporate Information": "corporate-information",
  "Technology Management": "technology-management",
  "Business Productivity": "business-productivity",
  "Support Desk": "support-desk",
  Operations: "operations",
  Training: "training",
  QMS: "qms",
  Tools: "tools",
  "External Client Access": "external-client-access",
  Settings: "settings",
  Board: "board",
  Fundraising: "fundraising",
  Engineering: "engineering",
  "OnwardAir Intelligence": "intelligence",
  "Marketing & Events": "marketing-events",
  "Project Management": "project-management",
  "IP & Patents": "intellectual-property",
  Home: "home",
};

/**
 * Central Unit311Central tutorial catalogue — explicit runtime-binding → central product function.
 *
 * Architecture (locked):
 *   CENTRAL MODULE → CENTRAL PRODUCT FUNCTION → CENTRAL TUTORIAL ID → runtime binding(s) → workspace availability
 *
 * Tutorial identity is workspace-independent. A central tutorial may have bindings in one or many
 * workspace packs today; future workspaces inherit the same tutorial when the function is enabled.
 */
export const EXPLICIT_BINDING_MAPPINGS: Readonly<
  Record<
    string,
    Omit<CanonicalProductMapping, "mappingConfidence"> & {
      mappingConfidence?: TutorialMappingConfidence;
    }
  >
> = {
  "home:": {
    tutorialId: "home",
    moduleSlug: "home",
    functionSlug: "home",
    moduleLabel: "Home",
    functionLabel: "Home",
    sectionLabel: "Home",
    mappingConfidence: "confirmed",
  },
  "executive-assistant:": {
    tutorialId: "executive-assistant",
    moduleSlug: "executive-assistant",
    functionSlug: "executive-assistant",
    moduleLabel: "Executive Assistant",
    functionLabel: "Executive Assistant",
    sectionLabel: "Executive Assistant",
    mappingConfidence: "confirmed",
  },
  "financials:": {
    tutorialId: "financials.dashboard",
    moduleSlug: "financials",
    functionSlug: "dashboard",
    moduleLabel: FINANCES_MODULE_LABEL,
    functionLabel: "Dashboard",
    sectionLabel: FINANCES_MODULE_LABEL,
    mappingConfidence: "confirmed",
  },
  "sales-management:commissions": {
    tutorialId: "sales-management.commissions",
    moduleSlug: "sales-management",
    functionSlug: "commissions",
    moduleLabel: SALES_MANAGEMENT_MODULE_LABEL,
    functionLabel: "Commissions",
    sectionLabel: "Management",
    mappingConfidence: "confirmed",
  },
  "sales-management:dashboard": {
    tutorialId: "sales-management.dashboard",
    moduleSlug: "sales-management",
    functionSlug: "dashboard",
    moduleLabel: SALES_MANAGEMENT_MODULE_LABEL,
    functionLabel: "Dashboard",
    sectionLabel: "Sales Management",
    mappingConfidence: "confirmed",
  },
  "clients-dashboard:": {
    tutorialId: "business-central.clients",
    moduleSlug: "business-central",
    functionSlug: "clients",
    moduleLabel: "Business Central",
    functionLabel: "Clients Dashboard",
    sectionLabel: "Clients",
    mappingConfidence: "confirmed",
  },
  "clients:": {
    tutorialId: "business-central.client-directory",
    moduleSlug: "business-central",
    functionSlug: "client-directory",
    moduleLabel: "Business Central",
    functionLabel: "Client Directory",
    sectionLabel: "Clients",
    mappingConfidence: "confirmed",
  },
  "crm:": {
    tutorialId: "business-central.pipeline",
    moduleSlug: "business-central",
    functionSlug: "pipeline",
    moduleLabel: "Business Central",
    functionLabel: "Pipeline",
    sectionLabel: "Customer Management",
    mappingConfidence: "confirmed",
  },
  "crm-meetings:": {
    tutorialId: "business-central.discovery",
    moduleSlug: "business-central",
    functionSlug: "discovery",
    moduleLabel: "Business Central",
    functionLabel: "Discovery",
    sectionLabel: "Customer Management",
    mappingConfidence: "confirmed",
  },
  "sales-quotes:": {
    tutorialId: "business-central.sales-quotes",
    moduleSlug: "business-central",
    functionSlug: "sales-quotes",
    moduleLabel: "Business Central",
    functionLabel: "Sales Quotes",
    sectionLabel: "Customer Management",
    mappingConfidence: "confirmed",
  },
  "client-onboarding:": {
    tutorialId: "business-central.client-onboarding",
    moduleSlug: "business-central",
    functionSlug: "client-onboarding",
    moduleLabel: "Business Central",
    functionLabel: "Client Onboarding",
    sectionLabel: "Customer Management",
    mappingConfidence: "confirmed",
  },
  "potential-clients:": {
    tutorialId: "business-central.potential-clients",
    moduleSlug: "business-central",
    functionSlug: "potential-clients",
    moduleLabel: "Business Central",
    functionLabel: "Potential Clients",
    sectionLabel: "Customer Management",
    mappingConfidence: "confirmed",
  },
  "projects-dashboard:": {
    tutorialId: "business-central.projects",
    moduleSlug: "business-central",
    functionSlug: "projects",
    moduleLabel: "Business Central",
    functionLabel: "Projects Dashboard",
    sectionLabel: "Projects",
    mappingConfidence: "confirmed",
  },
  "accounts-receivable:": {
    tutorialId: "financials.accounts-receivable",
    moduleSlug: "financials",
    functionSlug: "accounts-receivable",
    moduleLabel: FINANCES_MODULE_LABEL,
    functionLabel: "Accounts Receivable",
    sectionLabel: "Accounting",
    mappingConfidence: "confirmed",
  },
  "accounts-receivable:outstanding": {
    tutorialId: "financials.receivable-outstanding",
    moduleSlug: "financials",
    functionSlug: "receivable-outstanding",
    moduleLabel: FINANCES_MODULE_LABEL,
    functionLabel: "Outstanding Receivables",
    sectionLabel: "Accounting",
    mappingConfidence: "confirmed",
  },
  "accounts-payable:invoices": {
    tutorialId: "financials.supplier-invoices",
    moduleSlug: "financials",
    functionSlug: "supplier-invoices",
    moduleLabel: FINANCES_MODULE_LABEL,
    functionLabel: "Supplier Invoices",
    sectionLabel: "Accounting",
    mappingConfidence: "confirmed",
  },
  "accounts-payable:outstanding": {
    tutorialId: "financials.payable-outstanding",
    moduleSlug: "financials",
    functionSlug: "payable-outstanding",
    moduleLabel: FINANCES_MODULE_LABEL,
    functionLabel: "Outstanding Payables",
    sectionLabel: "Accounting",
    mappingConfidence: "confirmed",
  },
  "accounts-payable:approvals": {
    tutorialId: "financials.payable-approvals",
    moduleSlug: "financials",
    functionSlug: "payable-approvals",
    moduleLabel: FINANCES_MODULE_LABEL,
    functionLabel: "Payable Approvals",
    sectionLabel: "Accounting",
    mappingConfidence: "confirmed",
  },
  "finances-expense-approvals:": {
    tutorialId: "financials.expense-approvals",
    moduleSlug: "financials",
    functionSlug: "expense-approvals",
    moduleLabel: FINANCES_MODULE_LABEL,
    functionLabel: "Expense Approvals",
    sectionLabel: "Accounting",
    mappingConfidence: "confirmed",
  },
  "general-ledger:journal": {
    tutorialId: "financials.journal",
    moduleSlug: "financials",
    functionSlug: "journal",
    moduleLabel: FINANCES_MODULE_LABEL,
    functionLabel: "Journal Entries",
    sectionLabel: "Accounting",
    mappingConfidence: "confirmed",
  },
  "wise:": {
    tutorialId: "financials.wise",
    moduleSlug: "financials",
    functionSlug: "wise",
    moduleLabel: FINANCES_MODULE_LABEL,
    functionLabel: "Bank",
    sectionLabel: "Banking & Cash",
    mappingConfidence: "confirmed",
  },
  "corporate-dashboard:": {
    tutorialId: "corporate-information.dashboard",
    moduleSlug: "corporate-information",
    functionSlug: "dashboard",
    moduleLabel: "Corporate Information",
    functionLabel: "Dashboard",
    sectionLabel: "Corporate Information",
    mappingConfidence: "confirmed",
  },
  "unit311-details:": {
    tutorialId: "corporate-information.unit311-details",
    moduleSlug: "corporate-information",
    functionSlug: "unit311-details",
    moduleLabel: "Corporate Information",
    functionLabel: "Unit311 Details",
    sectionLabel: "Corporate Information",
    mappingConfidence: "confirmed",
  },
  "engineering-capacity:": {
    tutorialId: "engineering.team-capacity",
    moduleSlug: "engineering",
    functionSlug: "team-capacity",
    moduleLabel: "Engineering",
    functionLabel: "Team & Capacity",
    sectionLabel: "Engineering",
    mappingConfidence: "confirmed",
  },
  "oa-team-capacity:": {
    tutorialId: "engineering.team-capacity",
    moduleSlug: "engineering",
    functionSlug: "team-capacity",
    moduleLabel: "Engineering",
    functionLabel: "Team & Capacity",
    sectionLabel: "Engineering",
    mappingConfidence: "derived",
  },
  "engineering-programs:": {
    tutorialId: "engineering.programs-milestones",
    moduleSlug: "engineering",
    functionSlug: "programs-milestones",
    moduleLabel: "Engineering",
    functionLabel: "Programs & Milestones",
    sectionLabel: "Engineering",
    mappingConfidence: "confirmed",
  },
  "oa-programs-milestones:": {
    tutorialId: "engineering.programs-milestones",
    moduleSlug: "engineering",
    functionSlug: "programs-milestones",
    moduleLabel: "Engineering",
    functionLabel: "Programs & Milestones",
    sectionLabel: "Engineering",
    mappingConfidence: "derived",
  },
  "oa-competitor-intelligence:": {
    tutorialId: "intelligence.competitor-intelligence",
    moduleSlug: "intelligence",
    functionSlug: "competitor-intelligence",
    moduleLabel: "Intelligence",
    functionLabel: "Competitor Intelligence",
    sectionLabel: "Intelligence",
    mappingConfidence: "derived",
  },
  "oa-ecosystem-partners:": {
    tutorialId: "intelligence.ecosystem-partners",
    moduleSlug: "intelligence",
    functionSlug: "ecosystem-partners",
    moduleLabel: "Intelligence",
    functionLabel: "Ecosystem Partners",
    sectionLabel: "Intelligence",
    mappingConfidence: "derived",
  },
  "marketing-newsletter:": {
    tutorialId: "marketing-events.digital-newsletter",
    moduleSlug: "marketing-events",
    functionSlug: "digital-newsletter",
    moduleLabel: "Marketing & Events",
    functionLabel: "Digital Newsletter",
    sectionLabel: "Marketing & Events",
    mappingConfidence: "confirmed",
  },
  "stories-newsletter:": {
    tutorialId: "marketing-events.digital-newsletter",
    moduleSlug: "marketing-events",
    functionSlug: "digital-newsletter",
    moduleLabel: "Marketing & Events",
    functionLabel: "Digital Newsletter",
    sectionLabel: "Marketing & Events",
    mappingConfidence: "confirmed",
  },
  "marketing-mailing-list:": {
    tutorialId: "marketing-events.mailing-list-management",
    moduleSlug: "marketing-events",
    functionSlug: "mailing-list-management",
    moduleLabel: "Marketing & Events",
    functionLabel: "Mailing List Management",
    sectionLabel: "Marketing & Events",
    mappingConfidence: "confirmed",
  },
  "stories-mailing-list:": {
    tutorialId: "marketing-events.mailing-list-management",
    moduleSlug: "marketing-events",
    functionSlug: "mailing-list-management",
    moduleLabel: "Marketing & Events",
    functionLabel: "Mailing List Management",
    sectionLabel: "Marketing & Events",
    mappingConfidence: "confirmed",
  },
  "journey-stories:": {
    tutorialId: "marketing-events.journey-stories",
    moduleSlug: "marketing-events",
    functionSlug: "journey-stories",
    moduleLabel: "Marketing & Events",
    functionLabel: "Journey Stories",
    sectionLabel: "Marketing & Events",
    mappingConfidence: "confirmed",
  },
  "stories-media-library:": {
    tutorialId: "marketing-events.media-library",
    moduleSlug: "marketing-events",
    functionSlug: "media-library",
    moduleLabel: "Marketing & Events",
    functionLabel: "Media Library",
    sectionLabel: "Marketing & Events",
    mappingConfidence: "confirmed",
  },
  "portfolio-stories:": {
    tutorialId: "marketing-events.portfolio-stories",
    moduleSlug: "marketing-events",
    functionSlug: "portfolio-stories",
    moduleLabel: "Marketing & Events",
    functionLabel: "Portfolio Stories",
    sectionLabel: "Marketing & Events",
    mappingConfidence: "confirmed",
  },
  "fundraising-investors:": {
    tutorialId: "fundraising.investors",
    moduleSlug: "fundraising",
    functionSlug: "investors",
    moduleLabel: "Fundraising",
    functionLabel: "Investors",
    sectionLabel: "Fundraising",
    mappingConfidence: "confirmed",
  },
  "funds-investors:": {
    tutorialId: "fundraising.investors",
    moduleSlug: "fundraising",
    functionSlug: "investors",
    moduleLabel: "Fundraising",
    functionLabel: "Investors",
    sectionLabel: "Fundraising",
    mappingConfidence: "confirmed",
  },
  "funds-dashboard:": {
    tutorialId: "fundraising.fund-platform-dashboard",
    moduleSlug: "fundraising",
    functionSlug: "fund-platform-dashboard",
    moduleLabel: "Fundraising",
    functionLabel: "Fund Platform Dashboard",
    sectionLabel: "Fundraising",
    mappingConfidence: "confirmed",
  },
  "funds-commitments:": {
    tutorialId: "fundraising.capital-commitments",
    moduleSlug: "fundraising",
    functionSlug: "capital-commitments",
    moduleLabel: "Fundraising",
    functionLabel: "Capital Commitments",
    sectionLabel: "Fundraising",
    mappingConfidence: "confirmed",
  },
  "funds-performance:": {
    tutorialId: "fundraising.fund-performance",
    moduleSlug: "fundraising",
    functionSlug: "fund-performance",
    moduleLabel: "Fundraising",
    functionLabel: "Fund Performance",
    sectionLabel: "Fundraising",
    mappingConfidence: "confirmed",
  },
  "funds-impact:": {
    tutorialId: "fundraising.fund-profile",
    moduleSlug: "fundraising",
    functionSlug: "fund-profile",
    moduleLabel: "Fundraising",
    functionLabel: "Fund Profile",
    sectionLabel: "Fundraising",
    mappingConfidence: "confirmed",
  },
  "funds-momentum:": {
    tutorialId: "fundraising.fund-profile",
    moduleSlug: "fundraising",
    functionSlug: "fund-profile",
    moduleLabel: "Fundraising",
    functionLabel: "Fund Profile",
    sectionLabel: "Fundraising",
    mappingConfidence: "confirmed",
  },
  "funds-stewards:": {
    tutorialId: "fundraising.fund-profile",
    moduleSlug: "fundraising",
    functionSlug: "fund-profile",
    moduleLabel: "Fundraising",
    functionLabel: "Fund Profile",
    sectionLabel: "Fundraising",
    mappingConfidence: "confirmed",
  },
  "portfolio-dashboard:": {
    tutorialId: "business-central.portfolio-dashboard",
    moduleSlug: "business-central",
    functionSlug: "portfolio-dashboard",
    moduleLabel: "Business Central",
    functionLabel: "Portfolio Dashboard",
    sectionLabel: "Portfolio",
    mappingConfidence: "confirmed",
  },
  "portfolio-directory:": {
    tutorialId: "business-central.portfolio-directory",
    moduleSlug: "business-central",
    functionSlug: "portfolio-directory",
    moduleLabel: "Business Central",
    functionLabel: "Portfolio Directory",
    sectionLabel: "Portfolio",
    mappingConfidence: "confirmed",
  },
  "portfolio-portal-overview:": {
    tutorialId: "external-client-access.portal-overview",
    moduleSlug: "external-client-access",
    functionSlug: "portal-overview",
    moduleLabel: "External Client Access",
    functionLabel: "Portal Overview",
    sectionLabel: "External Client Access",
    mappingConfidence: "confirmed",
  },
  "portfolio-intelligence-briefing:": {
    tutorialId: "intelligence.portfolio-briefing",
    moduleSlug: "intelligence",
    functionSlug: "portfolio-briefing",
    moduleLabel: "Intelligence",
    functionLabel: "Portfolio Executive Briefing",
    sectionLabel: "Intelligence",
    mappingConfidence: "confirmed",
  },
  "portfolio-intelligence-company:": {
    tutorialId: "intelligence.portfolio-company",
    moduleSlug: "intelligence",
    functionSlug: "portfolio-company",
    moduleLabel: "Intelligence",
    functionLabel: "Portfolio Company Intelligence",
    sectionLabel: "Intelligence",
    mappingConfidence: "confirmed",
  },
  "quarterly-portfolio-update:": {
    tutorialId: "intelligence.quarterly-portfolio-update",
    moduleSlug: "intelligence",
    functionSlug: "quarterly-portfolio-update",
    moduleLabel: "Intelligence",
    functionLabel: "Quarterly Portfolio Update",
    sectionLabel: "Intelligence",
    mappingConfidence: "confirmed",
  },
  "impact-intelligence-dashboard:": {
    tutorialId: "intelligence.impact-dashboard",
    moduleSlug: "intelligence",
    functionSlug: "impact-dashboard",
    moduleLabel: "Intelligence",
    functionLabel: "Impact Dashboard",
    sectionLabel: "Intelligence",
    mappingConfidence: "confirmed",
  },
  "impact-intelligence-company:": {
    tutorialId: "intelligence.company-impact",
    moduleSlug: "intelligence",
    functionSlug: "company-impact",
    moduleLabel: "Intelligence",
    functionLabel: "Company Impact",
    sectionLabel: "Intelligence",
    mappingConfidence: "confirmed",
  },
  "annual-impact-report:": {
    tutorialId: "intelligence.annual-impact-report",
    moduleSlug: "intelligence",
    functionSlug: "annual-impact-report",
    moduleLabel: "Intelligence",
    functionLabel: "Annual Impact Report",
    sectionLabel: "Intelligence",
    mappingConfidence: "confirmed",
  },
  "opportunity-intelligence:": {
    tutorialId: "intelligence.opportunity-intelligence",
    moduleSlug: "intelligence",
    functionSlug: "opportunity-intelligence",
    moduleLabel: "Intelligence",
    functionLabel: "Opportunity Intelligence",
    sectionLabel: "Intelligence",
    mappingConfidence: "confirmed",
  },
  "regulatory-dashboard:": {
    tutorialId: "intelligence.regulatory-dashboard",
    moduleSlug: "intelligence",
    functionSlug: "regulatory-dashboard",
    moduleLabel: "Intelligence",
    functionLabel: "Regulatory Intelligence Dashboard",
    sectionLabel: "Intelligence",
    mappingConfidence: "confirmed",
  },
  "regulatory-updates:": {
    tutorialId: "intelligence.regulatory-updates",
    moduleSlug: "intelligence",
    functionSlug: "regulatory-updates",
    moduleLabel: "Intelligence",
    functionLabel: "Regulatory Updates",
    sectionLabel: "Intelligence",
    mappingConfidence: "confirmed",
  },
  "regulatory-impact:": {
    tutorialId: "intelligence.regulatory-impact-assessments",
    moduleSlug: "intelligence",
    functionSlug: "regulatory-impact-assessments",
    moduleLabel: "Intelligence",
    functionLabel: "Regulatory Impact Assessments",
    sectionLabel: "Intelligence",
    mappingConfidence: "confirmed",
  },
  "regulatory-alerts:": {
    tutorialId: "intelligence.regulatory-member-alerts",
    moduleSlug: "intelligence",
    functionSlug: "regulatory-member-alerts",
    moduleLabel: "Intelligence",
    functionLabel: "Regulatory Member Alerts",
    sectionLabel: "Intelligence",
    mappingConfidence: "confirmed",
  },
};

/** Dashboard viewIds mapped to explicit product module + function slug. */
const DASHBOARD_VIEW_MAPPINGS: Readonly<
  Record<string, { moduleSlug: string; functionSlug?: string }>
> = {
  "hr-dashboard": { moduleSlug: "human-resources" },
  "corporate-dashboard": { moduleSlug: "corporate-information" },
  "technology-dashboard": { moduleSlug: "technology-management" },
  "productivity-dashboard": { moduleSlug: "business-productivity" },
  "operations-dashboard": { moduleSlug: "operations" },
  "training-dashboard": { moduleSlug: "training" },
  "quality-management": { moduleSlug: "qms" },
  "fundraising-dashboard": { moduleSlug: "fundraising" },
  "board-dashboard": { moduleSlug: "board" },
  "oa-marketing-dashboard": { moduleSlug: "marketing-events" },
  "business-central-dashboard": { moduleSlug: "business-central" },
  "external-client-access": { moduleSlug: "external-client-access", functionSlug: "dashboard" },
};

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildTutorialId(moduleSlug: string, functionSlug: string): string {
  if (moduleSlug === "home" && functionSlug === "home") return "home";
  if (moduleSlug === "executive-assistant") return "executive-assistant";
  return `${moduleSlug}.${functionSlug}`;
}

function productModuleSlug(moduleLabel: string, viewId: string): string {
  if (viewId === "home") return "home";
  if (viewId === "executive-assistant") return "executive-assistant";
  return PRODUCT_MODULE_SLUG_BY_LABEL[moduleLabel] ?? slugify(moduleLabel);
}

function deriveFunctionSlug(functionLabel: string, tabKey?: string, viewId?: string): string {
  if (tabKey) return slugify(tabKey);
  if (slugify(functionLabel) === "dashboard" && viewId) {
    const dash = DASHBOARD_VIEW_MAPPINGS[viewId];
    if (dash?.functionSlug) return dash.functionSlug;
    return "dashboard";
  }
  return slugify(functionLabel);
}

function isPackOnlyUnclear(
  leaf: DiscoveredNavLeaf,
  inBaseNav: boolean,
): boolean {
  if (leaf.workspaceSlugs.length !== 1) return false;
  if (inBaseNav) return false;
  const bindingKey = runtimeBindingKey(leaf.viewId, leaf.tabKey);
  if (EXPLICIT_BINDING_MAPPINGS[bindingKey]) return false;
  const titles = internalViewTitles[leaf.viewId as InternalOperationsView];
  if (!titles) return true;
  const moduleLabel = titles.subtitle || titles.title;
  return !PRODUCT_MODULE_SLUG_BY_LABEL[moduleLabel];
}

export function resolveCanonicalProductMapping(
  leaf: DiscoveredNavLeaf,
  labels: {
    moduleLabel: string;
    sectionLabel: string;
    functionLabel: string;
  },
  options: { inBaseNav: boolean },
): CanonicalProductMapping {
  const bindingKey = runtimeBindingKey(leaf.viewId, leaf.tabKey);

  const explicit = EXPLICIT_BINDING_MAPPINGS[bindingKey];
  if (explicit) {
    return {
      ...explicit,
      mappingConfidence: explicit.mappingConfidence ?? "confirmed",
    };
  }

  const registered = listTutorialDefinitions().find(
    (tutorial) => runtimeBindingKey(tutorial.viewId, tutorial.tabKey) === bindingKey,
  );
  if (registered) {
    const moduleSlug = productModuleSlug(labels.moduleLabel, leaf.viewId);
    const functionSlug = deriveFunctionSlug(labels.functionLabel, leaf.tabKey, leaf.viewId);
    return {
      tutorialId: registered.tutorialId,
      moduleSlug,
      functionSlug,
      moduleLabel: labels.moduleLabel,
      functionLabel: labels.functionLabel,
      sectionLabel: labels.sectionLabel,
      mappingConfidence: "confirmed",
    };
  }

  if (isPackOnlyUnclear(leaf, options.inBaseNav)) {
    return {
      tutorialId: `needs-mapping.${slugify(leaf.viewId)}${leaf.tabKey ? `.${slugify(leaf.tabKey)}` : ""}`,
      moduleSlug: "needs-mapping",
      functionSlug: slugify(leaf.viewId),
      moduleLabel: labels.moduleLabel,
      functionLabel: labels.functionLabel,
      sectionLabel: labels.sectionLabel,
      mappingConfidence: "needs_mapping",
    };
  }

  const dashMapping = DASHBOARD_VIEW_MAPPINGS[leaf.viewId];
  let moduleSlug = dashMapping?.moduleSlug ?? productModuleSlug(labels.moduleLabel, leaf.viewId);
  let functionSlug = deriveFunctionSlug(labels.functionLabel, leaf.tabKey, leaf.viewId);

  if (dashMapping && !leaf.tabKey && slugify(labels.functionLabel) === "dashboard") {
    functionSlug = dashMapping.functionSlug ?? "dashboard";
  }

  if (leaf.tabKey && leaf.viewId === "sales-management") {
    moduleSlug = "sales-management";
    functionSlug = slugify(leaf.tabKey);
  }

  if (leaf.tabKey && leaf.viewId === "general-ledger") {
    moduleSlug = "financials";
    functionSlug = slugify(leaf.tabKey);
  }

  if (leaf.tabKey && leaf.viewId === "accounts-receivable") {
    moduleSlug = "financials";
    functionSlug = slugify(leaf.tabKey || labels.functionLabel);
  }

  if (leaf.tabKey && leaf.viewId === "accounts-payable") {
    moduleSlug = "financials";
    functionSlug = slugify(leaf.tabKey);
  }

  const tutorialId = buildTutorialId(moduleSlug, functionSlug);

  return {
    tutorialId,
    moduleSlug,
    functionSlug,
    moduleLabel: labels.moduleLabel,
    functionLabel: labels.functionLabel,
    sectionLabel: labels.sectionLabel,
    mappingConfidence: options.inBaseNav ? "derived" : "derived",
  };
}

/** @deprecated Use resolveCanonicalProductMapping — registry binding alignment helper. */
export function deriveTutorialId(input: {
  viewId: string;
  tabKey?: string;
  functionLabel: string;
  moduleLabel?: string;
  sectionLabel?: string;
}): string {
  return resolveCanonicalProductMapping(
    {
      viewId: input.viewId,
      tabKey: input.tabKey,
      workspaceSlugs: [],
    },
    {
      moduleLabel: input.moduleLabel ?? input.viewId,
      sectionLabel: input.sectionLabel ?? input.moduleLabel ?? input.viewId,
      functionLabel: input.functionLabel,
    },
    { inBaseNav: true },
  ).tutorialId;
}
