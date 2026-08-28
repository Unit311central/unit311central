import { DEMO_WORKSPACE_SLUG } from "@/lib/app-domains";
import { isDemoWorkspaceSlug } from "@/lib/demo/read-only";
import type { InternalOperationsView } from "@/lib/internal-operations-data";
import { isInternalOperationsView } from "@/lib/internal-operations-data";
import { isViewAllowedForGrants } from "@/lib/internal-role-views";
import { isPailexSlug } from "@/lib/pailex/pailex-surface";
import { isPailexWorkspaceView } from "@/lib/pailex/pailex-views";
import {
  getWorkspaceModuleEntry,
  type WorkspaceModuleCatalogueEntry,
} from "@/lib/platform-workspaces/module-catalogue";

/** Collect navigable view ids enabled for a workspace from module catalogue metadata. */
export function viewsForWorkspaceEnablement(
  enabledModules: readonly string[] | null | undefined,
  enabledSubModules: readonly string[] | null | undefined,
): InternalOperationsView[] {
  const modules = enabledModules ?? [];
  if (!modules.length) return [];

  const subKeys = new Set(enabledSubModules ?? []);
  const filterSubs = subKeys.size > 0;
  const views = new Set<InternalOperationsView>();

  for (const moduleId of modules) {
    const entry = getWorkspaceModuleEntry(moduleId);
    if (!entry) continue;
    collectModuleViews(entry, moduleId, filterSubs, subKeys, views);
  }

  return [...views];
}

function collectModuleViews(
  entry: WorkspaceModuleCatalogueEntry,
  moduleId: string,
  filterSubs: boolean,
  enabledSubKeys: ReadonlySet<string>,
  views: Set<InternalOperationsView>,
) {
  for (const sub of entry.subModules) {
    if (filterSubs) {
      const key = `${moduleId}:${sub.id}`;
      if (!enabledSubKeys.has(key)) continue;
    }
    if (sub.viewId && isInternalOperationsView(sub.viewId)) {
      views.add(sub.viewId);
    }
  }
}

/**
 * Union explicit operator grants with workspace-enabled catalogue views.
 * Used for Demo/Northstar so enabled modules remain reachable even when legacy
 * operator rows omit newer submodule view ids (e.g. Fundraising, Technical Files).
 */
export function mergeAllowedViewsWithWorkspaceEnablement(
  allowedViews: InternalOperationsView[] | null | undefined,
  enabledModules: readonly string[] | null | undefined,
  enabledSubModules: readonly string[] | null | undefined,
): InternalOperationsView[] | null {
  if (allowedViews == null) return null;

  const enabledViews = viewsForWorkspaceEnablement(enabledModules, enabledSubModules);
  if (!enabledViews.length) return allowedViews;

  const merged = new Set<InternalOperationsView>(allowedViews);
  for (const view of enabledViews) merged.add(view);
  return [...merged];
}

/**
 * Grant check with workspace catalogue fallback for Demo/Northstar.
 * Keeps explicit operator grants authoritative on customer workspaces.
 */
export function isViewAllowedForWorkspaceGrants(
  view: InternalOperationsView,
  allowedViews: readonly InternalOperationsView[] | null | undefined,
  options?: {
    enabledModules?: readonly string[] | null;
    enabledSubModules?: readonly string[] | null;
    workspaceSlug?: string | null;
  },
): boolean {
  if (isViewAllowedForGrants(view, allowedViews)) return true;

  const slug = String(options?.workspaceSlug ?? "")
    .trim()
    .toLowerCase();
  if (isPailexSlug(slug) && isPailexWorkspaceView(view)) return true;

  if (slug !== DEMO_WORKSPACE_SLUG && slug !== "demo") return false;

  const enabledViews = viewsForWorkspaceEnablement(
    options?.enabledModules,
    options?.enabledSubModules,
  );
  return enabledViews.includes(view);
}

/** Demo operators: union legacy explicit grants with all enabled catalogue views. */
export function applyDemoWorkspaceAllowedViews(
  allowedViews: InternalOperationsView[] | null | undefined,
  workspaceSlug: string | null | undefined,
  enabledModules: readonly string[] | null | undefined,
  enabledSubModules: readonly string[] | null | undefined,
): InternalOperationsView[] | null {
  if (!isDemoWorkspaceSlug(workspaceSlug)) return allowedViews ?? null;
  return mergeAllowedViewsWithWorkspaceEnablement(
    allowedViews,
    enabledModules,
    enabledSubModules,
  );
}
