import { DEMO_WORKSPACE_SLUG } from "@/lib/app-domains";
import { buildTutorialContext } from "@/lib/guided-tutorials/context";
import { buildClientNavSectionsForSlug } from "@/lib/guided-tutorials/client-workspace-views";
import type {
  InternalNavChildItem,
  InternalNavItem,
  InternalNavSection,
} from "@/lib/internal-operations-data";
import { ABHI_SLUG } from "@/lib/abhi-surface";
import { ONWARDAIR_SLUG } from "@/lib/onwardair-surface";
import { TALANTON_IMPACT_SLUG } from "@/lib/talanton-surface";
import { INTERNAL_WORKSPACE_SLUG } from "@/lib/workspace-host";

import type { TutorialNavLeaf } from "./types";

/** Workspace packs included in platform-wide tutorial coverage. */
export const COVERAGE_WORKSPACE_SLUGS = [
  ONWARDAIR_SLUG,
  DEMO_WORKSPACE_SLUG,
  INTERNAL_WORKSPACE_SLUG,
  ABHI_SLUG,
  TALANTON_IMPACT_SLUG,
] as const;

export type CoverageWorkspaceSlug = (typeof COVERAGE_WORKSPACE_SLUGS)[number];

export function tutorialIdentityKey(viewId: string, tabKey?: string): string {
  return `${viewId}:${tabKey ?? ""}`;
}

/** Extract tab/filter/section from nav child query — mirrors resolveTutorialTabKey inputs. */
export function tabKeyFromNavQuery(
  query?: Record<string, string>,
): string | undefined {
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

export function extractNavLeavesForWorkspace(
  workspaceSlug: string,
): readonly TutorialNavLeaf[] {
  const sections = buildClientNavSectionsForSlug(workspaceSlug);
  return mergeRawLeaves(walkSections(sections, workspaceSlug));
}

function walkSections(
  sections: readonly InternalNavSection[],
  workspaceSlug: string,
): RawNavLeaf[] {
  const raw: RawNavLeaf[] = [];
  for (const section of sections) {
    walkNavItems(section.items, workspaceSlug, raw);
  }
  return raw;
}

function mergeRawLeaves(rawLeaves: readonly RawNavLeaf[]): TutorialNavLeaf[] {
  const merged = new Map<string, { slugs: Set<string>; viewId: string; tabKey?: string }>();

  for (const leaf of rawLeaves) {
    const key = tutorialIdentityKey(leaf.viewId, leaf.tabKey);
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

  const labelSlug =
    [...merged.values()].some((entry) => entry.slugs.has(ONWARDAIR_SLUG))
      ? ONWARDAIR_SLUG
      : COVERAGE_WORKSPACE_SLUGS.find((slug) =>
          [...merged.values()].some((entry) => entry.slugs.has(slug)),
        ) ?? DEMO_WORKSPACE_SLUG;

  const results: TutorialNavLeaf[] = [];

  for (const entry of merged.values()) {
    const context = buildTutorialContext({
      workspaceSlug: labelSlug,
      viewId: entry.viewId,
      tabKey: entry.tabKey,
    });
    results.push({
      viewId: entry.viewId,
      tabKey: entry.tabKey,
      moduleLabel: context.moduleLabel,
      sectionLabel: context.sectionLabel,
      functionLabel: context.functionLabel,
      workspaceSlugs: [...entry.slugs].sort(),
    });
  }

  return results.sort((a, b) => {
    const moduleCmp = a.moduleLabel.localeCompare(b.moduleLabel);
    if (moduleCmp !== 0) return moduleCmp;
    const sectionCmp = a.sectionLabel.localeCompare(b.sectionLabel);
    if (sectionCmp !== 0) return sectionCmp;
    return a.functionLabel.localeCompare(b.functionLabel);
  });
}

/** All unique navigable leaves across covered workspace packs. */
export function extractAllCoverageNavLeaves(): readonly TutorialNavLeaf[] {
  const raw: RawNavLeaf[] = [];
  for (const workspaceSlug of COVERAGE_WORKSPACE_SLUGS) {
    const sections = buildClientNavSectionsForSlug(workspaceSlug);
    raw.push(...walkSections(sections, workspaceSlug));
  }
  return mergeRawLeaves(raw);
}
