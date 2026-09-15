/**
 * Central workspace sidebar module configuration — catalogue ids, section mapping,
 * and nav filtering/reordering. Client-safe (no DB).
 */

import {
  buildCentralProductNavSections,
  type CentralProductModuleSpec,
} from "@/lib/platform-workspaces/central-product-nav";
import { buildFinancesNavSection } from "@/lib/finances-nav";
import { resolveIntelligenceNavLabel } from "@/lib/intelligence/intelligence-nav-labels";
import {
  WORKSPACE_CORE_MODULE_IDS,
  WORKSPACE_MODULE_CATALOGUE,
  defaultEnabledSubModules,
  getWorkspaceModuleEntry,
  resolveProvisioningModuleKeys,
} from "@/lib/platform-workspaces/module-catalogue";
import {
  getNavSectionKey,
  isFixedPinSection,
  isMovableWorkspaceSection,
  isSettingsSection,
} from "@/lib/sidebar-nav-custom";
import type { InternalNavSection } from "@/lib/internal-operations-data";

/** Pins and settings — always visible; not managed in Settings → Sidebar. */
export const FIXED_SIDEBAR_MODULE_IDS = ["home", "executive-assistant", "settings"] as const;

export type FixedSidebarModuleId = (typeof FIXED_SIDEBAR_MODULE_IDS)[number];

export type WorkspaceSidebarModuleRecord = {
  moduleId: string;
  enabled: boolean;
  displayOrder: number;
};

export type WorkspaceSidebarConfigSnapshot = {
  modules: WorkspaceSidebarModuleRecord[];
  /** Enabled catalogue module ids sorted by display_order. */
  enabledModuleIds: string[];
  enabledSubModuleKeys: string[];
};

export type SidebarCatalogueModule = {
  id: string;
  label: string;
  number: number;
};

/** Configurable modules from the central catalogue (excludes fixed pins + settings). */
export function listSidebarCatalogueModules(): SidebarCatalogueModule[] {
  return buildCentralProductNavSections()
    .filter((spec) => !FIXED_SIDEBAR_MODULE_IDS.includes(spec.id as FixedSidebarModuleId))
    .map((spec) => ({
      id: spec.id,
      label: formatSidebarCatalogueLabel(spec),
      number: spec.number,
    }));
}

function formatSidebarCatalogueLabel(spec: CentralProductModuleSpec): string {
  const entry = getWorkspaceModuleEntry(spec.id);
  return entry?.label ?? spec.label;
}

/** Default rows: every configurable catalogue module enabled in catalogue order. */
export function defaultWorkspaceSidebarModuleRows(): WorkspaceSidebarModuleRecord[] {
  return listSidebarCatalogueModules().map((entry, index) => ({
    moduleId: entry.id,
    enabled: true,
    displayOrder: (index + 1) * 10,
  }));
}

export function buildSidebarConfigSnapshot(
  rows: readonly WorkspaceSidebarModuleRecord[],
): WorkspaceSidebarConfigSnapshot {
  const sorted = [...rows].sort((a, b) => a.displayOrder - b.displayOrder);
  const enabledModuleIds = sorted.filter((row) => row.enabled).map((row) => row.moduleId);
  const enabledSubModuleKeys = defaultEnabledSubModules(enabledModuleIds);
  return {
    modules: sorted,
    enabledModuleIds,
    enabledSubModuleKeys,
  };
}

export function resolveProvisioningKeysFromSidebarRows(
  rows: readonly WorkspaceSidebarModuleRecord[],
): string[] {
  const snapshot = buildSidebarConfigSnapshot(rows);
  return resolveProvisioningModuleKeys(snapshot.enabledModuleIds, snapshot.enabledSubModuleKeys);
}

/** Map a built nav section to a central catalogue module id (label aliases + view hints). */
const SECTION_LABEL_TO_MODULE_ID: Record<string, string> = {
  Intelligence: "intelligence",
  INTELLIGENCE: "intelligence",
  "ABHI INTELLIGENCE": "intelligence",
  "ABHI Intelligence": "intelligence",
  "Talanton Intelligence": "intelligence",
  "OnwardAir Intelligence": "intelligence",
  "Northstar Intelligence": "intelligence",
  "Portfolio Intelligence": "intelligence",
  "Business Central": "business-central",
  "Portfolio Companies": "business-central",
  "Member Management": "business-central",
  Members: "business-central",
  "Sales Management": "sales-management",
  Financials: "financials",
  Finances: "financials",
  FINANCES: "financials",
  Fundraising: "fundraising",
  Funds: "fundraising",
  Board: "board",
  "Corporate Information": "corporate-information",
  Operations: "operations",
  "Marketing & Events": "marketing-events",
  "Marketing and Events": "marketing-events",
  "Marketing & Stories": "marketing-events",
  "MARKETING AND EVENTS": "marketing-events",
  "Technology Management": "technology-management",
  "TECH MGMT": "technology-management",
  "Human Resources": "human-resources",
  "HUMAN RESOURCES": "human-resources",
  "Business Productivity": "business-productivity",
  "BUSINESS PROD": "business-productivity",
  "Support Desk": "support-desk",
  "Project Management": "project-management",
  Engineering: "engineering",
  Training: "training",
  "Quality Management": "qms",
  QMS: "qms",
  Tools: "tools",
  "External Client Access": "external-client-access",
  Animals: "wolf-animals",
  Containment: "wolf-containment",
  Environment: "wolf-environment",
  "Drone Operations": "wolf-drone-operations",
  Fleet: "wolf-fleet",
  Analytics: "wolf-analytics",
  "Regulatory Intelligence": "intelligence",
};

const VIEW_PREFIX_TO_MODULE_ID: Array<{ prefix: string; moduleId: string }> = [
  { prefix: "regulatory-", moduleId: "intelligence" },
  { prefix: "member-intelligence", moduleId: "intelligence" },
  { prefix: "intelligence-", moduleId: "intelligence" },
  { prefix: "marketing-abhi-", moduleId: "marketing-events" },
  { prefix: "portfolio-", moduleId: "business-central" },
  { prefix: "wolf-", moduleId: "wolf-animals" },
];

export function resolveCatalogueModuleIdForNavSection(section: InternalNavSection): string | null {
  if (isFixedPinSection(section) || isSettingsSection(section)) return null;
  const label = String(section.label ?? "").trim();
  if (label && SECTION_LABEL_TO_MODULE_ID[label]) {
    return SECTION_LABEL_TO_MODULE_ID[label]!;
  }

  for (const item of section.items) {
    const view = item.view ?? item.children?.[0]?.view;
    if (!view) continue;
    for (const { prefix, moduleId } of VIEW_PREFIX_TO_MODULE_ID) {
      if (view.startsWith(prefix) || view === prefix.replace(/-$/, "")) {
        return moduleId;
      }
    }
  }

  const normalized = label.toLowerCase();
  for (const entry of WORKSPACE_MODULE_CATALOGUE) {
    if (entry.label.toLowerCase() === normalized) return entry.id;
  }

  return null;
}

function moduleOrderIndex(
  moduleId: string | null,
  orderByModuleId: Map<string, number>,
): number {
  if (!moduleId) return Number.MAX_SAFE_INTEGER - 1;
  return orderByModuleId.get(moduleId) ?? Number.MAX_SAFE_INTEGER;
}

function buildProductSectionForModule(
  moduleId: string,
  workspaceSlug?: string | null,
): InternalNavSection | null {
  const spec = buildCentralProductNavSections().find((entry) => entry.id === moduleId);
  if (!spec) return null;

  let section = spec.section;
  if (moduleId === "intelligence") {
    section = {
      ...section,
      label: resolveIntelligenceNavLabel(workspaceSlug),
    };
  }
  if (moduleId === "financials") {
    section = buildFinancesNavSection();
  }
  if (section.kind === "pin") return null;
  return section;
}

/**
 * Filter movable LHS sections to enabled catalogue modules and apply workspace display order.
 * Injects central catalogue sections for newly enabled modules missing from the host nav tree.
 */
export function applyWorkspaceSidebarModuleConfig(
  sections: readonly InternalNavSection[],
  config: Pick<WorkspaceSidebarConfigSnapshot, "modules">,
  workspaceSlug?: string | null,
): InternalNavSection[] {
  const enabledSet = new Set(
    config.modules.filter((row) => row.enabled).map((row) => row.moduleId),
  );
  const orderByModuleId = new Map(
    config.modules.map((row) => [row.moduleId, row.displayOrder] as const),
  );

  const pins: InternalNavSection[] = [];
  const movable: InternalNavSection[] = [];
  let settings: InternalNavSection | null = null;

  for (const section of sections) {
    if (isFixedPinSection(section) || section.kind === "pin") {
      pins.push(section);
      continue;
    }
    if (isSettingsSection(section)) {
      settings = section;
      continue;
    }
    if (!isMovableWorkspaceSection(section)) continue;

    const moduleId = resolveCatalogueModuleIdForNavSection(section);
    if (moduleId && !enabledSet.has(moduleId)) continue;
    movable.push(section);
  }

  const presentModuleIds = new Set(
    movable
      .map((section) => resolveCatalogueModuleIdForNavSection(section))
      .filter((id): id is string => Boolean(id)),
  );

  for (const row of config.modules) {
    if (!row.enabled || presentModuleIds.has(row.moduleId)) continue;
    const injected = buildProductSectionForModule(row.moduleId, workspaceSlug);
    if (injected) {
      movable.push(injected);
      presentModuleIds.add(row.moduleId);
    }
  }

  movable.sort((a, b) => {
    const aId = resolveCatalogueModuleIdForNavSection(a);
    const bId = resolveCatalogueModuleIdForNavSection(b);
    const byOrder = moduleOrderIndex(aId, orderByModuleId) - moduleOrderIndex(bId, orderByModuleId);
    if (byOrder !== 0) return byOrder;
    return getNavSectionKey(a).localeCompare(getNavSectionKey(b));
  });

  return [...pins, ...movable, ...(settings ? [settings] : [])];
}

/** Convert persisted rows to section keys for legacy applySidebarSectionOrder compatibility. */
export function sidebarSectionOrderFromConfig(
  sections: readonly InternalNavSection[],
  config: Pick<WorkspaceSidebarConfigSnapshot, "modules">,
): string[] {
  const filtered = applyWorkspaceSidebarModuleConfig(sections, config);
  return filtered.filter(isMovableWorkspaceSection).map(getNavSectionKey);
}

export function mergeCatalogueWithPersistedRows(
  persisted: readonly WorkspaceSidebarModuleRecord[],
): WorkspaceSidebarModuleRecord[] {
  const byId = new Map(persisted.map((row) => [row.moduleId, row] as const));
  const catalogue = listSidebarCatalogueModules();
  const merged: WorkspaceSidebarModuleRecord[] = [];
  let orderCursor = 0;

  for (const entry of catalogue) {
    const existing = byId.get(entry.id);
    if (existing) {
      merged.push(existing);
      orderCursor = Math.max(orderCursor, existing.displayOrder);
      byId.delete(entry.id);
      continue;
    }
    orderCursor += 10;
    merged.push({
      moduleId: entry.id,
      enabled: false,
      displayOrder: orderCursor,
    });
  }

  for (const orphan of byId.values()) {
    merged.push(orphan);
  }

  return merged.sort((a, b) => a.displayOrder - b.displayOrder);
}

/** Validate PUT payload module ids against the central catalogue. */
/** Build a config snapshot from whoami enabled module ids (ordered). */
export function sidebarConfigFromEnabledModuleIds(
  enabledModuleIds: readonly string[] | null | undefined,
): WorkspaceSidebarConfigSnapshot | null {
  if (!enabledModuleIds?.length) return null;
  const enabledIndex = new Map(enabledModuleIds.map((id, index) => [id, index] as const));
  const rows = listSidebarCatalogueModules().map((entry, catalogueIndex) => ({
    moduleId: entry.id,
    enabled: enabledIndex.has(entry.id),
    displayOrder: enabledIndex.has(entry.id)
      ? (enabledIndex.get(entry.id)! + 1) * 10
      : (catalogueIndex + 100) * 10,
  }));
  return buildSidebarConfigSnapshot(rows);
}

export function sanitizeSidebarModulePayload(
  input: Array<{ moduleId?: string; enabled?: boolean; displayOrder?: number }>,
): WorkspaceSidebarModuleRecord[] | null {
  if (!Array.isArray(input) || input.length === 0) return null;
  const allowed = new Set(
    WORKSPACE_CORE_MODULE_IDS.filter(
      (id) => !FIXED_SIDEBAR_MODULE_IDS.includes(id as FixedSidebarModuleId),
    ),
  );
  const rows: WorkspaceSidebarModuleRecord[] = [];
  const seen = new Set<string>();

  for (const [index, item] of input.entries()) {
    const moduleId = String(item.moduleId ?? "").trim();
    if (!moduleId || !allowed.has(moduleId) || seen.has(moduleId)) continue;
    seen.add(moduleId);
    rows.push({
      moduleId,
      enabled: Boolean(item.enabled),
      displayOrder:
        typeof item.displayOrder === "number" && Number.isFinite(item.displayOrder)
          ? Math.trunc(item.displayOrder)
          : (index + 1) * 10,
    });
  }

  return rows.length > 0 ? mergeCatalogueWithPersistedRows(rows) : null;
}
