import type { TutorialDefinition } from "@/lib/guided-tutorials/types";

/** SALES MANAGEMENT — Pipeline tab. */
export const SALES_MANAGEMENT_PIPELINE_TUTORIAL: TutorialDefinition = {
  tutorialId: "sales-management.pipeline",
  viewId: "sales-management",
  tabKey: "pipeline",
  workspaces: "*",
  moduleLabel: "Sales Management",
  functionLabel: "Pipeline",
  title: "Sales Pipeline",
  description:
    "Learn how the Sales Management Pipeline tab filters and analyzes open CRM opportunities by stage and ownership.",
  estimatedMinutes: 3,
  declaredTargetIds: [],
  steps: [
    {
      id: "welcome",
      title: "Pipeline analytics view",
      body: "This tab focuses on open opportunities — the same CRM records as Business Central Pipeline, presented for sales operators with stage charts and segment filters.",
      presentation: "callout",
    },
    {
      id: "open-pipeline",
      title: "Open pipeline only",
      body: "Closed Won, Lost, and inactive customer rows are excluded so you see work still in flight. Estimated values sum to open pipeline value on the dashboard.",
      presentation: "highlight",
    },
    {
      id: "stages",
      title: "Stage distribution",
      body: "Cold, Warm, and Hot buckets show where deals concentrate. A heavy Warm pile with few Hot records may signal qualification issues; a thin top of funnel may signal prospecting gaps.",
      presentation: "callout",
    },
    {
      id: "segments",
      title: "Segments and filters",
      body: "When segment filters are available, use them to compare teams, territories, or product lines. Filters apply to the underlying lead query, not a separate dataset.",
      presentation: "callout",
    },
    {
      id: "try-stage",
      title: "Try it: stage review",
      body: "Pick the stage with the most value and open one lead to confirm next actions are dated and owned.",
      presentation: "try",
      tryPrompt: "Review one stage bucket and update a lead that lacks a clear next action.",
    },
    {
      id: "complete",
      title: "You are ready",
      body: "Use this tab for pipeline hygiene meetings; edit records in CRM when details change.",
      presentation: "callout",
    },
  ],
};
