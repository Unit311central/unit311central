import type { TutorialDefinition } from "@/lib/guided-tutorials/types";

/** FUNDRAISING — module dashboard (primary binding: fundraising-dashboard). */
export const FUNDRAISING_DASHBOARD_TUTORIAL: TutorialDefinition = {
  tutorialId: "fundraising.dashboard",
  viewId: "fundraising-dashboard",
  workspaces: "*",
  moduleLabel: "Fundraising",
  functionLabel: "Dashboard",
  title: "Fundraising Dashboard",
  description:
    "Learn how the Fundraising dashboard summarizes investor pipeline, commitments, and fund activity for capital-raising teams.",
  estimatedMinutes: 3,
  declaredTargetIds: [],
  steps: [
    {
      id: "welcome",
      title: "Capital-raising command view",
      body: "The Fundraising dashboard is the executive snapshot for active raises, investor relationships, and fund performance. Figures aggregate from Investors, Pipeline, and Fund records — not manual entries on this screen.",
      presentation: "callout",
    },
    {
      id: "kpis",
      title: "Headline metrics",
      body: "Top tiles typically show open pipeline value, committed capital, meetings scheduled, and conversion rates. Use them to orient before drilling into Investors or Fund Platform views.",
      presentation: "highlight",
      actions: ["Note which metric needs attention this week", "Refresh if you expect new CRM activity"],
    },
    {
      id: "pipeline-snapshot",
      title: "Pipeline snapshot",
      body: "Charts and tables summarize stage distribution across prospects and active opportunities. Pair this view with Pipeline when you need to update next actions or meeting outcomes.",
      presentation: "callout",
    },
    {
      id: "navigation",
      title: "Jump to action",
      body: "Shortcuts open Investors, Pipeline, Pitch Decks, Data Rooms, or Fund Platform functions. Treat the dashboard as orientation; record changes in the underlying module.",
      presentation: "callout",
      actions: ["Open Investors to review a relationship", "Open Pipeline to progress a raise"],
    },
    {
      id: "try-review",
      title: "Try it: one follow-up",
      body: "Identify one investor or stage bucket that looks stale and open the module where you can update it.",
      presentation: "try",
      tryPrompt: "From the Fundraising dashboard, open the function needed to act on one highlighted opportunity.",
    },
    {
      id: "complete",
      title: "You are ready",
      body: "Return here for a weekly capital-raising pulse. Pair with Corporate Information when board materials reference fundraising metrics.",
      presentation: "callout",
    },
  ],
};
