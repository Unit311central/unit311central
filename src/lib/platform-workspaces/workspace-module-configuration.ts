/**
 * Workspace-specific module configuration (B) — distinct from the authoritative
 * customer module catalogue (A) in `module-catalogue.ts`.
 *
 * Never derive catalogue size from workspace_modules rows or template workspaces.
 */

import {
  allCatalogueProvisioningModuleKeys,
  countSelectedCatalogueModules,
  WORKSPACE_MODULE_IDS,
} from "@/lib/platform-workspaces/module-catalogue";

/** Authoritative customer catalogue size — top-level modules only. */
export const CUSTOMER_MODULE_CATALOGUE_COUNT = 22 as const;

/**
 * Legacy / specialist workspace_modules.module_key values that may exist on internal
 * or historical workspaces but are NOT part of the customer catalogue.
 */
export const LEGACY_SPECIALIST_MODULE_KEYS = [
  "telemetry",
] as const;

export type WorkspaceModuleConfigurationRow = {
  module_key: string;
  enabled: boolean;
};

export function authoritativeCatalogueModuleKeys(): readonly string[] {
  return allCatalogueProvisioningModuleKeys();
}

export function isAuthoritativeCatalogueModuleKey(moduleKey: string): boolean {
  return authoritativeCatalogueModuleKeys().includes(moduleKey);
}

export function isLegacySpecialistModuleKey(moduleKey: string): boolean {
  return (LEGACY_SPECIALIST_MODULE_KEYS as readonly string[]).includes(moduleKey);
}

export function isCustomerCatalogueModuleId(moduleId: string): boolean {
  return WORKSPACE_MODULE_IDS.includes(moduleId as (typeof WORKSPACE_MODULE_IDS)[number]);
}

/** Module keys cloned from a template that must be removed from new customer workspaces. */
export function legacyModuleKeysOutsideCatalogue(existingKeys: readonly string[]): string[] {
  const catalogue = new Set(authoritativeCatalogueModuleKeys());
  return existingKeys.filter((key) => !catalogue.has(key));
}

/**
 * Build workspace_modules rows for a customer workspace from wizard selections only.
 * Catalogue keys are always written; legacy/template keys are never inserted.
 */
export function buildCustomerWorkspaceModuleConfiguration(
  selectedModuleKeys: readonly string[],
): WorkspaceModuleConfigurationRow[] {
  const catalogueKeys = authoritativeCatalogueModuleKeys();
  const catalogueSet = new Set(catalogueKeys);
  const selectedSet = new Set(
    selectedModuleKeys.filter((key) => catalogueSet.has(key)),
  );
  return catalogueKeys.map((module_key) => ({
    module_key,
    enabled: selectedSet.has(module_key),
  }));
}

/** Count enabled top-level catalogue modules from wizard metadata — never DB rows. */
export function countCustomerCatalogueModulesFromSelection(
  enabledModuleIds: readonly string[],
): number {
  return countSelectedCatalogueModules(enabledModuleIds);
}
