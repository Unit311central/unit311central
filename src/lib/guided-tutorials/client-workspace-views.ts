/**
 * Client-safe workspace view enablement for guided tutorials.
 *
 * Mirrors the standard application nav model (demo, onwardair, abhi, talanton, internal)
 * without importing EA workspace-pack registry or other server-only modules.
 */

import { DEMO_WORKSPACE_SLUG } from "@/lib/app-domains";
import { injectDemoNavSections } from "@/lib/demo/nav";
import { injectIntelligenceNavIfMissing } from "@/lib/intelligence/nav";
import { bootstrapIntelligenceWorkspacePacks } from "@/lib/intelligence/workspace-packs";
import {
  internalSurveyNavSections,
  type InternalNavItem,
  type InternalNavSection,
} from "@/lib/internal-operations-data";
import {
  buildAbhiNavSections,
  buildOnwardAirNavSections,
  getTalantonImpactNavSections,
} from "@/lib/internal-role-views";
import { ABHI_SLUG } from "@/lib/abhi-surface";
import { ONWARDAIR_SLUG } from "@/lib/onwardair-surface";
import { TALANTON_IMPACT_SLUG } from "@/lib/talanton-surface";

const viewIdCache = new Map<string, ReadonlySet<string>>();

function collectViewIds(items: readonly InternalNavItem[], acc: Set<string>): void {
  for (const item of items) {
    if (item.view) acc.add(item.view);
    if (item.children) {
      for (const child of item.children) {
        if (child.view) acc.add(child.view);
      }
    }
  }
}

function flattenViewIds(sections: readonly InternalNavSection[]): ReadonlySet<string> {
  const enabledViewIds = new Set<string>();
  for (const section of sections) {
    collectViewIds(section.items, enabledViewIds);
  }
  return enabledViewIds;
}

/** Nav sections for a workspace slug — shared by tutorial coverage and client enablement. */
export function buildClientNavSectionsForSlug(slug: string): readonly InternalNavSection[] {
  const normalized = slug.trim().toLowerCase();

  bootstrapIntelligenceWorkspacePacks();

  if (normalized === DEMO_WORKSPACE_SLUG || normalized === "demo") {
    return injectDemoNavSections(internalSurveyNavSections);
  }
  if (normalized === ONWARDAIR_SLUG || normalized.includes("onwardair")) {
    return buildOnwardAirNavSections(internalSurveyNavSections);
  }
  if (normalized === ABHI_SLUG || normalized === "abhi") {
    return buildAbhiNavSections(internalSurveyNavSections);
  }
  if (
    normalized === TALANTON_IMPACT_SLUG ||
    normalized === "talanton" ||
    normalized.includes("talanton")
  ) {
    return getTalantonImpactNavSections();
  }

  return injectIntelligenceNavIfMissing(internalSurveyNavSections, slug);
}

export function getClientEnabledViewIds(slug: string | null | undefined): ReadonlySet<string> {
  const key = String(slug ?? "default").trim().toLowerCase();
  const cached = viewIdCache.get(key);
  if (cached) return cached;

  const viewIds = flattenViewIds(buildClientNavSectionsForSlug(key));
  viewIdCache.set(key, viewIds);
  return viewIds;
}

export function isClientViewEnabledInWorkspace(
  workspaceSlug: string,
  viewId: string,
): boolean {
  return getClientEnabledViewIds(workspaceSlug).has(viewId);
}

export function resetClientWorkspaceViewCacheForTests(): void {
  viewIdCache.clear();
}
