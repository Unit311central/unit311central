/**
 * Canonical workspace product navigation — built from central-product-nav and
 * filtered by workspace module enablement (wizard selections / metadata).
 */

import { DEMO_WORKSPACE_SLUG } from "@/lib/app-domains";
import { filterIntelligenceProvisioningSubModules } from "@/lib/intelligence/intelligence-provisioning";
import { resolveIntelligenceNavLabel } from "@/lib/intelligence/intelligence-nav-labels";
import { filterBusinessCentralProvisioningSubModules } from "@/lib/platform-workspaces/business-central-provisioning";
import { isSaecSlug } from "@/lib/saec-surface";
import {
  greendesertEnabledSubModules,
  GREENDESERT_ENABLED_MODULES,
} from "@/lib/greendesert/greendesert-provisioning";
import { isGreenDesertSlug } from "@/lib/greendesert-surface";
import { augmentSaecOperationsNav } from "@/lib/saec/installations-nav";
import { CLIENT_PLATFORM_ALWAYS_VIEWS } from "@/lib/unit311-support/data";
import { buildFinancesNavSection } from "@/lib/finances-nav";
import {
  augmentInterfaceWorxFundraisingNavItems,
  filterFundraisingProvisioningSubModules,
  filterInterfaceWorxToolsNavItems,
  shouldAugmentInterfaceWorxFundraisingNav,
  shouldFilterInterfaceWorxToolsNav,
} from "@/lib/interface-worx-nav";
import { isInterfaceWorxSlug } from "@/lib/interface-worx-surface";
import {
  filterCustomerSupportNavItems,
  isCustomerWorkspaceSlug,
} from "@/lib/customer-workspace-surface";
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

function filterWorkspaceProvisioningSubModules(
  slug: string,
  subModules: readonly string[],
): string[] {
  return filterFundraisingProvisioningSubModules(
    slug,
    filterIntelligenceProvisioningSubModules(
      slug,
      filterBusinessCentralProvisioningSubModules(slug, subModules),
    ),
  );
}

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
  workspaceSlug?: string | null,
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

  // Clients Dashboard and Client Directory share the clients module key but are
  // separate catalogue sub-modules; legacy provisioning often enabled only one.
  const clientsDirectory = subModuleKey("business-central", "clients");
  const clientsDashboard = subModuleKey("business-central", "clients-dashboard");
  if (subSet.has(clientsDirectory) || subSet.has(clientsDashboard)) {
    subSet.add(clientsDirectory);
    subSet.add(clientsDashboard);
  }

  const businessCentralPrefix = "business-central:";
  const hasBusinessCentralSub = [...subSet].some((key) => key.startsWith(businessCentralPrefix));
  if (enabledModules.includes("business-central") && hasBusinessCentralSub) {
    subSet.add(subModuleKey("business-central", "information-repository"));
  }

  if (isInterfaceWorxSlug(workspaceSlug) && enabledModules.includes("fundraising")) {
    subSet.add(subModuleKey("fundraising", "grants"));
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
  const isGreenDesert = isGreenDesertSlug(normalizedSlug);

  const modules = [...(input.enabledModules ?? [])];
  const subModules = [...(input.enabledSubModules ?? [])];

  if (isGreenDesert && modules.length === 0) {
    const allModules = [...GREENDESERT_ENABLED_MODULES];
    return {
      enabledModules: allModules,
      enabledSubModules: filterWorkspaceProvisioningSubModules(
        normalizedSlug,
        subModules.length > 0 ? subModules : greendesertEnabledSubModules(),
      ),
    };
  }

  if (isDemo && subModules.length === 0) {
    const allModules = [...WORKSPACE_MODULE_IDS];
    return {
      enabledModules: allModules,
      enabledSubModules: filterWorkspaceProvisioningSubModules(
        normalizedSlug,
        defaultEnabledSubModules(allModules),
      ),
    };
  }

  if (modules.length > 0) {
    const baseSubs =
      subModules.length > 0 ? subModules : defaultEnabledSubModules(modules);
    return {
      enabledModules: modules,
      enabledSubModules: filterWorkspaceProvisioningSubModules(
        normalizedSlug,
        repairWorkspaceSubmoduleKeys(modules, baseSubs, normalizedSlug),
      ),
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
    enabledSubModules: filterWorkspaceProvisioningSubModules(
      normalizedSlug,
      defaultEnabledSubModules(fallbackModules),
    ),
  };
}

export { resolveIntelligenceNavLabel } from "@/lib/intelligence/intelligence-nav-labels";

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
  if (CLIENT_PLATFORM_ALWAYS_VIEWS.has(child.view)) return true;
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

    if (CLIENT_PLATFORM_ALWAYS_VIEWS.has(item.view)) {
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

    let items =
      spec.id === "operations" && isSaecSlug(options.workspaceSlug)
        ? augmentSaecOperationsNav(filteredItems)
        : filteredItems;

    if (spec.id === "tools" && shouldFilterInterfaceWorxToolsNav(options.workspaceSlug)) {
      items = filterInterfaceWorxToolsNavItems(items);
    }

    if (spec.id === "fundraising" && shouldAugmentInterfaceWorxFundraisingNav(options.workspaceSlug)) {
      items = augmentInterfaceWorxFundraisingNavItems(items);
    }

    if (spec.id === "support-desk" && isCustomerWorkspaceSlug(options.workspaceSlug)) {
      items = filterCustomerSupportNavItems(items);
    }

    sections.push({ ...section, items });
  }

  return sections;
}
