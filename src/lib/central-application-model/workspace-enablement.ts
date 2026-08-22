/**
 * Workspace enablement — derived from canonical product nav per workspace slug.
 */

import { DEMO_WORKSPACE_SLUG } from "@/lib/app-domains";
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
import { getEaWorkspacePackNavSections } from "@/lib/ai-operating-assistant/workspace-packs/registry";
import { resolveWorkspaceNavBaseSections } from "@/lib/platform-workspaces/workspace-nav-resolver";
import {
  resolveWorkspaceNavEnablement,
  type WorkspaceNavEnablement,
} from "@/lib/platform-workspaces/workspace-product-nav";

import { resolveModuleIdFromNavLabel } from "./canonical-modules";
import type { WorkspaceEnablementSnapshot } from "./types";

const enablementCache = new Map<string, WorkspaceEnablementSnapshot>();
const navEnablementOverrides = new Map<string, WorkspaceNavEnablement>();

export function setWorkspaceNavEnablementForTests(
  slug: string | null | undefined,
  enablement: WorkspaceNavEnablement | null,
): void {
  const key = String(slug ?? "default").trim().toLowerCase();
  if (!enablement) {
    navEnablementOverrides.delete(key);
    enablementCache.delete(key);
    return;
  }
  navEnablementOverrides.set(key, enablement);
  enablementCache.delete(key);
}

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

function flattenNavSections(sections: readonly InternalNavSection[]): WorkspaceEnablementSnapshot {
  const enabledModuleIds = new Set<string>();
  const enabledViewIds = new Set<string>();
  const enabledDomainIds = new Set<string>();

  for (const section of sections) {
    if (section.kind === "pin") {
      for (const item of section.items) {
        if (item.view) enabledViewIds.add(item.view);
        if (item.view === "executive-assistant") enabledModuleIds.add("executive-assistant");
        if (item.view === "home") enabledModuleIds.add("home");
      }
      continue;
    }

    const moduleId = resolveModuleIdFromNavLabel(section.label ?? "");
    if (moduleId) enabledModuleIds.add(moduleId);

    collectViewIds(section.items, enabledViewIds);

    for (const item of section.items) {
      if (item.view) {
        enabledDomainIds.add(item.view.split("-")[0] ?? item.view);
      }
      if (item.children) {
        for (const child of item.children) {
          if (child.view) {
            enabledDomainIds.add(child.view.split("-")[0] ?? child.view);
          }
        }
      }
    }
  }

  return {
    workspaceSlug: "",
    enabledModuleIds,
    enabledViewIds,
    enabledDomainIds,
  };
}

function buildNavForSlug(slug: string): readonly InternalNavSection[] {
  const normalized = slug.trim().toLowerCase();

  const packNav = getEaWorkspacePackNavSections(normalized);
  if (packNav?.length) return packNav;

  bootstrapIntelligenceWorkspacePacks();

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

  const override = navEnablementOverrides.get(normalized);
  const isDemo = normalized === DEMO_WORKSPACE_SLUG || normalized === "demo";
  const enablement =
    override ??
    resolveWorkspaceNavEnablement({
      workspaceSlug: normalized,
      workspaceType: isDemo ? "Demo" : "Customer",
    });

  return resolveWorkspaceNavBaseSections({
    workspaceSlug: normalized,
    workspaceType: isDemo ? "Demo" : "Customer",
    enablement,
  });
}

export function getWorkspaceEnablement(slug: string | null | undefined): WorkspaceEnablementSnapshot {
  const key = String(slug ?? "default").trim().toLowerCase();
  const cached = enablementCache.get(key);
  if (cached) return cached;

  const sections = buildNavForSlug(key);
  const snapshot = flattenNavSections(sections);
  snapshot.workspaceSlug = key;
  enablementCache.set(key, snapshot);
  return snapshot;
}

export function isModuleEnabledInWorkspace(
  moduleId: string,
  slug: string | null | undefined,
): boolean {
  const enablement = getWorkspaceEnablement(slug);
  return enablement.enabledModuleIds.has(moduleId);
}

export function assertModulesEnabled(
  moduleIds: string[],
  slug: string | null | undefined,
): { ok: true } | { ok: false; message: string; disabledModule: string } {
  for (const moduleId of moduleIds) {
    if (!isModuleEnabledInWorkspace(moduleId, slug)) {
      const mod = moduleId.replace(/-/g, " ");
      return {
        ok: false,
        disabledModule: moduleId,
        message: `The ${mod} module is not enabled in your current workspace. I can't answer questions about functionality that isn't available here.`,
      };
    }
  }
  return { ok: true };
}

export function resetWorkspaceEnablementCacheForTests(): void {
  enablementCache.clear();
  navEnablementOverrides.clear();
}
