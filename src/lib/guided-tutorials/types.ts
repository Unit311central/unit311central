/**
 * Guided Tutorials — content model for workspace-aware in-app learning.
 *
 * Identity: workspaceSlug + viewId + optional tabKey
 * Presentation types are extensible; first ship uses highlight + callout.
 */

export type TutorialPresentationKind =
  | "highlight"
  | "callout"
  | "walkthrough"
  | "screenshot"
  | "diagram"
  | "animation"
  | "video"
  | "try";

export type TutorialStep = {
  id: string;
  title: string;
  body: string;
  /** DOM marker via data-tutorial-target (falls back to data-ai-target). */
  targetId?: string;
  presentation?: TutorialPresentationKind;
  /** Optional bullet actions the user can take on this screen. */
  actions?: string[];
  /** For presentation === "try" — what the user should attempt. */
  tryPrompt?: string;
};

export type TutorialDefinition = {
  /** Stable id for progress + analytics. */
  tutorialId: string;
  viewId: string;
  tabKey?: string;
  /**
   * Workspace slugs this tutorial applies to, or "*" for any workspace where
   * the view is enabled in nav enablement.
   */
  workspaces: readonly string[] | "*";
  moduleLabel: string;
  functionLabel: string;
  title: string;
  description: string;
  estimatedMinutes: number;
  steps: readonly TutorialStep[];
  /** Declared UI targets referenced by steps (used for validation). */
  declaredTargetIds: readonly string[];
};

export type TutorialIdentity = {
  workspaceSlug: string;
  viewId: string;
  tabKey?: string;
};

export type TutorialResolutionAvailable = {
  status: "available";
  identity: TutorialIdentity;
  tutorial: TutorialDefinition;
};

export type TutorialResolutionUnavailable = {
  status: "unavailable";
  identity: TutorialIdentity;
  reason: "view_not_in_workspace" | "no_tutorial_defined" | "workspace_not_supported";
  message: string;
};

export type TutorialResolution = TutorialResolutionAvailable | TutorialResolutionUnavailable;

export type TutorialValidationIssue = {
  severity: "error" | "warning";
  code: string;
  tutorialId?: string;
  workspaceSlug?: string;
  viewId?: string;
  targetId?: string;
  message: string;
};

export type TutorialCoverageReport = {
  definedTutorials: Array<{
    tutorialId: string;
    viewId: string;
    workspaces: readonly string[] | "*";
    stepCount: number;
  }>;
  issues: TutorialValidationIssue[];
  workspaceCoverage: Array<{
    workspaceSlug: string;
    viewId: string;
    hasTutorial: boolean;
    viewEnabled: boolean;
  }>;
};
