/**
 * PAILEX workspace module enablement — WOLF operational modules only.
 */

import { PAILEX_OPERATIONAL_VIEWS } from "@/lib/pailex/pailex-views";

export const PAILEX_ENABLED_MODULES = [
  "home",
  "wolf-animals",
  "wolf-containment",
  "wolf-environment",
  "wolf-drone-operations",
  "wolf-fleet",
  "support-desk",
  "training",
  "project-management",
  "settings",
] as const;

function pailexSubModuleKey(viewId: string): string {
  if (viewId === "pailex-dashboard") return "home:pailex-dashboard";
  if (viewId.startsWith("pailex-animals")) return `wolf-animals:${viewId}`;
  if (viewId.startsWith("pailex-containment")) return `wolf-containment:${viewId}`;
  if (viewId.startsWith("pailex-environment")) return `wolf-environment:${viewId}`;
  if (viewId.startsWith("pailex-fleet")) return `wolf-fleet:${viewId}`;
  if (viewId.startsWith("pailex-drone")) return `wolf-drone-operations:${viewId}`;
  if (viewId.startsWith("pailex-support")) return `support-desk:${viewId}`;
  if (viewId.startsWith("pailex-training")) return `training:${viewId}`;
  if (viewId.startsWith("pailex-projects")) return `project-management:${viewId}`;
  if (viewId.startsWith("pailex-documents")) return `project-management:${viewId}`;
  return `home:${viewId}`;
}

export function pailexEnabledModules(): string[] {
  return [...PAILEX_ENABLED_MODULES];
}

export function pailexEnabledSubModules(): string[] {
  const keys = PAILEX_OPERATIONAL_VIEWS.map(pailexSubModuleKey);
  keys.push("settings:settings", "settings:users");
  return keys;
}
