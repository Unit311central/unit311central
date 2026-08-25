import { defaultEnabledSubModules } from "@/lib/platform-workspaces/module-catalogue";

/** SAEC Thursday client demo — breadth of platform modules, no Grants. */
export const SAEC_ENABLED_MODULES = [
  "home",
  "executive-assistant",
  "intelligence",
  "business-central",
  "financials",
  "project-management",
  "operations",
  "technology-management",
  "engineering",
  "human-resources",
  "training",
  "board",
  "corporate-information",
  "marketing-events",
  "external-client-access",
] as const;

export function saecEnabledSubModules(): string[] {
  return defaultEnabledSubModules([...SAEC_ENABLED_MODULES]).filter(
    (key) => key !== "business-central:grants",
  );
}
