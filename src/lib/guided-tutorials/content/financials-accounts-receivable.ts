import type { TutorialDefinition } from "@/lib/guided-tutorials/types";

/** FINANCES — Accounts receivable (primary binding: accounts-receivable). */
export const FINANCIALS_ACCOUNTS_RECEIVABLE_TUTORIAL: TutorialDefinition = {
  tutorialId: "financials.accounts-receivable",
  viewId: "accounts-receivable",
  workspaces: "*",
  moduleLabel: "Finances",
  functionLabel: "Accounts Receivable",
  title: "Accounts Receivable",
  description:
    "Learn how to monitor customer invoices, outstanding receivables, and collection status before cash hits the bank.",
  estimatedMinutes: 3,
  declaredTargetIds: [],
  steps: [
    {
      id: "welcome",
      title: "Money customers owe you",
      body: "Accounts Receivable tracks customer invoices and outstanding balances. It bridges commercial delivery (clients, projects) and cash recognition in the general ledger.",
      presentation: "callout",
    },
    {
      id: "invoices",
      title: "Invoice register",
      body: "The invoice list shows amounts, due dates, and status. Open invoices contribute to the Accounts Receivable KPI on the Financials dashboard and to ageing analysis.",
      presentation: "highlight",
      actions: ["Identify overdue invoices", "Note largest open balances"],
    },
    {
      id: "outstanding",
      title: "Outstanding view",
      body: "When an Outstanding tab or filter is available, use it to focus on unpaid lines. Pair with client owners in Business Central for collection follow-up.",
      presentation: "callout",
    },
    {
      id: "cash-link",
      title: "Link to cash",
      body: "Settlements post through banking and GL workflows. AR shows what should arrive; Banking shows what has arrived.",
      presentation: "callout",
    },
    {
      id: "try-followup",
      title: "Try it: one collection action",
      body: "Select the highest-priority overdue invoice and note the client owner or next step you would take outside the platform.",
      presentation: "try",
      tryPrompt: "Identify one overdue receivable and plan the collection follow-up.",
    },
    {
      id: "complete",
      title: "You are ready",
      body: "Review AR weekly alongside the Financials dashboard cash and receivable tiles.",
      presentation: "callout",
    },
  ],
};
