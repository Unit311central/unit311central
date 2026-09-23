/**
 * Executive Assistant — agreed product taxonomy (Core Module → Core Features → Core Sub-features).
 *
 * Verification-only formalisation. Maps taxonomy levels to EXISTING Operating Assistant
 * surfaces and tool families — it does not introduce new routes, nav, or provisioning.
 *
 *   1 Core Module · 4 Core Features · 2 Core Sub-features (under Business Actions) · 0 Custom
 *
 * Command Centre (Home / MOD-001) is not part of this module.
 */

export const EXECUTIVE_ASSISTANT_MODULE_ID = "executive-assistant" as const;

export const EXECUTIVE_ASSISTANT_MODULE_LABEL = "Executive Assistant" as const;

/** Existing platform view id for the Operating Assistant shell — unchanged. */
export const EXECUTIVE_ASSISTANT_VIEW_ID = "executive-assistant" as const;

export type ExecutiveAssistantSubFeature = {
  label: string;
  /** Primary tool identifiers preserved from tool-service / planning pipeline. */
  toolIds: readonly string[];
};

export type ExecutiveAssistantCoreFeature = {
  label: string;
  subFeatures?: readonly ExecutiveAssistantSubFeature[];
};

/**
 * Four Core Features in agreed order. Business Actions is the only feature with
 * formal Core Sub-features (Action Framework writes + goal planning).
 */
export const EXECUTIVE_ASSISTANT_CORE_FEATURES: readonly ExecutiveAssistantCoreFeature[] = [
  { label: "Operating Assistant" },
  { label: "Proactive Intelligence" },
  { label: "Guided Learning" },
  {
    label: "Business Actions",
    subFeatures: [
      {
        label: "Action plan proposal & execution",
        toolIds: ["proposeBusinessActionPlan", "executeActionPlan"],
      },
      {
        label: "Goal & multi-step planning",
        toolIds: ["planBusinessGoal", "executeGoalPlan"],
      },
    ],
  },
] as const;

export const EXECUTIVE_ASSISTANT_CUSTOM_FEATURES: readonly string[] = [];

export const EXECUTIVE_ASSISTANT_CUSTOM_SUB_FEATURES: readonly string[] = [];

/** Workspace-specific Executive Intelligence tool packs must not enter Core Product taxonomy. */
export const EXECUTIVE_ASSISTANT_EXCLUDED_WORKSPACE_TOOL_PREFIXES = [
  "abhi-executive",
  "northstar-executive",
  "talanton-executive",
  "onwardair-executive",
] as const;

export function executiveAssistantCoreFeatureCount(): number {
  return EXECUTIVE_ASSISTANT_CORE_FEATURES.length;
}

export function executiveAssistantCoreSubFeatureCount(): number {
  return EXECUTIVE_ASSISTANT_CORE_FEATURES.reduce(
    (total, feature) => total + (feature.subFeatures?.length ?? 0),
    0,
  );
}

export function getExecutiveAssistantBusinessActionsSubFeature(
  label: string,
): ExecutiveAssistantSubFeature | undefined {
  const businessActions = EXECUTIVE_ASSISTANT_CORE_FEATURES.find(
    (feature) => feature.label === "Business Actions",
  );
  return businessActions?.subFeatures?.find((sub) => sub.label === label);
}
