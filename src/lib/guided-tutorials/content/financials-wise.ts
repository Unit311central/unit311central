import type { TutorialDefinition } from "@/lib/guided-tutorials/types";

/** FINANCES — Banking / cash (primary binding: wise). */
export const FINANCIALS_WISE_TUTORIAL: TutorialDefinition = {
  tutorialId: "financials.wise",
  viewId: "wise",
  workspaces: "*",
  moduleLabel: "Finances",
  functionLabel: "Bank",
  title: "Banking & Cash",
  description:
    "Learn how the Banking function shows connected cash accounts, balances, and movements that feed Financials reporting.",
  estimatedMinutes: 3,
  declaredTargetIds: [],
  steps: [
    {
      id: "welcome",
      title: "Liquid cash visibility",
      body: "Banking aggregates connected cash accounts and recent movements. Cash Position on the Financials dashboard reads from these balances when integrations are active.",
      presentation: "callout",
    },
    {
      id: "accounts",
      title: "Account balances",
      body: "Each connected account shows currency, available balance, and last sync status. Multiple accounts roll up to total liquid cash for reporting.",
      presentation: "highlight",
      actions: ["Confirm which accounts feed Cash Position", "Check last refresh or sync time"],
    },
    {
      id: "movements",
      title: "Transactions and transfers",
      body: "Recent movements help reconcile bank activity with AR/AP and journal entries. Use descriptions and references to match business events.",
      presentation: "callout",
    },
    {
      id: "treasury",
      title: "Treasury context",
      body: "Banking shows actual cash; AR shows expected inflows; AP shows expected outflows. Together they support weekly treasury reviews.",
      presentation: "callout",
    },
    {
      id: "try-reconcile",
      title: "Try it: one movement",
      body: "Pick a recent transaction and identify which invoice or journal entry it likely settles.",
      presentation: "try",
      tryPrompt: "Match one bank movement to a business record in AR, AP, or the GL.",
    },
    {
      id: "complete",
      title: "You are ready",
      body: "Start cash reviews here, then drill to Journal Entries when you need accounting detail.",
      presentation: "callout",
    },
  ],
};
