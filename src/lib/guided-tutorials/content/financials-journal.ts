import type { TutorialDefinition } from "@/lib/guided-tutorials/types";

/** FINANCES — General ledger journal entries (primary binding: general-ledger + tab journal). */
export const FINANCIALS_JOURNAL_TUTORIAL: TutorialDefinition = {
  tutorialId: "financials.journal",
  viewId: "general-ledger",
  tabKey: "journal",
  workspaces: "*",
  moduleLabel: "Finances",
  functionLabel: "Journal Entries",
  title: "Journal Entries",
  description:
    "Learn how to read and work with general-ledger journal entries — the authoritative accounting record behind Financials reporting.",
  estimatedMinutes: 4,
  declaredTargetIds: [],
  steps: [
    {
      id: "welcome",
      title: "Accounting system of record",
      body: "Journal entries post debits and credits to your chart of accounts. Dashboard KPIs, trial balance, and financial statements ultimately trace back to lines recorded here.",
      presentation: "callout",
    },
    {
      id: "register",
      title: "Journal register",
      body: "The register lists entries by date, reference, and status. Each row summarizes the journal header; open a row to inspect individual account lines.",
      presentation: "highlight",
      actions: ["Sort or filter by period when reviewing month-end", "Open an entry to see line detail"],
    },
    {
      id: "lines",
      title: "Debit and credit lines",
      body: "Every journal must balance — total debits equal total credits. Lines reference GL accounts from the chart of accounts; descriptions should be audit-friendly.",
      presentation: "callout",
    },
    {
      id: "periods",
      title: "Period control",
      body: "Entries respect open accounting periods. Closed periods prevent casual changes; corrections typically require adjustment journals or controlled reopen procedures.",
      presentation: "callout",
    },
    {
      id: "downstream",
      title: "Feeds the dashboard",
      body: "Revenue, expense, and cash tiles on the Financials dashboard read aggregated GL balances. If a KPI looks wrong, trace it to the underlying journal activity.",
      presentation: "callout",
    },
    {
      id: "try-trace",
      title: "Try it: trace one balance",
      body: "Pick an account you care about and locate a recent journal line that moved it. Confirm the description explains the business event.",
      presentation: "try",
      tryPrompt: "Find one journal entry that explains a change in a GL account you use often.",
    },
    {
      id: "complete",
      title: "You are ready",
      body: "Use Journal Entries for accounting truth; use AR/AP for operational invoice workflows that ultimately post here.",
      presentation: "callout",
    },
  ],
};
