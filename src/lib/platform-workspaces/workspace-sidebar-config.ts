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
  WORKSPACE_MODULE_CATALOGUE,
  defaultEnabledSubModules,
  getWorkspaceModuleEntry,
  resolveProvisioningModuleKeys,
} from "@/lib/platform-workspaces/module-catalogue";
import { isPailexSlug } from "@/lib/pailex/pailex-surface";
import { isWolfCentralSlug } from "@/lib/wolf/wolf-surface";

const WOLF_CENTRAL_SHARK_MODULE_ID = "wolf-shark";
import {
  getNavSectionKey,
  isFixedPinSection,
  isMovableWorkspaceSection,
  isSettingsSection,
} from "@/lib/sidebar-nav-custom";
import type { InternalNavSection } from "@/lib/internal-operations-data";
import { patchTalantonBusinessProductivityNavSections } from "@/lib/internal-role-views";
import { isTalantonImpactSlug } from "@/lib/talanton-surface";

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

export function isWolfSidebarExtensionModuleId(moduleId: string): boolean {
  return moduleId.startsWith("wolf-");
}

/** WOLF specialist extensions are only configurable on WOLF / PAILEX product workspaces. */
export function workspaceEligibleForWolfSidebarExtensions(
  workspaceSlug?: string | null,
): boolean {
  return isWolfCentralSlug(workspaceSlug) || isPailexSlug(workspaceSlug);
}

export function isSidebarModuleEligibleForWorkspace(
  moduleId: string,
  workspaceSlug?: string | null,
): boolean {
  if (FIXED_SIDEBAR_MODULE_IDS.includes(moduleId as FixedSidebarModuleId)) return false;
  if (isWolfSidebarExtensionModuleId(moduleId)) {
    return workspaceEligibleForWolfSidebarExtensions(workspaceSlug);
  }
  return Boolean(getWorkspaceModuleEntry(moduleId));
}

/** Configurable modules from the central catalogue (excludes fixed pins + settings). */
export function listSidebarCatalogueModules(options?: {
  workspaceSlug?: string | null;
}): SidebarCatalogueModule[] {
  const workspaceSlug = options?.workspaceSlug;
  return buildCentralProductNavSections()
    .filter((spec) => !FIXED_SIDEBAR_MODULE_IDS.includes(spec.id as FixedSidebarModuleId))
    .filter((spec) => isSidebarModuleEligibleForWorkspace(spec.id, workspaceSlug))
    .map((spec) => ({
      id: spec.id,
      label: formatSidebarCatalogueLabel(spec),
      number: spec.number,
    }));
}

function formatSidebarCatalogueLabel(spec: CentralProductModuleSpec): string {
  const sectionLabel = spec.section.label?.trim();
  if (sectionLabel) return sectionLabel;
  const entry = getWorkspaceModuleEntry(spec.id);
  return entry?.label ?? spec.label;
}

/** Default rows: every configurable catalogue module enabled in catalogue order. */
export function defaultWorkspaceSidebarModuleRows(
  workspaceSlug?: string | null,
): WorkspaceSidebarModuleRecord[] {
  return listSidebarCatalogueModules({ workspaceSlug }).map((entry, index) => ({
    moduleId: entry.id,
    enabled: true,
    displayOrder: (index + 1) * 10,
  }));
}

const LEGACY_METADATA_PIN_IDS = new Set<string>(FIXED_SIDEBAR_MODULE_IDS);

function metadataHasConfigurableSelection(
  enabledModules: readonly string[] | null | undefined,
): boolean {
  if (!enabledModules?.length) return false;
  return enabledModules.some((id) => !LEGACY_METADATA_PIN_IDS.has(id));
}

/**
 * Derive initial sidebar rows from legacy workspace_admin_metadata.enabled_modules.
 * When metadata is empty or pins-only, all configurable catalogue modules are enabled
 * (matches specialist workspaces that previously showed the full nav tree).
 */
export function deriveSidebarRowsFromLegacyEnabledModules(
  enabledModules: readonly string[] | null | undefined,
  workspaceSlug?: string | null,
): WorkspaceSidebarModuleRecord[] {
  const catalogue = listSidebarCatalogueModules({ workspaceSlug });
  if (!metadataHasConfigurableSelection(enabledModules)) {
    return defaultWorkspaceSidebarModuleRows(workspaceSlug);
  }

  const orderIndex = new Map(
    (enabledModules ?? []).map((id, index) => [id, index] as const),
  );
  const enabledSet = new Set(enabledModules ?? []);

  return catalogue.map((entry, catalogueIndex) => {
    const enabled = enabledSet.has(entry.id);
    const metadataOrder = orderIndex.get(entry.id);
    return {
      moduleId: entry.id,
      enabled,
      displayOrder:
        metadataOrder != null
          ? (metadataOrder + 1) * 10
          : enabled
            ? (catalogueIndex + 1) * 10
            : (catalogueIndex + 100) * 10,
    };
  });
}

/** Re-enable a module without changing its persisted display_order. */
export function enableWorkspaceSidebarModule(
  rows: readonly WorkspaceSidebarModuleRecord[],
  moduleId: string,
): WorkspaceSidebarModuleRecord[] | null {
  const target = rows.find((row) => row.moduleId === moduleId);
  if (!target) return null;
  return rows.map((row) => (row.moduleId === moduleId ? { ...row, enabled: true } : row));
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
  SHARK: "wolf-shark",
  "Regulatory Intelligence": "intelligence",
};

const VIEW_PREFIX_TO_MODULE_ID: Array<{ prefix: string; moduleId: string }> = [
  { prefix: "regulatory-", moduleId: "intelligence" },
  { prefix: "member-intelligence", moduleId: "intelligence" },
  { prefix: "intelligence-", moduleId: "intelligence" },
  { prefix: "marketing-abhi-", moduleId: "marketing-events" },
  { prefix: "portfolio-", moduleId: "business-central" },
  { prefix: "wolf-shark", moduleId: "wolf-shark" },
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

function navSectionRichness(section: InternalNavSection): number {
  return section.items.reduce((count, item) => count + 1 + (item.children?.length ?? 0), 0);
}

/**
 * Collapse duplicate top-level workspace sections that resolve to the same catalogue module id.
 * Host overlays (Talanton, OnwardAir, ABHI) may inject a module section while the base nav tree
 * already includes one — workspace sidebar config must emit at most one section per module.
 */
export function dedupeNavSectionsByCatalogueModuleId(
  sections: readonly InternalNavSection[],
): InternalNavSection[] {
  const bestByModuleId = new Map<string, InternalNavSection>();

  for (const section of sections) {
    const moduleId = resolveCatalogueModuleIdForNavSection(section);
    if (!moduleId) continue;
    const existing = bestByModuleId.get(moduleId);
    if (!existing || navSectionRichness(section) > navSectionRichness(existing)) {
      bestByModuleId.set(moduleId, section);
    }
  }

  const emittedModuleIds = new Set<string>();
  const emittedUnmappedKeys = new Set<string>();
  const deduped: InternalNavSection[] = [];

  for (const section of sections) {
    const moduleId = resolveCatalogueModuleIdForNavSection(section);
    if (!moduleId) {
      const key = getNavSectionKey(section);
      if (emittedUnmappedKeys.has(key)) continue;
      emittedUnmappedKeys.add(key);
      deduped.push(section);
      continue;
    }
    if (emittedModuleIds.has(moduleId)) continue;
    emittedModuleIds.add(moduleId);
    deduped.push(bestByModuleId.get(moduleId) ?? section);
  }

  return deduped;
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

  const normalizedMovable = dedupeNavSectionsByCatalogueModuleId(movable);

  normalizedMovable.sort((a, b) => {
    const aId = resolveCatalogueModuleIdForNavSection(a);
    const bId = resolveCatalogueModuleIdForNavSection(b);
    const byOrder = moduleOrderIndex(aId, orderByModuleId) - moduleOrderIndex(bId, orderByModuleId);
    if (byOrder !== 0) return byOrder;
    return getNavSectionKey(a).localeCompare(getNavSectionKey(b));
  });

  const ordered = [...pins, ...normalizedMovable, ...(settings ? [settings] : [])];
  if (isTalantonImpactSlug(workspaceSlug)) {
    return patchTalantonBusinessProductivityNavSections(ordered);
  }
  return ordered;
}

/** Convert persisted rows to section keys for legacy applySidebarSectionOrder compatibility. */
export function sidebarSectionOrderFromConfig(
  sections: readonly InternalNavSection[],
  config: Pick<WorkspaceSidebarConfigSnapshot, "modules">,
): string[] {
  const filtered = applyWorkspaceSidebarModuleConfig(sections, config);
  return filtered.filter(isMovableWorkspaceSection).map(getNavSectionKey);
}

export function filterSidebarModulesForWorkspace(
  rows: readonly WorkspaceSidebarModuleRecord[],
  workspaceSlug?: string | null,
): WorkspaceSidebarModuleRecord[] {
  return rows.filter((row) => isSidebarModuleEligibleForWorkspace(row.moduleId, workspaceSlug));
}

export function mergeCatalogueWithPersistedRows(
  persisted: readonly WorkspaceSidebarModuleRecord[],
  workspaceSlug?: string | null,
): WorkspaceSidebarModuleRecord[] {
  const byId = new Map(persisted.map((row) => [row.moduleId, row] as const));
  const catalogue = listSidebarCatalogueModules({ workspaceSlug });
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
    if (isSidebarModuleEligibleForWorkspace(orphan.moduleId, workspaceSlug)) {
      merged.push(orphan);
    }
  }

  return merged.sort((a, b) => a.displayOrder - b.displayOrder);
}

/** Turn on sidebar rows that appear in legacy workspace_admin_metadata.enabled_modules. */
export function applyMetadataEnabledModuleHints(
  rows: readonly WorkspaceSidebarModuleRecord[],
  enabledModules: readonly string[] | null | undefined,
): WorkspaceSidebarModuleRecord[] {
  if (!enabledModules?.length) return [...rows];
  const hintSet = new Set(enabledModules);
  return rows.map((row) =>
    hintSet.has(row.moduleId) ? { ...row, enabled: true } : row,
  );
}

/** WOLF Central always shows SHARK in the LHS (product module, not optional trim). */
export function applyWolfCentralSharkSidebarRows(
  rows: readonly WorkspaceSidebarModuleRecord[],
  workspaceSlug?: string | null,
): WorkspaceSidebarModuleRecord[] {
  if (!isWolfCentralSlug(workspaceSlug)) return [...rows];

  const next = [...rows];
  const sharkIndex = next.findIndex((row) => row.moduleId === WOLF_CENTRAL_SHARK_MODULE_ID);
  const engineering = next.find((row) => row.moduleId === "engineering");
  const external = next.find((row) => row.moduleId === "external-client-access");
  const displayOrder =
    engineering && external
      ? Math.round((engineering.displayOrder + external.displayOrder) / 2)
      : sharkIndex >= 0
        ? next[sharkIndex]!.displayOrder
        : next.reduce((max, row) => Math.max(max, row.displayOrder), 0) + 10;

  if (sharkIndex >= 0) {
    next[sharkIndex] = { ...next[sharkIndex]!, enabled: true, displayOrder };
  } else {
    next.push({
      moduleId: WOLF_CENTRAL_SHARK_MODULE_ID,
      enabled: true,
      displayOrder,
    });
  }

  return next;
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
  workspaceSlug?: string | null,
): WorkspaceSidebarModuleRecord[] | null {
  if (!Array.isArray(input) || input.length === 0) return null;
  const allowed = new Set(listSidebarCatalogueModules({ workspaceSlug }).map((entry) => entry.id));
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

  return rows.length > 0 ? mergeCatalogueWithPersistedRows(rows, workspaceSlug) : null;
}
