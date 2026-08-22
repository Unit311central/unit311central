import type { TutorialDefinition } from "@/lib/guided-tutorials/types";

/** CORPORATE INFORMATION — module dashboard (primary binding: corporate-dashboard). */
export const CORPORATE_INFORMATION_DASHBOARD_TUTORIAL: TutorialDefinition = {
  tutorialId: "corporate-information.dashboard",
  viewId: "corporate-dashboard",
  workspaces: "*",
  moduleLabel: "Corporate Information",
  functionLabel: "Dashboard",
  title: "Corporate Information Dashboard",
  description:
    "Learn how the Corporate Information dashboard orients executives to company records, governance artifacts, and compliance status.",
  estimatedMinutes: 3,
  declaredTargetIds: [],
  steps: [
    {
      id: "welcome",
      title: "Corporate records hub",
      body: "This dashboard summarizes legal entity data, cap table health, contracts, advisors, and risk posture. It pulls from Corporate Information functions — not a separate data store.",
      presentation: "callout",
    },
    {
      id: "kpis",
      title: "Executive snapshot",
      body: "KPI tiles may show entity status, outstanding filings, contract renewals, and open risk items. Use Refresh when you expect updates from underlying modules.",
      presentation: "highlight",
      actions: ["Identify one metric that changed since last review", "Note links to detailed records"],
    },
    {
      id: "records",
      title: "Key record areas",
      body: "Quick links open Company Details, Cap Table, Contracts, Bank Accounts, and the Risk Register. The dashboard orients; authoritative records live in each function.",
      presentation: "callout",
    },
    {
      id: "governance",
      title: "Governance alignment",
      body: "Board-related shortcuts connect governance work with corporate records. Keep cap table and company details current before board or investor reporting cycles.",
      presentation: "callout",
    },
    {
      id: "try-review",
      title: "Try it: one record check",
      body: "Select one corporate record area that needs verification and open it from the dashboard.",
      presentation: "try",
      tryPrompt: "Open one Corporate Information function to verify a record referenced on this dashboard.",
    },
    {
      id: "complete",
      title: "You are ready",
      body: "Review this dashboard monthly or before investor updates. Pair with Finances for treasury and reporting alignment.",
      presentation: "callout",
    },
  ],
};
