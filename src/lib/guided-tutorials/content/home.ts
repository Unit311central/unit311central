import type { TutorialDefinition } from "@/lib/guided-tutorials/types";

/** HOME — executive operating snapshot and customizable KPI tiles. */
export const HOME_TUTORIAL: TutorialDefinition = {
  tutorialId: "home",
  viewId: "home",
  workspaces: "*",
  moduleLabel: "Home",
  functionLabel: "Home",
  title: "Home Dashboard",
  description:
    "Learn how the Home dashboard surfaces your executive snapshot and how to personalize the KPI tiles you see first.",
  estimatedMinutes: 3,
  declaredTargetIds: [],
  steps: [
    {
      id: "welcome",
      title: "Your executive starting point",
      body: "Home is the platform landing view after sign-in. It aggregates live KPIs from Business Central, Financials, Projects, and Support so you can orient before drilling into a module.",
      presentation: "callout",
    },
    {
      id: "kpi-tiles",
      title: "KPI tile row",
      body: "The top tiles reflect metrics configured for your role — for example active clients, open pipeline, cash position, or delivery health. Values refresh from the underlying modules; they are not a separate data store.",
      presentation: "highlight",
      actions: ["Scan the tile row for headline numbers", "Note which modules each tile links to"],
    },
    {
      id: "customize",
      title: "Customize your layout",
      body: "Use Customize tiles to choose which KPIs appear on Home. Your layout is saved per user so executives and operators can prioritize different signals without changing org-wide defaults.",
      presentation: "callout",
      actions: ["Open Customize tiles when you want to add or remove a metric"],
    },
    {
      id: "drill-down",
      title: "Drill into modules",
      body: "Tiles and linked sections route you into the owning module — Business Central for relationships, Financials for cash, Projects for delivery, and so on. Home orients; modules are where you act.",
      presentation: "callout",
    },
    {
      id: "try-orient",
      title: "Try it: pick your top three",
      body: "Decide which three KPIs matter most this week, then adjust your tile layout to match. Return to Home after module work to confirm the snapshot still answers your question.",
      presentation: "try",
      tryPrompt: "Customize Home so your three highest-priority KPIs are visible without scrolling.",
    },
    {
      id: "complete",
      title: "You are ready",
      body: "Use Home as a daily checkpoint. When a tile needs investigation, follow it into the relevant module rather than treating Home as the system of record.",
      presentation: "callout",
    },
  ],
};
