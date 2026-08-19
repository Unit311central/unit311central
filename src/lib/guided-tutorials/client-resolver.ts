/**
 * Client-safe tutorial resolver — safe to import from "use client" components.
 */

import { isClientViewEnabledInWorkspace } from "@/lib/guided-tutorials/client-workspace-views";
import { resolveTutorialWithViewCheck } from "@/lib/guided-tutorials/resolve-tutorial-core";
import type { TutorialIdentity, TutorialResolution } from "@/lib/guided-tutorials/types";

export function resolveTutorial(identity: TutorialIdentity): TutorialResolution {
  const workspaceSlug = identity.workspaceSlug.trim().toLowerCase();
  return resolveTutorialWithViewCheck(identity, (viewId) =>
    isClientViewEnabledInWorkspace(workspaceSlug, viewId),
  );
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
