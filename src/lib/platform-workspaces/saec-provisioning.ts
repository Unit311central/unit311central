import {
  WORKSPACE_CORE_MODULE_IDS,
  defaultEnabledSubModules,
} from "@/lib/platform-workspaces/module-catalogue";

/** SAEC uses the full central 22-module catalogue; Grants is the sole deliberate exclusion. */
export const SAEC_ENABLED_MODULES = [...WORKSPACE_CORE_MODULE_IDS] as const;

export const SAEC_EXCLUDED_SUBMODULE_KEYS = ["business-central:grants"] as const;

export function saecEnabledSubModules(): string[] {
  const excluded = new Set<string>(SAEC_EXCLUDED_SUBMODULE_KEYS);
  return defaultEnabledSubModules([...SAEC_ENABLED_MODULES]).filter(
    (key) => !excluded.has(key),
  );
}
