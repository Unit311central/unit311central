import type { TutorialDefinition } from "@/lib/guided-tutorials/types";

/** SETTINGS — General workspace settings (primary binding: settings). */
export const SETTINGS_GENERAL_TUTORIAL: TutorialDefinition = {
  tutorialId: "settings.general",
  viewId: "settings",
  workspaces: "*",
  moduleLabel: "Settings",
  functionLabel: "General",
  title: "General Settings",
  description:
    "Learn how General Settings control workspace identity, regional preferences, notifications, and platform defaults.",
  estimatedMinutes: 3,
  declaredTargetIds: [],
  steps: [
    {
      id: "welcome",
      title: "Workspace configuration",
      body: "General Settings is where administrators configure workspace identity, locale, time zone, and default behaviors. Changes here affect all users unless overridden in Profile.",
      presentation: "callout",
    },
    {
      id: "identity",
      title: "Workspace identity",
      body: "Organization name, branding references, and display defaults are managed in this section. Keep them aligned with Corporate Information records.",
      presentation: "highlight",
      actions: ["Verify organization name matches official records", "Review regional defaults"],
    },
    {
      id: "notifications",
      title: "Notifications and defaults",
      body: "Notification preferences and platform defaults determine how alerts reach users across modules. Adjust carefully — broad changes affect every team.",
      presentation: "callout",
    },
    {
      id: "related",
      title: "Related settings areas",
      body: "Profile, Appearance, and Billing live in sibling Settings functions. General covers workspace-wide policy; user-specific choices belong in Profile.",
      presentation: "callout",
    },
    {
      id: "try-review",
      title: "Try it: verify one default",
      body: "Confirm one workspace default — time zone, locale, or notification rule — matches how your organization operates.",
      presentation: "try",
      tryPrompt: "Review one General Settings value and confirm it is correct for your organization.",
    },
    {
      id: "complete",
      title: "You are ready",
      body: "Revisit General Settings when onboarding a new workspace or after organizational changes.",
      presentation: "callout",
    },
  ],
};
