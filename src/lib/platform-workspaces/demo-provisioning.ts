/**
 * Demo workspace module enablement — frozen to the full central catalogue.
 * Authoritative: module-catalogue.ts (WORKSPACE_MODULE_IDS + allCatalogueModuleSelections).
 *
 * DO NOT shrink this list without an explicit owner request to change Demo structure.
 */

import {
  WORKSPACE_MODULE_IDS,
  allCatalogueModuleSelections,
  defaultEnabledSubModules,
} from "@/lib/platform-workspaces/module-catalogue";

export const DEMO_SLUG = "demo";

/** All 22 top-level catalogue modules — Demo includes Grants and Sales Management. */
export const DEMO_ENABLED_MODULES = [...WORKSPACE_MODULE_IDS] as const;

/** All 157 catalogue submodule keys for Demo. */
export function demoEnabledSubModules(): string[] {
  return defaultEnabledSubModules([...DEMO_ENABLED_MODULES]);
}

/** Canonical Demo enablement snapshot (modules + submodules). */
export function demoCatalogueEnablement(): {
  enabledModules: string[];
  enabledSubModules: string[];
} {
  return allCatalogueModuleSelections();
}

export const DEMO_CATALOGUE_MODULE_COUNT = DEMO_ENABLED_MODULES.length;

export const DEMO_CATALOGUE_SUBMODULE_COUNT = demoEnabledSubModules().length;
