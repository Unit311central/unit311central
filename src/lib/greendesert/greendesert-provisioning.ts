import {
  WORKSPACE_CORE_MODULE_IDS,
  defaultEnabledSubModules,
} from "@/lib/platform-workspaces/module-catalogue";

import { isGreenDesertSlug } from "@/lib/greendesert-surface";

/** Green Desert uses the full central 22-module catalogue. */
export const GREENDESERT_ENABLED_MODULES = [...WORKSPACE_CORE_MODULE_IDS] as const;

export function greendesertEnabledSubModules(): string[] {
  return defaultEnabledSubModules([...GREENDESERT_ENABLED_MODULES]);
}

/** Fallback workspace enablement when metadata has not been provisioned yet. */
export function resolveGreenDesertWorkspaceEnablement(input: {
  workspaceSlug?: string | null;
  enabledModules?: readonly string[] | null;
  enabledSubModules?: readonly string[] | null;
}): { enabledModules: string[]; enabledSubModules: string[] } | null {
  if (!isGreenDesertSlug(input.workspaceSlug)) return null;

  const modules =
    input.enabledModules?.length && input.enabledModules.length > 0
      ? [...input.enabledModules]
      : [...GREENDESERT_ENABLED_MODULES];
  const subModules =
    input.enabledSubModules?.length && input.enabledSubModules.length > 0
      ? [...input.enabledSubModules]
      : greendesertEnabledSubModules();

  return { enabledModules: modules, enabledSubModules: subModules };
}

export const GREENDESERT_WORKSPACE_ADMIN_USERNAME = "admin@greendesert.unit311central.com";

export const GREENDESERT_WORKSPACE_ADMIN_PASSWORD = "Reactor20206$";
