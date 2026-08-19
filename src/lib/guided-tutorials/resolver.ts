import { getWorkspaceEnablement } from "@/lib/central-application-model/workspace-enablement";
import { listTutorialDefinitions } from "@/lib/guided-tutorials/registry";
import type {
  TutorialDefinition,
  TutorialIdentity,
  TutorialResolution,
} from "@/lib/guided-tutorials/types";

function identityKey(identity: TutorialIdentity): string {
  return `${identity.workspaceSlug}:${identity.viewId}:${identity.tabKey ?? ""}`;
}

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
    // View-level tutorial applies when no tab-specific tutorial exists.
    return true;
  }
  return true;
}

export function resolveTutorial(identity: TutorialIdentity): TutorialResolution {
  const workspaceSlug = identity.workspaceSlug.trim().toLowerCase();
  const enablement = getWorkspaceEnablement(workspaceSlug);

  if (!enablement.enabledViewIds.has(identity.viewId)) {
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

  // Prefer tab-specific tutorial when tabKey is set.
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
    keys.add(identityKey({
      workspaceSlug: "*",
      viewId: tutorial.viewId,
      tabKey: tutorial.tabKey,
    }));
  }
  return [...keys];
}
