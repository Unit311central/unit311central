/**
 * WOLF Central workspace module enablement — WOLF specialist modules plus
 * selected central catalogue modules (no legacy data import on enablement).
 */

import {
  defaultEnabledSubModules,
  subModuleKey,
} from "@/lib/platform-workspaces/module-catalogue";

export const WOLF_CENTRAL_ENABLED_MODULES = [
  "home",
  "wolf-animals",
  "wolf-containment",
  "wolf-environment",
  "wolf-drone-operations",
  "wolf-fleet",
  "wolf-tools",
  "executive-assistant",
  "business-productivity",
  "support-desk",
  "operations",
  "training",
  "project-management",
  "tools",
  "settings",
] as const;

/** Business Productivity leaves hidden for WOLF Central. */
export const WOLF_CENTRAL_EXCLUDED_SUBMODULE_KEYS = [
  "business-productivity:files-client",
  "business-productivity:info-email",
  "business-productivity:social",
] as const;

const WOLF_CENTRAL_EXCLUDED_SUBMODULE_SET = new Set<string>(WOLF_CENTRAL_EXCLUDED_SUBMODULE_KEYS);

export const WOLF_CENTRAL_NATIVE_SUBMODULES = [
  "home:wolf-estate",
  "home:wolf-safari-parks",
  "wolf-animals:wolf-animals",
  "wolf-containment:wolf-containment",
  "wolf-environment:wolf-environment",
  "wolf-drone-operations:wolf-drone-operations",
  "wolf-fleet:wolf-fleet",
  "wolf-tools:wolf-ai-wildlife-vision",
] as const;

export function wolfCentralEnabledModules(): string[] {
  return [...WOLF_CENTRAL_ENABLED_MODULES];
}

export function wolfCentralEnabledSubModules(): string[] {
  const catalogueKeys = defaultEnabledSubModules(wolfCentralEnabledModules());
  const keys = new Set<string>([...WOLF_CENTRAL_NATIVE_SUBMODULES]);

  for (const key of catalogueKeys) {
    if (WOLF_CENTRAL_EXCLUDED_SUBMODULE_SET.has(key)) continue;
    if (key.startsWith("tools:") && key !== subModuleKey("tools", "users")) continue;
    if (key === subModuleKey("settings", "users")) continue;
    keys.add(key);
  }

  keys.add(subModuleKey("settings", "settings"));
  keys.add(subModuleKey("settings", "appearance"));
  keys.add(subModuleKey("tools", "users"));

  return [...keys].sort();
}
