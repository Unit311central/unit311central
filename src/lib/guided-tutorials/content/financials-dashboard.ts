import type { TutorialDefinition } from "@/lib/guided-tutorials/types";

/**
 * FINANCES → Dashboard — hand-authored tutorial content.
 * Describes live GL / AR / AP dashboard behaviour only.
 */
export const FINANCIALS_DASHBOARD_TUTORIAL: TutorialDefinition = {
  tutorialId: "financials.dashboard",
  viewId: "financials",
  workspaces: "*",
  moduleLabel: "Financials",
  functionLabel: "Dashboard",
  title: "Financials Dashboard",
  description:
    "Learn how to read cash, revenue, burn, receivables and payables — and where to drill down.",
  estimatedMinutes: 3,
  declaredTargetIds: [
    "fin-dashboard-hero",
    "fin-dashboard-tiles",
    "fin-tile-cash-position",
    "fin-tile-revenue-ytd",
    "fin-tile-burn-rate",
    "fin-tile-accounts-receivable",
    "fin-tile-accounts-payable",
    "fin-dashboard-charts",
    "fin-dashboard-revenue-chart",
    "fin-dashboard-customize",
  ],
  steps: [
    {
      id: "welcome",
      title: "Your financial pulse",
      body: "This dashboard is the live snapshot of your company’s finances — cash, revenue, receivables, payables and burn — sourced from the general ledger, AR and AP feeds.",
      targetId: "fin-dashboard-hero",
      presentation: "highlight",
    },
    {
      id: "key-metrics",
      title: "Key metrics row",
      body: "The top row shows the KPIs you care about most. Values refresh from your ledger and can include month-on-month movement where data is available.",
      targetId: "fin-dashboard-tiles",
      presentation: "highlight",
      actions: ["Scan the row for your headline numbers", "Use Refresh to pull the latest data"],
    },
    {
      id: "cash-position",
      title: "Cash Position",
      body: "Cash Position is liquid cash across your connected bank and cash accounts. The trend arrow shows month-on-month movement when historical cash series exist.",
      targetId: "fin-tile-cash-position",
      presentation: "callout",
    },
    {
      id: "revenue-ytd",
      title: "Revenue",
      body: "Revenue YTD is recognised income from the general ledger for the reporting period. Use this tile to see how top-line performance is tracking against prior months.",
      targetId: "fin-tile-revenue-ytd",
      presentation: "callout",
    },
    {
      id: "burn-rate",
      title: "Burn Rate",
      body: "Burn Rate is your operating spend pace — monthly, quarterly and annual views. Click this tile to open the burn drill-down when interactive burn data is available.",
      targetId: "fin-tile-burn-rate",
      presentation: "callout",
      actions: ["Click the Burn Rate tile to open the drill-down panel"],
    },
    {
      id: "ar-ap",
      title: "Accounts Receivable & Payable",
      body: "Accounts Receivable is money customers owe you; Accounts Payable is what you owe suppliers. Together they show working-capital pressure alongside cash.",
      targetId: "fin-tile-accounts-receivable",
      presentation: "highlight",
    },
    {
      id: "ap-tile",
      title: "Accounts Payable",
      body: "Payables summarise supplier invoices still to be settled. Pair this with cash position when planning near-term outflows.",
      targetId: "fin-tile-accounts-payable",
      presentation: "callout",
    },
    {
      id: "charts",
      title: "Liquidity & ageing charts",
      body: "Below the KPIs, charts break down liquidity mix and AR ageing buckets so you can see concentration and overdue exposure at a glance.",
      targetId: "fin-dashboard-charts",
      presentation: "highlight",
    },
    {
      id: "revenue-chart",
      title: "Revenue vs outgoings",
      body: "This trend chart compares monthly income against operating spend — useful for spotting margin pressure before it shows up in cash.",
      targetId: "fin-dashboard-revenue-chart",
      presentation: "highlight",
    },
    {
      id: "try-customize",
      title: "Try it: customize your tiles",
      body: "You can choose which KPI tiles appear in the top row. Try opening Customize tiles, add or remove a metric, then continue when you are done.",
      targetId: "fin-dashboard-customize",
      presentation: "try",
      tryPrompt: "Click Customize tiles and change which KPIs are visible.",
    },
    {
      id: "complete",
      title: "You are ready",
      body: "You now know how to read the Financials Dashboard. Use the left navigation to open Accounting, AR, AP or Banking when you need to act on what you see here.",
      presentation: "callout",
    },
  ],
};
