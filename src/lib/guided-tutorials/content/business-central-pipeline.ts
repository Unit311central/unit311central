import type { TutorialDefinition } from "@/lib/guided-tutorials/types";

/** BUSINESS CENTRAL — Pipeline / CRM (primary binding: crm). */
export const BUSINESS_CENTRAL_PIPELINE_TUTORIAL: TutorialDefinition = {
  tutorialId: "business-central.pipeline",
  viewId: "crm",
  workspaces: "*",
  moduleLabel: "Business Central",
  functionLabel: "Pipeline",
  title: "Pipeline",
  description:
    "Learn how to manage CRM leads, track opportunity status, and keep pipeline records aligned with commercial outcomes.",
  estimatedMinutes: 4,
  declaredTargetIds: [],
  steps: [
    {
      id: "welcome",
      title: "System of record for opportunities",
      body: "Pipeline stores CRM leads — companies and contacts you are pursuing. Status, value, next actions, and discovery notes live here and feed Sales Management reporting.",
      presentation: "callout",
    },
    {
      id: "master-detail",
      title: "Lead list and detail",
      body: "Select a lead in the list to open its detail panel. Core fields include status, estimated value, source, next action, and owner. Changes save to the shared CRM dataset used across the platform.",
      presentation: "highlight",
      actions: ["Select a lead and review status and next action date"],
    },
    {
      id: "status",
      title: "Status progression",
      body: "Statuses move from early interest (Cold/Warm/Hot) through Won or Lost. Won outcomes can link to client records and downstream commission or invoicing flows where those modules are enabled.",
      presentation: "callout",
    },
    {
      id: "discovery",
      title: "Discovery and timeline",
      body: "Use discovery questionnaires and the timeline to capture qualification notes and touchpoints. This history supports handoffs between sales, delivery, and support teams.",
      presentation: "callout",
    },
    {
      id: "quotes",
      title: "Quotes and outcomes",
      body: "When quotes or proposals are in play, link them from the lead detail. Accepted commercial outcomes should be reflected with an accurate status so dashboards and commissions stay truthful.",
      presentation: "callout",
    },
    {
      id: "try-update",
      title: "Try it: advance one lead",
      body: "Choose an open lead, update its next action or status, and confirm the pipeline list reflects your change.",
      presentation: "try",
      tryPrompt: "Update one open lead's next action or status.",
    },
    {
      id: "complete",
      title: "You are ready",
      body: "Keep Pipeline current — Sales Management dashboards and commissions read from these records.",
      presentation: "callout",
    },
  ],
};
