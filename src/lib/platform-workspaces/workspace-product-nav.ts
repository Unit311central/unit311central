/**
 * Canonical workspace product navigation — built from central-product-nav and
 * filtered by workspace module enablement (wizard selections / metadata).
 */

import { DEMO_WORKSPACE_SLUG } from "@/lib/app-domains";
import { isInterfaceWorxSlug } from "@/lib/interface-worx-surface";
import {
  buildFinancesNavSection,
} from "@/lib/finances-nav";
import type {
  InternalNavChildItem,
  InternalNavItem,
  InternalNavSection,
} from "@/lib/internal-operations-data";
import {
  buildCentralProductNavSections,
} from "@/lib/platform-workspaces/central-product-nav";
import {
  WORKSPACE_MODULE_IDS,
  defaultEnabledSubModules,
  getWorkspaceModuleEntry,
  subModuleKey,
} from "@/lib/platform-workspaces/module-catalogue";

export type WorkspaceNavEnablement = {
  enabledModules: readonly string[];
  enabledSubModules: readonly string[];
};

export type WorkspaceProductNavOptions = {
  workspaceSlug?: string | null;
  workspaceType?: string | null;
  enablement: WorkspaceNavEnablement;
  /** Override intelligence workspace section label (e.g. Northstar Intelligence). */
  intelligenceLabel?: string;
};

const SPECIALIST_WORKSPACE_SLUGS = new Set([
  "onwardair",
  "abhi",
  "talanton",
  "talanton-impact",
]);

export function isSpecialistWorkspaceSlug(slug: string | null | undefined): boolean {
  const normalized = String(slug ?? "").trim().toLowerCase();
  if (!normalized) return false;
  if (SPECIALIST_WORKSPACE_SLUGS.has(normalized)) return true;
  return normalized.includes("onwardair") || normalized.includes("talanton");
}

/** When a module is enabled but has no catalogue sub-module keys, use the full module catalogue. */
export function repairWorkspaceSubmoduleKeys(
  enabledModules: readonly string[],
  enabledSubModules: readonly string[],
): string[] {
  const subSet = new Set(enabledSubModules);
  for (const moduleId of enabledModules) {
    const prefix = `${moduleId}:`;
    const hasModuleKey = [...subSet].some((key) => key.startsWith(prefix));
    if (!hasModuleKey) {
      for (const sub of getWorkspaceModuleEntry(moduleId)?.subModules ?? []) {
        subSet.add(subModuleKey(moduleId, sub.id));
      }
    }
  }

  const legacyManagement = subModuleKey("business-central", "management");
  if (subSet.has(legacyManagement)) {
    for (const sub of getWorkspaceModuleEntry("business-central")?.subModules ?? []) {
      if (sub.viewId === "management") {
        subSet.add(subModuleKey("business-central", sub.id));
      }
    }
  }

  return [...subSet];
}

/**
 * Resolve navigation enablement from workspace metadata.
 * Demo workspaces with legacy empty sub-module metadata receive the full catalogue.
 */
export function resolveWorkspaceNavEnablement(input: {
  workspaceSlug?: string | null;
  workspaceType?: string | null;
  enabledModules?: readonly string[] | null;
  enabledSubModules?: readonly string[] | null;
  /**
   * When false, an empty module list stays empty instead of the 5-module starter
   * fallback — used while whoami is still loading to avoid a nav flash.
   */
  allowDefaultFallback?: boolean;
}): WorkspaceNavEnablement {
  const normalizedType = String(input.workspaceType ?? "").trim().toLowerCase();
  const normalizedSlug = String(input.workspaceSlug ?? "").trim().toLowerCase();
  const isDemo =
    normalizedType === "demo" ||
    normalizedSlug === DEMO_WORKSPACE_SLUG ||
    normalizedSlug === "demo";

  const modules = [...(input.enabledModules ?? [])];
  const subModules = [...(input.enabledSubModules ?? [])];

  if (isDemo && subModules.length === 0) {
    const allModules = [...WORKSPACE_MODULE_IDS];
    return {
      enabledModules: allModules,
      enabledSubModules: defaultEnabledSubModules(allModules),
    };
  }

  if (modules.length > 0) {
    const baseSubs =
      subModules.length > 0 ? subModules : defaultEnabledSubModules(modules);
    return {
      enabledModules: modules,
      enabledSubModules: repairWorkspaceSubmoduleKeys(modules, baseSubs),
    };
  }

  if (!input.allowDefaultFallback) {
    return { enabledModules: [], enabledSubModules: [] };
  }

  const fallbackModules = WORKSPACE_MODULE_IDS.filter((id) =>
    ["home", "executive-assistant", "business-central", "financials", "settings"].includes(id),
  );
  return {
    enabledModules: fallbackModules,
    enabledSubModules: defaultEnabledSubModules(fallbackModules),
  };
}

export function resolveIntelligenceNavLabel(workspaceSlug?: string | null): string {
  const slug = String(workspaceSlug ?? "").trim().toLowerCase();
  if (slug === DEMO_WORKSPACE_SLUG || slug === "demo") {
    return "Northstar Intelligence";
  }
  return "Intelligence";
}

function buildViewToSubModuleKeyMap(moduleId: string): Map<string, string> {
  const entry = getWorkspaceModuleEntry(moduleId);
  const map = new Map<string, string>();
  if (!entry) return map;
  for (const sub of entry.subModules) {
    if (sub.viewId) {
      map.set(sub.viewId, subModuleKey(moduleId, sub.id));
    }
  }
  return map;
}

function childAllowed(
  moduleId: string,
  child: InternalNavChildItem,
  enabledSubModules: ReadonlySet<string>,
  filterSubs: boolean,
  viewMap: Map<string, string>,
): boolean {
  if (!filterSubs) return true;
  if (!child.view) return true;
  const key = viewMap.get(child.view);
  return !key || enabledSubModules.has(key);
}

function filterNavChildren(
  moduleId: string,
  children: readonly InternalNavChildItem[],
  enabledSubModules: ReadonlySet<string>,
  filterSubs: boolean,
  viewMap: Map<string, string>,
): InternalNavChildItem[] {
  return children.filter((child) =>
    childAllowed(moduleId, child, enabledSubModules, filterSubs, viewMap),
  );
}

function filterNavItems(
  moduleId: string,
  items: readonly InternalNavItem[],
  enabledSubModules: ReadonlySet<string>,
  filterSubs: boolean,
  viewMap: Map<string, string>,
): InternalNavItem[] {
  const result: InternalNavItem[] = [];

  for (const item of items) {
    if (item.children?.length) {
      const children = filterNavChildren(
        moduleId,
        item.children,
        enabledSubModules,
        filterSubs,
        viewMap,
      );
      if (children.length > 0) {
        result.push({ ...item, children });
      }
      continue;
    }

    if (!filterSubs) {
      result.push(item);
      continue;
    }

    if (!item.view) {
      result.push(item);
      continue;
    }

    const key = viewMap.get(item.view);
    if (!key || enabledSubModules.has(key)) {
      result.push(item);
    }
  }

  return result;
}

/**
 * Build ordered workspace navigation from the canonical 22-module catalogue,
 * filtered to the workspace's enabled modules and sub-modules.
 */
export function buildWorkspaceProductNavSections(
  options: WorkspaceProductNavOptions,
): InternalNavSection[] {
  const enabledModuleSet = new Set(options.enablement.enabledModules);
  const enabledSubModuleSet = new Set(options.enablement.enabledSubModules);
  const filterSubs = options.enablement.enabledSubModules.length > 0;
  const intelligenceLabel = options.intelligenceLabel ?? resolveIntelligenceNavLabel(options.workspaceSlug);

  const sections: InternalNavSection[] = [];

  for (const spec of buildCentralProductNavSections()) {
    if (!enabledModuleSet.has(spec.id)) continue;

    let section = spec.section;

    if (spec.id === "intelligence") {
      section = { ...section, label: intelligenceLabel };
    }

    if (spec.id === "financials") {
      section = buildFinancesNavSection();
    }

    const filterSubsForModule =
      spec.id === "financials" && enabledModuleSet.has("financials") ? false : filterSubs;

    if (section.kind === "pin") {
      sections.push(section);
      continue;
    }

    const viewMap = buildViewToSubModuleKeyMap(spec.id);
    const filteredItems = filterNavItems(
      spec.id,
      section.items,
      enabledSubModuleSet,
      filterSubsForModule,
      viewMap,
    );

    if (filteredItems.length === 0) continue;

    const items =
      spec.id === "business-central" && isInterfaceWorxSlug(options.workspaceSlug)
        ? [
            ...filteredItems,
            {
              label: "Information Repository",
              icon: "FileText",
              view: "information-repository" as const,
            },
          ]
        : filteredItems;

    sections.push({ ...section, items });
  }

  return sections;
}
