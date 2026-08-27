/**
 * WOLF Central workspace module enablement — WOLF specialist modules only.
 * Never applied to Demo, Internal, or other customer workspaces.
 */

export const WOLF_CENTRAL_ENABLED_MODULES = [
  "home",
  "wolf-animals",
  "wolf-containment",
  "wolf-environment",
  "wolf-drone-operations",
  "wolf-fleet",
  "settings",
] as const;

export const WOLF_CENTRAL_ENABLED_SUBMODULES = [
  "home:wolf-estate",
  "home:wolf-safari-parks",
  "wolf-animals:wolf-animals",
  "wolf-containment:wolf-containment",
  "wolf-environment:wolf-environment",
  "wolf-drone-operations:wolf-drone-operations",
  "wolf-fleet:wolf-fleet",
  "settings:settings",
  "settings:appearance",
  "settings:users",
] as const;

export function wolfCentralEnabledModules(): string[] {
  return [...WOLF_CENTRAL_ENABLED_MODULES];
}

export function wolfCentralEnabledSubModules(): string[] {
  return [...WOLF_CENTRAL_ENABLED_SUBMODULES];
}
