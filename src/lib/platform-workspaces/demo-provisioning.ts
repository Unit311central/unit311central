/**
 * Demo workspace module enablement — frozen to the full central catalogue.
 * Authoritative: module-catalogue.ts (WORKSPACE_CORE_MODULE_IDS + all catalogue submodules).
 *
 * DO NOT shrink this list without an explicit owner request to change Demo structure.
 */

import {
  WORKSPACE_CORE_MODULE_IDS,
  allCatalogueModuleSelections,
  defaultEnabledSubModules,
} from "@/lib/platform-workspaces/module-catalogue";

export const DEMO_SLUG = "demo";

/** All 22 top-level core catalogue modules — Demo includes Grants and Sales Management. */
export const DEMO_ENABLED_MODULES = [...WORKSPACE_CORE_MODULE_IDS] as const;

/** All core catalogue submodule keys for Demo. */
export function demoEnabledSubModules(): string[] {
  return defaultEnabledSubModules([...DEMO_ENABLED_MODULES]);
}

/** Canonical Demo enablement snapshot (modules + submodules). */
export function demoCatalogueEnablement(): {
  enabledModules: string[];
  enabledSubModules: string[];
} {
  const enabledModules = [...WORKSPACE_CORE_MODULE_IDS];
  return {
    enabledModules,
    enabledSubModules: defaultEnabledSubModules(enabledModules),
  };
}

export const DEMO_CATALOGUE_MODULE_COUNT = DEMO_ENABLED_MODULES.length;

export const DEMO_CATALOGUE_SUBMODULE_COUNT = demoEnabledSubModules().length;
