import type { TutorialDefinition } from "@/lib/guided-tutorials/types";

/** HUMAN RESOURCES — module dashboard (primary binding: hr-dashboard). */
export const HUMAN_RESOURCES_DASHBOARD_TUTORIAL: TutorialDefinition = {
  tutorialId: "human-resources.dashboard",
  viewId: "hr-dashboard",
  workspaces: "*",
  moduleLabel: "Human Resources",
  functionLabel: "Dashboard",
  title: "Human Resources Dashboard",
  description:
    "Learn how the Human Resources dashboard summarizes headcount, recruitment, payroll readiness, and workforce activity.",
  estimatedMinutes: 3,
  declaredTargetIds: [],
  steps: [
    {
      id: "welcome",
      title: "Workforce command view",
      body: "The HR dashboard aggregates employee records, open roles, time and attendance signals, and payroll cycle status. It reads from Human Resources modules — not a standalone HRIS.",
      presentation: "callout",
    },
    {
      id: "kpis",
      title: "Workforce KPIs",
      body: "Top tiles may include active employees, open requisitions, pending approvals, and upcoming payroll dates. Use Refresh when you expect new HR transactions.",
      presentation: "highlight",
      actions: ["Scan for open recruitment roles", "Note payroll or approval deadlines"],
    },
    {
      id: "modules",
      title: "HR module shortcuts",
      body: "Links open Employees, Recruitment, Payroll, Time & Attendance, and Org Chart functions. Update records in the owning screen.",
      presentation: "callout",
    },
    {
      id: "compliance",
      title: "People operations hygiene",
      body: "Exception lists may flag missing documents, overdue reviews, or incomplete onboarding. Resolve each in Employees or Recruitment.",
      presentation: "callout",
    },
    {
      id: "try-review",
      title: "Try it: one HR action",
      body: "Identify one workforce item needing follow-up and open the HR function to address it.",
      presentation: "try",
      tryPrompt: "From the HR dashboard, open the module needed to act on one highlighted people item.",
    },
    {
      id: "complete",
      title: "You are ready",
      body: "Review this dashboard weekly with people leaders. Pair with Finances for payroll and compensation reporting.",
      presentation: "callout",
    },
  ],
};
