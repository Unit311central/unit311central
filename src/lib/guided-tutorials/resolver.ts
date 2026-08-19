/**
 * Server-side tutorial resolver — uses full workspace enablement (incl. EA packs).
 * Do not import from client components; use client-resolver.ts instead.
 */

import { getWorkspaceEnablement } from "@/lib/central-application-model/workspace-enablement";
import { resolveTutorialWithViewCheck } from "@/lib/guided-tutorials/resolve-tutorial-core";
import { listTutorialDefinitions } from "@/lib/guided-tutorials/registry";
import type { TutorialDefinition, TutorialIdentity, TutorialResolution } from "@/lib/guided-tutorials/types";

export function resolveTutorial(identity: TutorialIdentity): TutorialResolution {
  const workspaceSlug = identity.workspaceSlug.trim().toLowerCase();
  const enablement = getWorkspaceEnablement(workspaceSlug);
  return resolveTutorialWithViewCheck(identity, (viewId) => enablement.enabledViewIds.has(viewId));
}

export function resolveTutorialForView(
  workspaceSlug: string,
  viewId: string,
  tabKey?: string,
): TutorialResolution {
  return resolveTutorial({ workspaceSlug, viewId, tabKey });
}

export function isTutorialAvailable(identity: TutorialIdentity): boolean {
  return resolveTutorial(identity).status === "available";
}

export function listResolvableTutorialKeys(): string[] {
  const keys = new Set<string>();
  for (const tutorial of listTutorialDefinitions()) {
    keys.add(`${tutorial.viewId}:${tutorial.tabKey ?? ""}`);
  }
  return [...keys];
}

export type { TutorialDefinition };
