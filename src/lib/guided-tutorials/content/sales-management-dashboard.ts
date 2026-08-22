import type { TutorialDefinition } from "@/lib/guided-tutorials/types";

/** SALES MANAGEMENT — Dashboard tab. */
export const SALES_MANAGEMENT_DASHBOARD_TUTORIAL: TutorialDefinition = {
  tutorialId: "sales-management.dashboard",
  viewId: "sales-management",
  tabKey: "dashboard",
  workspaces: "*",
  moduleLabel: "Sales Management",
  functionLabel: "Dashboard",
  title: "Sales Management Dashboard",
  description:
    "Learn how the Sales Management dashboard summarizes pipeline value, activity pressure, and priority actions from live CRM data.",
  estimatedMinutes: 3,
  declaredTargetIds: [],
  steps: [
    {
      id: "welcome",
      title: "Sales leadership snapshot",
      body: "This dashboard aggregates CRM leads, quotes, and discovery activity into KPIs and charts. It is read-only synthesis — update records in Pipeline or Business Central CRM.",
      presentation: "callout",
    },
    {
      id: "kpis",
      title: "Headline KPIs",
      body: "Open pipeline value, opportunity count, overdue activities, and upcoming meetings show commercial momentum and execution risk. Values reflect workspace CRM data at load time.",
      presentation: "highlight",
      actions: ["Compare pipeline value to overdue activities", "Note upcoming meetings requiring prep"],
    },
    {
      id: "charts",
      title: "Pipeline charts",
      body: "Stage and trend charts show how opportunities distribute across Cold, Warm, and Hot statuses. Use them to spot bottlenecks before end-of-period reviews.",
      presentation: "callout",
    },
    {
      id: "actions",
      title: "Priority actions",
      body: "Suggested actions highlight leads with stale next actions, high value, or imminent meetings. Treat these as a daily work queue.",
      presentation: "callout",
    },
    {
      id: "try-review",
      title: "Try it: one priority",
      body: "Pick the highest-value overdue activity and open the owning lead in Pipeline to update it.",
      presentation: "try",
      tryPrompt: "Identify one priority action and resolve it in Pipeline.",
    },
    {
      id: "complete",
      title: "You are ready",
      body: "Review this dashboard regularly, then execute in Pipeline and Quotes. Pair with Commissions after deals close.",
      presentation: "callout",
    },
  ],
};
