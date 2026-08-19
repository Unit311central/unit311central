import type { TutorialDefinition } from "@/lib/guided-tutorials/types";

/** Separate from legacy guided-learning — EA may dispatch these later without coupling. */
export const GUIDED_TUTORIAL_EVENT = "unit311:guided-tutorial";

export type GuidedTutorialClientAction =
  | {
      type: "start";
      workspaceSlug: string;
      viewId: string;
      tabKey?: string;
      tutorialId?: string;
    }
  | {
      type: "stop";
    };

export function dispatchGuidedTutorial(action: GuidedTutorialClientAction): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(GUIDED_TUTORIAL_EVENT, { detail: action }));
}

export function buildStartTutorialAction(input: {
  workspaceSlug: string;
  viewId: string;
  tabKey?: string;
  tutorial?: TutorialDefinition;
}): GuidedTutorialClientAction {
  return {
    type: "start",
    workspaceSlug: input.workspaceSlug,
    viewId: input.viewId,
    tabKey: input.tabKey,
    tutorialId: input.tutorial?.tutorialId,
  };
}
