import { listTutorialDefinitions } from "@/lib/guided-tutorials/registry";
import type {
  TutorialDefinition,
  TutorialIdentity,
  TutorialResolution,
} from "@/lib/guided-tutorials/types";

function tutorialMatchesWorkspace(tutorial: TutorialDefinition, workspaceSlug: string): boolean {
  if (tutorial.workspaces === "*") return true;
  return tutorial.workspaces.some(
    (slug) => slug.trim().toLowerCase() === workspaceSlug.trim().toLowerCase(),
  );
}

function tutorialMatchesIdentity(tutorial: TutorialDefinition, identity: TutorialIdentity): boolean {
  if (tutorial.viewId !== identity.viewId) return false;
  if (tutorial.tabKey && tutorial.tabKey !== identity.tabKey) return false;
  if (identity.tabKey && !tutorial.tabKey) {
    return true;
  }
  return true;
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
      message: `The ${identity.viewId} function is not available in workspace "${workspaceSlug}".`,
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
      message: `No tutorial is defined for ${identity.viewId} in workspace "${workspaceSlug}".`,
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
