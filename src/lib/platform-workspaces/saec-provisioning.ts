import { filterIntelligenceProvisioningSubModules } from "@/lib/intelligence/intelligence-provisioning";
import {
  FUNDRAISING_CORPORATE_SHAREHOLDING_EXCLUDED_SUBMODULE_KEYS,
  filterFundraisingProvisioningSubModules,
} from "@/lib/fundraising/fundraising-provisioning";
import {
  BUSINESS_CENTRAL_GRANT_MANAGEMENT_SUBMODULE_KEY,
  filterBusinessCentralProvisioningSubModules,
} from "@/lib/platform-workspaces/business-central-provisioning";
import {
  WORKSPACE_CORE_MODULE_IDS,
  defaultEnabledSubModules,
} from "@/lib/platform-workspaces/module-catalogue";
import { SAEC_SLUG } from "@/lib/saec-surface";

/** SAEC uses the full central 22-module catalogue with workspace-specific submodule subsets. */
export const SAEC_ENABLED_MODULES = [...WORKSPACE_CORE_MODULE_IDS] as const;

/** Submodule keys excluded from OmniTransit provisioning (legacy BC + Corporate Shareholding subset). */
export const SAEC_EXCLUDED_SUBMODULE_KEYS = [
  BUSINESS_CENTRAL_GRANT_MANAGEMENT_SUBMODULE_KEY,
  ...FUNDRAISING_CORPORATE_SHAREHOLDING_EXCLUDED_SUBMODULE_KEYS,
] as const;

export function saecEnabledSubModules(): string[] {
  return filterIntelligenceProvisioningSubModules(
    SAEC_SLUG,
    filterFundraisingProvisioningSubModules(
      SAEC_SLUG,
      filterBusinessCentralProvisioningSubModules(
        SAEC_SLUG,
        defaultEnabledSubModules([...SAEC_ENABLED_MODULES]),
      ),
    ),
  );
}
