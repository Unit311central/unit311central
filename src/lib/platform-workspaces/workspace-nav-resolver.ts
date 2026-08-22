/**
 * Resolves base navigation sections for a workspace before host-specific overlays.
 */

import { internalSurveyNavSections } from "@/lib/internal-operations-data";
import {
  buildWorkspaceProductNavSections,
  isSpecialistWorkspaceSlug,
  resolveIntelligenceNavLabel,
  resolveWorkspaceNavEnablement,
  type WorkspaceNavEnablement,
} from "@/lib/platform-workspaces/workspace-product-nav";
import { INTERNAL_WORKSPACE_SLUG } from "@/lib/workspace-host";
import type { InternalNavSection } from "@/lib/internal-operations-data";

export type WorkspaceNavContext = {
  workspaceSlug?: string | null;
  workspaceType?: string | null;
  enablement?: WorkspaceNavEnablement | null;
};

function usesLegacySpecialistNav(slug: string | null | undefined): boolean {
  return isSpecialistWorkspaceSlug(slug);
}

/** Internal Central uses the full platform nav and ignores wizard enablement metadata. */
export function usesInternalPlatformNav(
  slug: string | null | undefined,
  workspaceType: string | null | undefined,
): boolean {
  const normalizedType = String(workspaceType ?? "").trim().toLowerCase();
  const normalizedSlug = String(slug ?? "").trim().toLowerCase();
  return normalizedType === "internal" || normalizedSlug === INTERNAL_WORKSPACE_SLUG;
}

/**
 * Base nav tree before grants / host overlays (Talanton, ABHI, OnwardAir, internal Workspaces).
 * Specialist and Internal Central workspaces keep internalSurveyNavSections; Demo and generic
 * customers use the canonical product catalogue filtered by enablement.
 */
export function resolveWorkspaceNavBaseSections(ctx: WorkspaceNavContext): readonly InternalNavSection[] {
  if (usesLegacySpecialistNav(ctx.workspaceSlug)) {
    return internalSurveyNavSections;
  }

  if (usesInternalPlatformNav(ctx.workspaceSlug, ctx.workspaceType)) {
    return internalSurveyNavSections;
  }

  const enablement =
    ctx.enablement ??
    resolveWorkspaceNavEnablement({
      workspaceSlug: ctx.workspaceSlug,
      workspaceType: ctx.workspaceType,
    });

  return buildWorkspaceProductNavSections({
    workspaceSlug: ctx.workspaceSlug,
    workspaceType: ctx.workspaceType,
    enablement,
    intelligenceLabel: resolveIntelligenceNavLabel(ctx.workspaceSlug),
  });
}
