import type { TutorialDefinition } from "@/lib/guided-tutorials/types";

/** BUSINESS CENTRAL — Clients relationship dashboard (primary binding: clients-dashboard). */
export const BUSINESS_CENTRAL_CLIENTS_TUTORIAL: TutorialDefinition = {
  tutorialId: "business-central.clients",
  viewId: "clients-dashboard",
  workspaces: "*",
  moduleLabel: "Business Central",
  functionLabel: "Clients Dashboard",
  title: "Clients Dashboard",
  description:
    "Learn how the Clients dashboard summarizes relationship health, activity, and links into directory and pipeline work.",
  estimatedMinutes: 3,
  declaredTargetIds: [],
  steps: [
    {
      id: "welcome",
      title: "Relationship command view",
      body: "The Clients dashboard is the executive view of your managed relationships — customers, members, or accounts depending on how your organization labels them in Business Central.",
      presentation: "callout",
    },
    {
      id: "kpis",
      title: "Headline KPIs",
      body: "Top metrics typically include active relationships, new additions, open opportunities, and support load. Figures are computed from Client Directory, CRM pipeline, Projects, and Support — not entered manually on this screen.",
      presentation: "highlight",
      actions: ["Identify which KPI moved since your last visit", "Use Refresh if you expect new data"],
    },
    {
      id: "activity",
      title: "Recent activity",
      body: "The activity feed lists cross-module events: new clients, conversions, projects, tickets, and portal invitations. Use it to spot relationships that need follow-up today.",
      presentation: "callout",
    },
    {
      id: "navigation",
      title: "Jump to action",
      body: "Shortcuts from this dashboard open Client Directory, Pipeline, Projects, or External Users. Treat the dashboard as orientation; record changes in the underlying function.",
      presentation: "callout",
      actions: ["Open Client Directory to edit a record", "Open Pipeline to progress an opportunity"],
    },
    {
      id: "try-scan",
      title: "Try it: one follow-up",
      body: "Pick one activity item or KPI that looks off-target and navigate to the module where you can resolve it.",
      presentation: "try",
      tryPrompt: "From the Clients dashboard, open the module needed to act on one highlighted relationship.",
    },
    {
      id: "complete",
      title: "You are ready",
      body: "Return here for a daily relationship pulse. Pair it with Pipeline when you are prioritizing commercial outcomes.",
      presentation: "callout",
    },
  ],
};
