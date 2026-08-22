import type { TutorialDefinition } from "@/lib/guided-tutorials/types";

/** BUSINESS PRODUCTIVITY — module dashboard (primary binding: productivity-dashboard). */
export const BUSINESS_PRODUCTIVITY_DASHBOARD_TUTORIAL: TutorialDefinition = {
  tutorialId: "business-productivity.dashboard",
  viewId: "productivity-dashboard",
  workspaces: "*",
  moduleLabel: "Business Productivity",
  functionLabel: "Dashboard",
  title: "Business Productivity Dashboard",
  description:
    "Learn how the Business Productivity dashboard connects calendar, communications, files, and content tools in one workspace hub.",
  estimatedMinutes: 3,
  declaredTargetIds: [],
  steps: [
    {
      id: "welcome",
      title: "Productivity hub",
      body: "This dashboard orients you to calendar load, messaging volume, file activity, and content production. It synthesizes Business Productivity modules — execution happens in each tool.",
      presentation: "callout",
    },
    {
      id: "kpis",
      title: "Activity snapshot",
      body: "KPI tiles may show meetings today, unread messages, recent file uploads, and content drafts in progress. Values refresh from connected productivity modules.",
      presentation: "highlight",
      actions: ["Check today's meeting load", "Note unread communications"],
    },
    {
      id: "tools",
      title: "Tool shortcuts",
      body: "Quick links open Calendar, Messaging, Email, File Explorer, and Content Studio. Use the dashboard to prioritize; complete work in the target application.",
      presentation: "callout",
    },
    {
      id: "collaboration",
      title: "Cross-team collaboration",
      body: "Recent activity feeds show shared files, scheduled calls, and published content. Follow links to collaborate in the originating module.",
      presentation: "callout",
    },
    {
      id: "try-review",
      title: "Try it: clear one item",
      body: "Pick one productivity signal — a meeting, message thread, or file — and open the module to act on it.",
      presentation: "try",
      tryPrompt: "Open one Business Productivity function from this dashboard to clear a single priority item.",
    },
    {
      id: "complete",
      title: "You are ready",
      body: "Start each day here for workload orientation. Pair with Executive Assistant when you need cross-module answers.",
      presentation: "callout",
    },
  ],
};
