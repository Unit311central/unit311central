import type { TutorialDefinition } from "@/lib/guided-tutorials/types";

/** TECHNOLOGY MANAGEMENT — module dashboard (primary binding: technology-dashboard). */
export const TECHNOLOGY_MANAGEMENT_DASHBOARD_TUTORIAL: TutorialDefinition = {
  tutorialId: "technology-management.dashboard",
  viewId: "technology-dashboard",
  workspaces: "*",
  moduleLabel: "Technology Management",
  functionLabel: "Dashboard",
  title: "Technology Management Dashboard",
  description:
    "Learn how the Technology Management dashboard tracks software assets, architecture, telecommunications, and technology spend.",
  estimatedMinutes: 3,
  declaredTargetIds: [],
  steps: [
    {
      id: "welcome",
      title: "Technology oversight view",
      body: "The Technology Management dashboard summarizes licensed software, architecture diagrams, telecom services, and renewal risk. Figures aggregate from Technology Management records.",
      presentation: "callout",
    },
    {
      id: "kpis",
      title: "Technology KPIs",
      body: "Headline tiles may show active subscriptions, upcoming renewals, architecture coverage, and open incidents. Review these before technology planning meetings.",
      presentation: "highlight",
      actions: ["Note subscriptions renewing this quarter", "Check architecture diagram freshness"],
    },
    {
      id: "assets",
      title: "Assets and architecture",
      body: "Shortcuts open Software & SaaS, Technology Assets, Architecture Diagrams, and Telecommunications. Maintain authoritative records in each function.",
      presentation: "callout",
    },
    {
      id: "risk",
      title: "Renewal and compliance risk",
      body: "Alert panels highlight expired licenses, missing owners, or undocumented systems. Resolve each item in the detailed Technology Management screen.",
      presentation: "callout",
    },
    {
      id: "try-review",
      title: "Try it: one technology follow-up",
      body: "Pick one renewal or architecture item flagged on the dashboard and open the module to update it.",
      presentation: "try",
      tryPrompt: "Open one Technology Management function to resolve a renewal or documentation item highlighted here.",
    },
    {
      id: "complete",
      title: "You are ready",
      body: "Return monthly for a technology health check. Pair with Finances when reconciling software billing.",
      presentation: "callout",
    },
  ],
};
