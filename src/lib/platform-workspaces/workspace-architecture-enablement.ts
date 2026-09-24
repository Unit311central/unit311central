/**
 * Unit311 Central Workspace Architecture enablement — mirrors live sidebar sources.
 * Client-safe (no DB). Used by architecture-taxonomy.ts for slug `unit311` only.
 */

import type { ArchitectureTaxonomyNode } from "@/lib/architecture-taxonomy-types";
import { INTERNAL_WORKSPACE_SLUG } from "@/lib/workspace-host";

import { WORKSPACE_CORE_MODULE_IDS } from "@/lib/platform-workspaces/module-catalogue";
import type { WorkspaceSidebarConfigSnapshot } from "@/lib/platform-workspaces/workspace-sidebar-config";

const CORE_CATALOGUE_MODULE_ID_SET = new Set<string>(WORKSPACE_CORE_MODULE_IDS);

export function isUnit311CentralArchitectureId(architectureId: string): boolean {
  return architectureId.trim().toLowerCase() === INTERNAL_WORKSPACE_SLUG;
}

/** Whether the workspace-architecture tree includes the Unit311 Central node. */
export function workspaceArchitectureFilterIncludesUnit311Central(
  workspaceFilter?: string | null,
): boolean {
  const filter = String(workspaceFilter ?? "all").trim().toLowerCase();
  return filter === "all" || !filter || filter === INTERNAL_WORKSPACE_SLUG;
}

/**
 * Enabled Core Product module ids for Unit311 Central workspace architecture.
 * Order follows `snapshot.enabledModuleIds` (whoami / workspace_sidebar_modules).
 * Uses catalogue membership only — not WORKSPACE_CORE_MODULE_IDS as the enabled list.
 */
export function unit311CentralEnabledCoreModuleIds(
  snapshot: WorkspaceSidebarConfigSnapshot | null | undefined,
): string[] {
  if (!snapshot?.enabledModuleIds?.length) return [];
  return snapshot.enabledModuleIds.filter((moduleId) =>
    CORE_CATALOGUE_MODULE_ID_SET.has(moduleId),
  );
}

/** Internal Central host surfaces injected on internal.unit311central.com (not Core Product modules). */
export function buildUnit311CentralPlatformNavigationNodes(
  workspaceArchitectureId: string = INTERNAL_WORKSPACE_SLUG,
): ArchitectureTaxonomyNode[] {
  const prefix = `workspace::${workspaceArchitectureId}::platform-navigation`;
  return [
    {
      id: `${prefix}::analytics`,
      label: "Analytics",
      level: "module",
      kind: "structural",
      note: "Internal host platform navigation (injectInternalPlatformAnalytics)",
    },
    {
      id: `${prefix}::support`,
      label: "Support",
      level: "module",
      kind: "structural",
      note: "Unit311 platform support (unit311-platform-support)",
    },
    {
      id: `${prefix}::workspaces`,
      label: "Workspaces",
      level: "module",
      kind: "structural",
      note: "Internal host Workspaces navigation surface",
    },
  ];
}
