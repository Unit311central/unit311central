import type { TutorialDefinition } from "@/lib/guided-tutorials/types";

/** EXECUTIVE ASSISTANT — conversation-first operating assistant. */
export const EXECUTIVE_ASSISTANT_TUTORIAL: TutorialDefinition = {
  tutorialId: "executive-assistant",
  viewId: "executive-assistant",
  workspaces: "*",
  moduleLabel: "Executive Assistant",
  functionLabel: "Executive Assistant",
  title: "Executive Assistant",
  description:
    "Learn how to use the Executive Assistant to ask questions, run approved actions, and follow up on platform data.",
  estimatedMinutes: 3,
  declaredTargetIds: [],
  steps: [
    {
      id: "welcome",
      title: "Operating assistant, not a blank chat",
      body: "The Executive Assistant is a workspace-aware assistant grounded in your enabled modules. It can summarize live data, draft outputs, and propose follow-up actions you can run in context.",
      presentation: "callout",
    },
    {
      id: "ask",
      title: "Ask in plain language",
      body: "Type a question about finances, pipeline, projects, intelligence, or operations. The assistant resolves context from your current workspace and role entitlements — it only surfaces data you are permitted to see.",
      presentation: "highlight",
      actions: [
        "Ask for a summary of a module you use daily",
        "Request a comparison or trend when historical data exists",
      ],
    },
    {
      id: "actions",
      title: "Follow-up actions",
      body: "When the assistant proposes an action card, review the detail before confirming. Actions respect the same permissions as the UI — they do not bypass module security.",
      presentation: "callout",
    },
    {
      id: "outputs",
      title: "Briefings and exports",
      body: "For supported asks, the assistant can produce briefings or downloadable outputs (for example PDF summaries) using live platform data rather than generic placeholders.",
      presentation: "callout",
    },
    {
      id: "try-ask",
      title: "Try it: one operational question",
      body: "Ask something you would otherwise look up manually — open pipeline value, overdue receivables, or this week's priorities — and follow any suggested navigation.",
      presentation: "try",
      tryPrompt: "Ask the Executive Assistant one question about current business data.",
    },
    {
      id: "complete",
      title: "You are ready",
      body: "Use the Executive Assistant for speed; use modules for authoritative edits and approvals. Return here when you need a cross-module briefing.",
      presentation: "callout",
    },
  ],
};
