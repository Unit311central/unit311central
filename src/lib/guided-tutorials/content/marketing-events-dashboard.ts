import type { TutorialDefinition } from "@/lib/guided-tutorials/types";

/** MARKETING & EVENTS — module dashboard (primary binding: oa-marketing-dashboard). */
export const MARKETING_EVENTS_DASHBOARD_TUTORIAL: TutorialDefinition = {
  tutorialId: "marketing-events.dashboard",
  viewId: "oa-marketing-dashboard",
  workspaces: "*",
  moduleLabel: "Marketing & Events",
  functionLabel: "Dashboard",
  title: "Marketing & Events Dashboard",
  description:
    "Learn how the Marketing & Events dashboard summarizes campaigns, events, audience growth, and content pipeline health.",
  estimatedMinutes: 3,
  declaredTargetIds: [],
  steps: [
    {
      id: "welcome",
      title: "Marketing command view",
      body: "This dashboard aggregates campaign performance, event schedules, mailing-list growth, and content production status. Data comes from Marketing & Events functions — not manual dashboard entry.",
      presentation: "callout",
    },
    {
      id: "kpis",
      title: "Campaign and audience KPIs",
      body: "Top metrics may include active campaigns, upcoming events, list growth, and engagement rates. Use them to prioritize weekly marketing stand-ups.",
      presentation: "highlight",
      actions: ["Identify one campaign needing attention", "Check upcoming event deadlines"],
    },
    {
      id: "content",
      title: "Content and channels",
      body: "Summaries link to Event Management, Digital Newsletter, Mailing Lists, and Media Library functions. The dashboard signals workload; authoring happens in each channel screen.",
      presentation: "callout",
    },
    {
      id: "coordination",
      title: "Cross-team coordination",
      body: "Activity feeds may show recent publishes, list imports, or event registrations. Route follow-ups to the owning marketer or event owner in the detailed module.",
      presentation: "callout",
    },
    {
      id: "try-review",
      title: "Try it: one marketing action",
      body: "Select one campaign or event that needs an update and open the Marketing & Events function to act on it.",
      presentation: "try",
      tryPrompt: "Open one Marketing & Events function from this dashboard to advance a live campaign or event.",
    },
    {
      id: "complete",
      title: "You are ready",
      body: "Review this dashboard weekly. Pair with Business Productivity when email or content studio work supports campaigns.",
      presentation: "callout",
    },
  ],
};
