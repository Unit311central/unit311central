/**
 * Central Unit311Central product navigation — workspace-agnostic source for
 * Workspaces provisioning catalogue (22 modules, all leaf functions).
 *
 * Composed from existing platform nav definitions. Does NOT use Demo, OnwardAir,
 * ABHI, Talanton, or other workspace-specific nav injection.
 */

import { buildFinancesNavSection } from "@/lib/finances-nav";
import { ENGINEERING_SOPS_NAV_ITEM } from "@/lib/engineering-nav";
import { buildManagementNavItem } from "@/lib/central-capabilities/management-nav";
import {
  internalSurveyNavSections,
  type InternalNavChildItem,
  type InternalNavItem,
  type InternalNavSection,
} from "@/lib/internal-operations-data";
import { buildProjectManagementNavSection } from "@/lib/project-management-nav";
import { buildSalesManagementNavSection } from "@/lib/sales-management-nav";

export type CentralProductModuleSpec = {
  number: number;
  id: string;
  label: string;
  section: InternalNavSection;
};

const CORPORATE_PRODUCT_EXCLUDED_VIEWS = new Set([
  "corporate-cap-table",
  "corporate-board-directors",
  "board-meetings",
  "board-pack",
  "corporate-risk-register",
  "unit311-details",
  "module-go-live",
]);

function findWorkspaceSection(label: string): InternalNavSection | null {
  return internalSurveyNavSections.find((section) => section.label === label) ?? null;
}

function filterNavItems(
  items: readonly InternalNavItem[],
  excludeViews: ReadonlySet<string>,
): InternalNavItem[] {
  return items
    .map((item) => {
      if (item.view && excludeViews.has(item.view)) return null;
      if (item.label === "Unit311 Details") return null;
      if (item.children?.length) {
        const children = item.children.filter(
          (child) => !child.view || !excludeViews.has(child.view),
        );
        if (!children.length) return null;
        return { ...item, children };
      }
      return item;
    })
    .filter((item): item is InternalNavItem => item != null);
}

/** Central Business Central — dashboard, client management, management, information repository. */
export function buildCentralBusinessCentralNavSection(): InternalNavSection {
  return {
    kind: "workspace",
    label: "Business Central",
    icon: "Briefcase",
    color: "#2563EB",
    items: [
      { label: "Dashboard", icon: "LayoutDashboard", view: "business-central-dashboard" },
      {
        label: "Client Management",
        icon: "Building2",
        children: [
          { label: "Client Dashboard", view: "clients-dashboard" },
          { label: "Client Directory", view: "clients" },
        ],
      },
      buildManagementNavItem(),
      { label: "Information Repository", icon: "FileText", view: "information-repository" },
    ],
  };
}

/** Central Intelligence — four Core Features (workspace branding varies at runtime). */
export function buildCentralIntelligenceNavSection(): InternalNavSection {
  return {
    kind: "workspace",
    label: "Intelligence",
    icon: "Brain",
    color: "#7C3AED",
    items: [
      { label: "Dashboard", icon: "LayoutDashboard", view: "intelligence-dashboard" },
      { label: "Company Intelligence", icon: "Radar", view: "demo-company-intelligence" },
      { label: "Client Intelligence", icon: "Radar", view: "demo-client-intelligence" },
      { label: "Market Intelligence", icon: "Radar", view: "demo-market-intelligence" },
    ],
  };
}

/** Central Fundraising — from FUNDRAISING_NAV_VIEWS / platform view registry. */
export function buildCentralFundraisingNavSection(): InternalNavSection {
  return {
    kind: "workspace",
    label: "Fundraising",
    icon: "TrendingUp",
    color: "#D97706",
    items: [
      { label: "Dashboard", icon: "LayoutDashboard", view: "fundraising-dashboard" },
      { label: "Investors", icon: "Users", view: "fundraising-investors" },
      { label: "Cap Table Management", icon: "Layers", view: "fundraising-cap-table" },
      { label: "Pipeline", icon: "GitBranch", view: "fundraising-pipeline" },
      { label: "Meetings", icon: "CalendarDays", view: "fundraising-meetings" },
      { label: "Pitch Decks", icon: "Presentation", view: "fundraising-pitch-decks" },
      { label: "Data Rooms", icon: "FolderLock", view: "fundraising-data-rooms" },
      { label: "Grant Management", icon: "ScrollText", view: "grants" },
    ],
  };
}

/** Central Board — governance functions split from Corporate Information. */
export function buildCentralBoardNavSection(): InternalNavSection {
  return {
    kind: "workspace",
    label: "Board",
    icon: "Landmark",
    color: "#1E3A5F",
    items: [
      { label: "Dashboard", icon: "LayoutDashboard", view: "board-dashboard" },
      { label: "Meetings", icon: "CalendarDays", view: "board-meetings" },
      { label: "Minutes & Decisions", icon: "ScrollText", view: "board-minutes" },
      { label: "Board Members", icon: "Users", view: "board-members" },
      { label: "Board deck", icon: "FileText", view: "board-pack" },
      { label: "Risk Register", icon: "AlertTriangle", view: "corporate-risk-register" },
    ],
  };
}

/** Central Corporate Information — company ops only (no board / cap table / internal platform). */
export function buildCentralCorporateInformationNavSection(): InternalNavSection {
  const base = findWorkspaceSection("Corporate Information");
  const items = filterNavItems(base?.items ?? [], CORPORATE_PRODUCT_EXCLUDED_VIEWS).map((item) =>
    item.view === "corporate-company-details" ? { ...item, label: "Company Information" } : item,
  );
  return {
    kind: "workspace",
    label: "Corporate Information",
    icon: "Building2",
    color: "#78716C",
    items,
  };
}

const BUSINESS_PRODUCTIVITY_EXCLUDED_VIEWS = new Set(["social"]);

/** Central Marketing & Events — generic product functions (not ABHI-only accelerators). */
export function buildCentralMarketingEventsNavSection(): InternalNavSection {
  return {
    kind: "workspace",
    label: "Marketing & Events",
    icon: "Megaphone",
    color: "#DB2777",
    items: [
      { label: "Dashboard", icon: "LayoutDashboard", view: "oa-marketing-dashboard" },
      { label: "Digital Newsletter", icon: "Mail", view: "marketing-newsletter" },
      { label: "External Events", icon: "CalendarDays", view: "marketing-events" },
      { label: "Event Management", icon: "Ticket", view: "marketing-event-management" },
      { label: "Mailing List", icon: "Users", view: "marketing-mailing-list" },
      { label: "Client Stories", icon: "BookOpen", view: "portfolio-stories" },
      { label: "Social", icon: "Share2", view: "social" },
    ],
  };
}

/** Central Business Productivity — collaboration tools (Social lives under Marketing & Events). */
export function buildCentralBusinessProductivityNavSection(): InternalNavSection {
  const base = findWorkspaceSection("Business Productivity");
  const items = filterNavItems(base?.items ?? [], BUSINESS_PRODUCTIVITY_EXCLUDED_VIEWS);
  return {
    kind: "workspace",
    label: "Business Productivity",
    icon: base?.icon ?? "MessageSquare",
    color: base?.color ?? "#0891B2",
    items,
  };
}

/** Central Engineering — generic programme delivery (SOPs optional, engineering-only). */
export function buildCentralEngineeringNavSection(): InternalNavSection {
  return {
    kind: "workspace",
    label: "Engineering",
    icon: "Wrench",
    color: "#0D9488",
    items: [
      { label: "Dashboard", icon: "LayoutDashboard", view: "engineering-dashboard" },
      { label: "Programs & Milestones", icon: "Milestone", view: "engineering-programs" },
      { label: "Team & Capacity", icon: "Users", view: "engineering-capacity" },
      { label: "Risks", icon: "AlertTriangle", view: "engineering-risks" },
      { label: "Technical Files", icon: "FolderKanban", view: "engineering-technical-files" },
      ENGINEERING_SOPS_NAV_ITEM,
    ],
  };
}

function pinSection(label: string, view: InternalNavItem["view"], icon: string): InternalNavSection {
  return {
    kind: "pin",
    label: null,
    color: label === "HOME" ? "#2F80ED" : "#12B886",
    items: [{ label, icon, view }],
  };
}

function requireSection(label: string): InternalNavSection {
  const section = findWorkspaceSection(label);
  if (!section) {
    throw new Error(`Central product nav missing workspace section: ${label}`);
  }
  return section;
}

/** WOLF specialist modules — provisioning catalogue (WOLF Central uses dedicated nav). */
export function buildWolfAnimalsNavSection(): InternalNavSection {
  return {
    kind: "workspace",
    label: "Animals",
    icon: "Binoculars",
    color: "#1a4d3a",
    items: [{ label: "Summary", icon: "ScanSearch", view: "wolf-animals" }],
  };
}

export function buildWolfContainmentNavSection(): InternalNavSection {
  return {
    kind: "workspace",
    label: "Containment",
    icon: "Shield",
    color: "#8b4513",
    items: [{ label: "Summary", icon: "ShieldCheck", view: "wolf-containment" }],
  };
}

export function buildWolfEnvironmentNavSection(): InternalNavSection {
  return {
    kind: "workspace",
    label: "Environment",
    icon: "CloudSun",
    color: "#3d5c4a",
    items: [{ label: "Summary", icon: "ThermometerSun", view: "wolf-environment" }],
  };
}

export function buildWolfDroneOperationsNavSection(): InternalNavSection {
  return {
    kind: "workspace",
    label: "Drone Operations",
    icon: "Plane",
    color: "#2d4a3e",
    items: [{ label: "Summary", icon: "Radar", view: "wolf-drone-operations" }],
  };
}

export function buildWolfFleetNavSection(): InternalNavSection {
  return {
    kind: "workspace",
    label: "Fleet",
    icon: "Boxes",
    color: "#1e3a2f",
    items: [{ label: "Summary", icon: "Package", view: "wolf-fleet" }],
  };
}

/**
 * Ordered central product nav used to derive the Workspaces provisioning catalogue.
 * Core Unit311 modules (1–22) plus WOLF specialist extensions (23–27).
 */
export function buildCentralProductNavSections(): readonly CentralProductModuleSpec[] {
  return [
    {
      number: 1,
      id: "home",
      label: "HOME",
      section: pinSection("HOME", "home", "LayoutDashboard"),
    },
    {
      number: 2,
      id: "executive-assistant",
      label: "EXECUTIVE ASSISTANT",
      section: pinSection("EXECUTIVE ASSISTANT", "executive-assistant", "Bot"),
    },
    {
      number: 3,
      id: "intelligence",
      label: "INTELLIGENCE",
      section: buildCentralIntelligenceNavSection(),
    },
    {
      number: 4,
      id: "business-central",
      label: "BUSINESS CENTRAL",
      section: buildCentralBusinessCentralNavSection(),
    },
    {
      number: 5,
      id: "sales-management",
      label: "SALES MANAGEMENT",
      section: buildSalesManagementNavSection(),
    },
    {
      number: 6,
      id: "financials",
      label: "FINANCES",
      section: buildFinancesNavSection(),
    },
    {
      number: 7,
      id: "fundraising",
      label: "FUNDRAISING",
      section: buildCentralFundraisingNavSection(),
    },
    {
      number: 8,
      id: "board",
      label: "BOARD",
      section: buildCentralBoardNavSection(),
    },
    {
      number: 9,
      id: "corporate-information",
      label: "CORPORATE INFORMATION",
      section: buildCentralCorporateInformationNavSection(),
    },
    {
      number: 10,
      id: "operations",
      label: "OPERATIONS",
      section: requireSection("Operations"),
    },
    {
      number: 11,
      id: "marketing-events",
      label: "MARKETING AND EVENTS",
      section: buildCentralMarketingEventsNavSection(),
    },
    {
      number: 12,
      id: "technology-management",
      label: "TECH MGMT",
      section: requireSection("Technology Management"),
    },
    {
      number: 13,
      id: "human-resources",
      label: "HUMAN RESOURCES",
      section: requireSection("Human Resources"),
    },
    {
      number: 14,
      id: "business-productivity",
      label: "BUSINESS PROD",
      section: buildCentralBusinessProductivityNavSection(),
    },
    {
      number: 15,
      id: "support-desk",
      label: "SUPPORT DESK",
      section: requireSection("Support Desk"),
    },
    {
      number: 16,
      id: "project-management",
      label: "PROJECT MANAGEMENT",
      section: buildProjectManagementNavSection(),
    },
    {
      number: 17,
      id: "engineering",
      label: "ENGINEERING",
      section: buildCentralEngineeringNavSection(),
    },
    {
      number: 18,
      id: "training",
      label: "TRAINING",
      section: requireSection("Training"),
    },
    {
      number: 19,
      id: "qms",
      label: "QMS",
      section: requireSection("QMS"),
    },
    {
      number: 20,
      id: "tools",
      label: "TOOLS",
      section: requireSection("Tools"),
    },
    {
      number: 21,
      id: "external-client-access",
      label: "EXTERNAL CLIENT ACCESS",
      section: requireSection("External Client Access"),
    },
    {
      number: 22,
      id: "settings",
      label: "SETTINGS",
      section: requireSection("Settings"),
    },
    {
      number: 23,
      id: "wolf-animals",
      label: "WOLF ANIMALS",
      section: buildWolfAnimalsNavSection(),
    },
    {
      number: 24,
      id: "wolf-containment",
      label: "WOLF CONTAINMENT",
      section: buildWolfContainmentNavSection(),
    },
    {
      number: 25,
      id: "wolf-environment",
      label: "WOLF ENVIRONMENT",
      section: buildWolfEnvironmentNavSection(),
    },
    {
      number: 26,
      id: "wolf-drone-operations",
      label: "WOLF DRONE OPS",
      section: buildWolfDroneOperationsNavSection(),
    },
    {
      number: 27,
      id: "wolf-fleet",
      label: "WOLF FLEET",
      section: buildWolfFleetNavSection(),
    },
  ] as const;
}

export type CentralProductNavLeaf = {
  label: string;
  viewId?: string;
  /** Stable id within the parent module for provisioning keys. */
  id: string;
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function leafId(
  item: Pick<InternalNavItem, "view" | "query" | "label">,
  path: string,
): string {
  if (item.view) {
    const queryPart = item.query
      ? Object.entries(item.query)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([k, v]) => `${k}-${v}`)
          .join("--")
      : "";
    return slugify(queryPart ? `${item.view}--${queryPart}` : item.view);
  }
  return slugify(path);
}

/** Flatten a module nav section to individually selectable leaf functions. */
export function flattenCentralProductLeaves(
  items: readonly InternalNavItem[],
  pathPrefix = "",
): CentralProductNavLeaf[] {
  const leaves: CentralProductNavLeaf[] = [];
  const usedIds = new Set<string>();

  function uniqueId(candidate: string): string {
    let id = candidate;
    let suffix = 2;
    while (usedIds.has(id)) {
      id = `${candidate}-${suffix++}`;
    }
    usedIds.add(id);
    return id;
  }

  function visitItem(
    item: InternalNavItem | InternalNavChildItem,
    pathPrefix: string,
  ): void {
    const segment = slugify(item.label);
    const path = pathPrefix ? `${pathPrefix}/${segment}` : segment;
    if (item.children?.length) {
      for (const child of item.children) {
        visitItem(child, path);
      }
      return;
    }
    const baseId = leafId(item, path);
    leaves.push({
      label: item.label,
      viewId: item.view,
      id: uniqueId(baseId),
    });
  }

  for (const item of items) {
    visitItem(item, pathPrefix);
  }

  return leaves;
}
