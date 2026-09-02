/**
 * WOLF Central navigation — WOLF specialist modules plus selected central catalogue
 * sections. Business Productivity omits Client Explorer, Email, and Social.
 */

import type {
  InternalNavChildItem,
  InternalNavItem,
  InternalNavSection,
} from "@/lib/internal-operations-data";
import { internalSurveyNavSections } from "@/lib/internal-operations-data";
import {
  buildCentralBusinessProductivityNavSection,
  buildCentralEngineeringNavSection,
} from "@/lib/platform-workspaces/central-product-nav";
import { buildProjectManagementNavSection } from "@/lib/project-management-nav";

const WOLF_GREEN = "#1a4d3a";
const WOLF_RUST = "#8b4513";
const WOLF_DRONE = "#2d4a3e";
const WOLF_ENV = "#3d5c4a";
const WOLF_FLEET = "#1e3a2f";
const WOLF_TOOLS = "#2a3d32";
const WOLF_ADMIN = "#1a1a1a";

const WOLF_BUSINESS_PRODUCTIVITY_EXCLUDED_VIEWS = new Set([
  "files-client",
  "info-email",
  "social",
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

function requireWorkspaceSection(label: string): InternalNavSection {
  const section = findWorkspaceSection(label);
  if (!section) {
    throw new Error(`WOLF Central nav missing workspace section: ${label}`);
  }
  return section;
}

function buildWolfBusinessProductivityNavSection(): InternalNavSection {
  const section = buildCentralBusinessProductivityNavSection();
  return {
    ...section,
    items: filterNavItems(section.items, WOLF_BUSINESS_PRODUCTIVITY_EXCLUDED_VIEWS),
  };
}

function collectSectionViews(
  items: readonly (InternalNavItem | InternalNavChildItem)[],
  out: string[] = [],
): string[] {
  for (const item of items) {
    if (item.view) out.push(item.view);
    if (item.children?.length) collectSectionViews(item.children, out);
  }
  return out;
}

export function buildWolfCentralNavSections(): readonly InternalNavSection[] {
  const supportDesk = requireWorkspaceSection("Support Desk");
  const operations = requireWorkspaceSection("Operations");
  const training = requireWorkspaceSection("Training");

  return [
    {
      kind: "pin",
      label: null,
      items: [{ label: "Estate overview", icon: "Globe2", view: "wolf-estate" }],
    },
    {
      kind: "pin",
      label: null,
      color: "#12B886",
      items: [{ label: "EXECUTIVE ASSISTANT", icon: "Bot", view: "executive-assistant" }],
    },
    {
      kind: "workspace",
      label: "Safari Parks",
      icon: "Map",
      color: WOLF_GREEN,
      items: [{ label: "Parks & Reserves", icon: "MapPinned", view: "wolf-safari-parks" }],
    },
    {
      kind: "workspace",
      label: "Animals",
      icon: "Binoculars",
      color: WOLF_GREEN,
      items: [{ label: "Monitoring", icon: "ScanSearch", view: "wolf-animals" }],
    },
    {
      kind: "workspace",
      label: "Drone Operations",
      icon: "Plane",
      color: WOLF_DRONE,
      items: [{ label: "Operations dashboard", icon: "Radar", view: "wolf-drone-operations" }],
    },
    {
      kind: "workspace",
      label: "Containment",
      icon: "Shield",
      color: WOLF_RUST,
      items: [{ label: "Overview", icon: "ShieldCheck", view: "wolf-containment" }],
    },
    {
      kind: "workspace",
      label: "Environment",
      icon: "CloudSun",
      color: WOLF_ENV,
      items: [{ label: "Overview", icon: "ThermometerSun", view: "wolf-environment" }],
    },
    {
      kind: "workspace",
      label: "Fleet & Assets",
      icon: "Boxes",
      color: WOLF_FLEET,
      items: [{ label: "Fleet overview", icon: "Package", view: "wolf-fleet" }],
    },
    buildWolfBusinessProductivityNavSection(),
    supportDesk,
    operations,
    training,
    buildProjectManagementNavSection({
      color: WOLF_DRONE,
      includeGrants: false,
    }),
    buildCentralEngineeringNavSection(),
    {
      kind: "workspace",
      label: "Tools",
      icon: "FlaskConical",
      color: WOLF_TOOLS,
      items: [
        {
          label: "AI Wildlife Vision (Demo)",
          icon: "ScanSearch",
          view: "wolf-ai-wildlife-vision",
        },
        { label: "Users", icon: "Users", view: "users" },
      ],
    },
    {
      kind: "workspace",
      label: "Settings",
      icon: "Settings",
      color: WOLF_ADMIN,
      items: [
        { label: "General", icon: "Settings", view: "settings" },
        { label: "Appearance", icon: "Palette", view: "appearance" },
      ],
    },
  ];
}

/** Views exposed in the WOLF Central sidebar (for regression checks). */
export function wolfCentralNavViews(): string[] {
  const sections = buildWolfCentralNavSections();
  const views = sections.flatMap((section) => collectSectionViews(section.items));
  return [...new Set(views)].sort();
}
