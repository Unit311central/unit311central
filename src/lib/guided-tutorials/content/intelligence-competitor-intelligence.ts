import type { TutorialDefinition } from "@/lib/guided-tutorials/types";

/**
 * INTELLIGENCE — Competitor intelligence (primary binding: oa-competitor-intelligence).
 * Central product function; workspace-specific viewIds are runtime bindings only.
 */
export const INTELLIGENCE_COMPETITOR_TUTORIAL: TutorialDefinition = {
  tutorialId: "intelligence.competitor-intelligence",
  viewId: "oa-competitor-intelligence",
  workspaces: "*",
  moduleLabel: "Intelligence",
  functionLabel: "Competitor Intelligence",
  title: "Competitor Intelligence",
  description:
    "Learn how to monitor competitors, refresh intelligence briefings, and drill into company-level insight cards.",
  estimatedMinutes: 3,
  declaredTargetIds: [],
  steps: [
    {
      id: "welcome",
      title: "External market awareness",
      body: "Competitor Intelligence tracks named competitors relevant to your strategy. Briefings combine structured profiles with periodic refresh so leadership sees movement, not static bios.",
      presentation: "callout",
    },
    {
      id: "briefing",
      title: "Executive briefing",
      body: "The briefing summarizes priority competitors, recent signal changes, and suggested talking points. Refresh runs on a schedule; you can force a refresh when preparing for board or sales planning.",
      presentation: "highlight",
      actions: ["Scan the briefing headline and priority list", "Note last refresh time"],
    },
    {
      id: "profiles",
      title: "Competitor profiles",
      body: "Each profile card covers positioning, product overlap, pricing signals, and risk/opportunity notes. Select a competitor to open the detailed intelligence view.",
      presentation: "callout",
    },
    {
      id: "detail",
      title: "Company drill-down",
      body: "The detail view expands narrative analysis, comparison tables, and linked evidence. Use it when preparing competitive responses for deals or partnerships.",
      presentation: "callout",
    },
    {
      id: "try-refresh",
      title: "Try it: review one competitor",
      body: "Open one competitor profile and identify a single insight you would share with sales or product this week.",
      presentation: "try",
      tryPrompt: "Select a competitor and capture one actionable insight from the briefing or profile.",
    },
    {
      id: "complete",
      title: "You are ready",
      body: "Pair competitor intelligence with Pipeline when positioning against named rivals in active deals.",
      presentation: "callout",
    },
  ],
};
