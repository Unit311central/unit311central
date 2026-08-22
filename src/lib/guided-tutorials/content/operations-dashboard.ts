import type { TutorialDefinition } from "@/lib/guided-tutorials/types";

/** OPERATIONS — module dashboard (primary binding: operations-dashboard). */
export const OPERATIONS_DASHBOARD_TUTORIAL: TutorialDefinition = {
  tutorialId: "operations.dashboard",
  viewId: "operations-dashboard",
  workspaces: "*",
  moduleLabel: "Operations",
  functionLabel: "Dashboard",
  title: "Operations Dashboard",
  description:
    "Learn how the Operations dashboard tracks assets, inventory, logistics, and procurement signals across the operating model.",
  estimatedMinutes: 3,
  declaredTargetIds: [],
  steps: [
    {
      id: "welcome",
      title: "Operations command view",
      body: "The Operations dashboard aggregates asset utilization, inventory levels, logistics status, and procurement workload. Metrics are computed from Operations module records at load time.",
      presentation: "callout",
    },
    {
      id: "kpis",
      title: "Operating KPIs",
      body: "Headline tiles may include active assets, stock alerts, open purchase orders, and delivery exceptions. Scan these before daily operations stand-ups.",
      presentation: "highlight",
      actions: ["Compare inventory alerts to open procurement items", "Note any logistics delays"],
    },
    {
      id: "modules",
      title: "Module shortcuts",
      body: "Links open Assets, Inventory, Logistics, and Procurement functions. Use the dashboard to prioritize; execute changes in the owning screen.",
      presentation: "callout",
    },
    {
      id: "exceptions",
      title: "Exception handling",
      body: "Exception lists highlight items breaching thresholds — low stock, overdue shipments, or maintenance due. Resolve each in the detailed Operations view.",
      presentation: "callout",
    },
    {
      id: "try-review",
      title: "Try it: one exception",
      body: "Pick one operational exception shown on the dashboard and open the module where you can resolve it.",
      presentation: "try",
      tryPrompt: "From the Operations dashboard, open the function needed to address one highlighted exception.",
    },
    {
      id: "complete",
      title: "You are ready",
      body: "Return here for a daily operating pulse. Pair with Project Management when delivery work spans operations and projects.",
      presentation: "callout",
    },
  ],
};
