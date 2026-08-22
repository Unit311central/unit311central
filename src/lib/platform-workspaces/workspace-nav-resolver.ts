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
import type { InternalNavSection } from "@/lib/internal-operations-data";

export type WorkspaceNavContext = {
  workspaceSlug?: string | null;
  workspaceType?: string | null;
  enablement?: WorkspaceNavEnablement | null;
};

function usesLegacySpecialistNav(slug: string | null | undefined): boolean {
  return isSpecialistWorkspaceSlug(slug);
}

/**
 * Base nav tree before grants / host overlays (Talanton, ABHI, OnwardAir, internal Workspaces).
 * Specialist workspaces keep legacy internalSurveyNavSections; all other workspaces use the
 * canonical product catalogue filtered by enablement.
 */
export function resolveWorkspaceNavBaseSections(ctx: WorkspaceNavContext): readonly InternalNavSection[] {
  if (usesLegacySpecialistNav(ctx.workspaceSlug)) {
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
