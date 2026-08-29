/**
 * Intelligence workspace provisioning — ABHI-only Member and Regulatory sub-modules.
 */

import { ABHI_SLUG } from "@/lib/abhi-surface";
import { subModuleKey } from "@/lib/platform-workspaces/module-catalogue";

export const INTELLIGENCE_MEMBER_SUBMODULE_KEY = subModuleKey("intelligence", "member-intelligence");

export const INTELLIGENCE_REGULATORY_SUBMODULE_KEYS = [
  subModuleKey("intelligence", "regulatory-dashboard"),
  subModuleKey("intelligence", "regulatory-updates"),
  subModuleKey("intelligence", "regulatory-impact"),
  subModuleKey("intelligence", "regulatory-alerts"),
] as const;

const ABHI_ONLY_INTELLIGENCE_KEYS = new Set<string>([
  INTELLIGENCE_MEMBER_SUBMODULE_KEY,
  ...INTELLIGENCE_REGULATORY_SUBMODULE_KEYS,
]);

export function workspaceIncludesAbhiIntelligenceSubModules(
  slug: string | null | undefined,
): boolean {
  return String(slug ?? "").trim().toLowerCase() === ABHI_SLUG;
}

export function filterIntelligenceProvisioningSubModules(
  slug: string | null | undefined,
  subModules: readonly string[],
): string[] {
  const normalized = String(slug ?? "").trim().toLowerCase();
  const isAbhi = normalized === ABHI_SLUG;
  const subSet = new Set(subModules);

  if (isAbhi) {
    for (const key of ABHI_ONLY_INTELLIGENCE_KEYS) {
      subSet.add(key);
    }
    return [...subSet];
  }

  return subModules.filter((key) => !ABHI_ONLY_INTELLIGENCE_KEYS.has(key));
}
