import { buildClientNavSectionsForSlug } from "@/lib/guided-tutorials/client-workspace-views";
import type {
  InternalNavChildItem,
  InternalNavItem,
  InternalNavSection,
} from "@/lib/internal-operations-data";
import { ABHI_SLUG } from "@/lib/abhi-surface";
import { DEMO_WORKSPACE_SLUG } from "@/lib/app-domains";
import { ONWARDAIR_SLUG } from "@/lib/onwardair-surface";
import { TALANTON_IMPACT_SLUG } from "@/lib/talanton-surface";
import { INTERNAL_WORKSPACE_SLUG } from "@/lib/workspace-host";

import type { DiscoveredNavLeaf } from "./types";

/** Workspace packs scanned for function discovery (availability metadata only). */
export const COVERAGE_WORKSPACE_SLUGS = [
  ONWARDAIR_SLUG,
  DEMO_WORKSPACE_SLUG,
  INTERNAL_WORKSPACE_SLUG,
  ABHI_SLUG,
  TALANTON_IMPACT_SLUG,
] as const;

export type CoverageWorkspaceSlug = (typeof COVERAGE_WORKSPACE_SLUGS)[number];

/** Runtime resolver binding key — not a tutorial identity. */
export function runtimeBindingKey(viewId: string, tabKey?: string): string {
  return `${viewId}:${tabKey ?? ""}`;
}

/** @deprecated Use runtimeBindingKey — kept for registry reconciliation. */
export function tutorialIdentityKey(viewId: string, tabKey?: string): string {
  return runtimeBindingKey(viewId, tabKey);
}

/** Extract tab/filter/section from nav child query — mirrors resolveTutorialTabKey inputs. */
export function tabKeyFromNavQuery(query?: Record<string, string>): string | undefined {
  if (!query) return undefined;
  const tab = query.tab?.trim();
  if (tab) return tab;
  const filter = query.filter?.trim();
  if (filter) return filter;
  const section = query.section?.trim();
  if (section) return section;
  return undefined;
}

type RawNavLeaf = {
  viewId: string;
  tabKey?: string;
  workspaceSlug: string;
};

function walkNavItems(
  items: readonly InternalNavItem[],
  workspaceSlug: string,
  acc: RawNavLeaf[],
): void {
  for (const item of items) {
    if (item.children?.length) {
      for (const child of item.children) {
        collectChildLeaf(child, workspaceSlug, acc);
      }
    } else if (item.view) {
      acc.push({
        viewId: item.view,
        tabKey: tabKeyFromNavQuery(item.query),
        workspaceSlug,
      });
    }
  }
}

function collectChildLeaf(
  child: InternalNavChildItem,
  workspaceSlug: string,
  acc: RawNavLeaf[],
): void {
  if (child.children?.length) {
    for (const nested of child.children) {
      collectChildLeaf(nested, workspaceSlug, acc);
    }
    return;
  }
  if (!child.view) return;
  acc.push({
    viewId: child.view,
    tabKey: tabKeyFromNavQuery(child.query),
    workspaceSlug,
  });
}

function walkSections(sections: readonly InternalNavSection[], workspaceSlug: string): RawNavLeaf[] {
  const raw: RawNavLeaf[] = [];
  for (const section of sections) {
    walkNavItems(section.items, workspaceSlug, raw);
  }
  return raw;
}

/** Merge discovered leaves by runtime binding across workspace packs. */
export function mergeDiscoveredNavLeaves(rawLeaves: readonly RawNavLeaf[]): DiscoveredNavLeaf[] {
  const merged = new Map<string, { viewId: string; tabKey?: string; slugs: Set<string> }>();

  for (const leaf of rawLeaves) {
    const key = runtimeBindingKey(leaf.viewId, leaf.tabKey);
    const existing = merged.get(key);
    if (existing) {
      existing.slugs.add(leaf.workspaceSlug);
    } else {
      merged.set(key, {
        viewId: leaf.viewId,
        tabKey: leaf.tabKey,
        slugs: new Set([leaf.workspaceSlug]),
      });
    }
  }

  return [...merged.values()]
    .map((entry) => ({
      viewId: entry.viewId,
      tabKey: entry.tabKey,
      workspaceSlugs: [...entry.slugs].sort(),
    }))
    .sort((a, b) => runtimeBindingKey(a.viewId, a.tabKey).localeCompare(runtimeBindingKey(b.viewId, b.tabKey)));
}

export function extractDiscoveredNavLeavesForWorkspace(
  workspaceSlug: string,
): readonly DiscoveredNavLeaf[] {
  const sections = buildClientNavSectionsForSlug(workspaceSlug);
  return mergeDiscoveredNavLeaves(walkSections(sections, workspaceSlug));
}

/** Unique product functions discovered from navigation (deduped by runtime binding). */
export function extractAllDiscoveredNavLeaves(): readonly DiscoveredNavLeaf[] {
  const raw: RawNavLeaf[] = [];
  for (const workspaceSlug of COVERAGE_WORKSPACE_SLUGS) {
    const sections = buildClientNavSectionsForSlug(workspaceSlug);
    raw.push(...walkSections(sections, workspaceSlug));
  }
  return mergeDiscoveredNavLeaves(raw);
}

/** @deprecated Use extractAllDiscoveredNavLeaves */
export function extractAllCoverageNavLeaves(): readonly DiscoveredNavLeaf[] {
  return extractAllDiscoveredNavLeaves();
}

export function extractNavLeavesForWorkspace(workspaceSlug: string): readonly DiscoveredNavLeaf[] {
  return extractDiscoveredNavLeavesForWorkspace(workspaceSlug);
}
