import type { TutorialDefinition } from "@/lib/guided-tutorials/types";

/** Shared static assets for hand-authored tutorials (Phase 2 pattern). */
export const TUTORIAL_MEDIA = {
  salesManagementCommissionsFlow: "/tutorials/sales-management-commissions-flow.svg",
  salesManagementCommissionsLayout: "/tutorials/sales-management-commissions-layout.svg",
} as const;

/**
 * Sales Management → Management → Commissions — reference tutorial.
 * Combines live UI highlights, diagram, annotated layout, try-it, and callout steps.
 */
export const SALES_MANAGEMENT_COMMISSIONS_TUTORIAL: TutorialDefinition = {
  tutorialId: "sales-management.commissions",
  viewId: "sales-management",
  tabKey: "commissions",
  workspaces: "*",
  moduleLabel: "Sales Management",
  functionLabel: "Commissions",
  title: "Sales Commissions",
  description:
    "Learn how commission rules relate to earned commission records on closed commercial outcomes.",
  estimatedMinutes: 3,
  declaredTargetIds: [
    "sm-commissions-header",
    "sm-commissions-rules",
    "sm-commissions-earned",
  ],
  steps: [
    {
      id: "welcome",
      title: "Commission tracking",
      body: "This function tracks two things together: the rules that define how commission is calculated, and the earned records created when commercial outcomes close.",
      targetId: "sm-commissions-header",
      presentation: "highlight",
    },
    {
      id: "flow-diagram",
      title: "How commissions flow",
      body: "Rules define rate and scope on the left. When a Won deal or accepted quote closes, earned commission entries appear in the register on the right.",
      presentation: "diagram",
      media: {
        assetUrl: TUTORIAL_MEDIA.salesManagementCommissionsFlow,
        alt: "Flow from commission rules through commercial outcomes to earned commission records",
        caption: "Configure rules once · earned entries accumulate as deals close",
      },
    },
    {
      id: "layout-visual",
      title: "Screen layout",
      body: "The live screen mirrors this layout: Commission rules on the left, Earned commissions on the right. Keep both panels in view when reviewing payouts.",
      presentation: "screenshot",
      media: {
        assetUrl: TUTORIAL_MEDIA.salesManagementCommissionsLayout,
        alt: "Annotated Commissions screen showing rules panel and earned commissions panel",
        caption: "Left panel = configuration · Right panel = recorded payouts",
      },
    },
    {
      id: "rules",
      title: "Commission rules",
      body: "Each rule shows its rate, what it applies to, and whether it is active. Active rules are used when commission entries are calculated or recorded.",
      targetId: "sm-commissions-rules",
      presentation: "walkthrough",
      actions: ["Review rule name, rate, and applies-to scope", "Note whether each rule is active"],
    },
    {
      id: "earned",
      title: "Earned commissions",
      body: "Earned rows tie a person to a deal outcome — commissionable value, applied rate, and payout status.",
      targetId: "sm-commissions-earned",
      presentation: "callout",
    },
    {
      id: "try-review",
      title: "Try it: compare both panels",
      body: "Use the live screen to connect the diagram with what you see — rules configure calculation; earned rows show results.",
      targetId: "sm-commissions-earned",
      presentation: "try",
      tryPrompt: "Compare Commission rules and Earned commissions on this screen.",
    },
    {
      id: "complete",
      title: "You are ready",
      body: "Return here after Won deals or accepted quotes to confirm rules produced the expected earned entries.",
      presentation: "callout",
    },
  ],
};
