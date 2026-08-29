import { filterIntelligenceProvisioningSubModules } from "@/lib/intelligence/intelligence-provisioning";
import {
  BUSINESS_CENTRAL_GRANT_MANAGEMENT_SUBMODULE_KEY,
  filterBusinessCentralProvisioningSubModules,
} from "@/lib/platform-workspaces/business-central-provisioning";
import {
  WORKSPACE_CORE_MODULE_IDS,
  defaultEnabledSubModules,
} from "@/lib/platform-workspaces/module-catalogue";
import { SAEC_SLUG } from "@/lib/saec-surface";

/** SAEC uses the full central 22-module catalogue; Grant Management is the sole deliberate exclusion. */
export const SAEC_ENABLED_MODULES = [...WORKSPACE_CORE_MODULE_IDS] as const;

export const SAEC_EXCLUDED_SUBMODULE_KEYS = [
  BUSINESS_CENTRAL_GRANT_MANAGEMENT_SUBMODULE_KEY,
] as const;

export function saecEnabledSubModules(): string[] {
  return filterIntelligenceProvisioningSubModules(
    SAEC_SLUG,
    filterBusinessCentralProvisioningSubModules(
      SAEC_SLUG,
      defaultEnabledSubModules([...SAEC_ENABLED_MODULES]),
    ),
  );
}
