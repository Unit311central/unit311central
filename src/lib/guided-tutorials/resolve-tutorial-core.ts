import { listTutorialDefinitions } from "@/lib/guided-tutorials/registry";
import {
  buildTutorialContext,
  formatTutorialContextPath,
} from "@/lib/guided-tutorials/context";
import { internalViewTitles, type InternalOperationsView } from "@/lib/internal-operations-data";
import type {
  TutorialDefinition,
  TutorialIdentity,
  TutorialResolution,
} from "@/lib/guided-tutorials/types";

function contextPathForIdentity(identity: TutorialIdentity): string {
  const titles = internalViewTitles[identity.viewId as InternalOperationsView];
  if (!titles) {
    return identity.tabKey ? `${identity.viewId} → ${identity.tabKey}` : identity.viewId;
  }
  return formatTutorialContextPath(
    buildTutorialContext({
      workspaceSlug: identity.workspaceSlug,
      viewId: identity.viewId,
      tabKey: identity.tabKey,
    }),
  );
}

export function formatTutorialUnavailableMessage(
  identity: TutorialIdentity,
  reason: "view_not_in_workspace" | "no_tutorial_defined" | "workspace_not_supported",
): string {
  const path = contextPathForIdentity(identity);
  if (reason === "no_tutorial_defined") {
    return `No tutorial is available yet for ${path}.`;
  }
  if (reason === "view_not_in_workspace") {
    return `Learn is not available for ${path} on this workspace.`;
  }
  return `Learn is not available for ${path}.`;
}

function tutorialMatchesWorkspace(tutorial: TutorialDefinition, workspaceSlug: string): boolean {
  if (tutorial.workspaces === "*") return true;
  return tutorial.workspaces.some(
    (slug) => slug.trim().toLowerCase() === workspaceSlug.trim().toLowerCase(),
  );
}

function tutorialMatchesIdentity(tutorial: TutorialDefinition, identity: TutorialIdentity): boolean {
  if (tutorial.viewId !== identity.viewId) return false;
  if (tutorial.tabKey) {
    return tutorial.tabKey === identity.tabKey;
  }
  // View-level tutorials apply only when no tab/section is active.
  return !identity.tabKey;
}

/**
 * Pure tutorial resolution — inject view enablement so callers choose client vs server source.
 */
export function resolveTutorialWithViewCheck(
  identity: TutorialIdentity,
  isViewEnabled: (viewId: string) => boolean,
): TutorialResolution {
  const workspaceSlug = identity.workspaceSlug.trim().toLowerCase();

  if (!isViewEnabled(identity.viewId)) {
    return {
      status: "unavailable",
      identity: { ...identity, workspaceSlug },
      reason: "view_not_in_workspace",
      message: formatTutorialUnavailableMessage(identity, "view_not_in_workspace"),
    };
  }

  const candidates = listTutorialDefinitions().filter(
    (tutorial) =>
      tutorialMatchesIdentity(tutorial, identity) && tutorialMatchesWorkspace(tutorial, workspaceSlug),
  );

  if (candidates.length === 0) {
    return {
      status: "unavailable",
      identity: { ...identity, workspaceSlug },
      reason: "no_tutorial_defined",
      message: formatTutorialUnavailableMessage(identity, "no_tutorial_defined"),
    };
  }

  const tabSpecific =
    identity.tabKey != null
      ? candidates.find((tutorial) => tutorial.tabKey === identity.tabKey)
      : undefined;
  const tutorial = tabSpecific ?? candidates.find((tutorial) => !tutorial.tabKey) ?? candidates[0]!;

  return {
    status: "available",
    identity: { ...identity, workspaceSlug },
    tutorial,
  };
}
