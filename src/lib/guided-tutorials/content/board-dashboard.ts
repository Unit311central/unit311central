import type { TutorialDefinition } from "@/lib/guided-tutorials/types";

/** BOARD — board dashboard (primary binding: board-dashboard). */
export const BOARD_DASHBOARD_TUTORIAL: TutorialDefinition = {
  tutorialId: "board.board-dashboard",
  viewId: "board-dashboard",
  workspaces: "*",
  moduleLabel: "Board",
  functionLabel: "Board Dashboard",
  title: "Board Dashboard",
  description:
    "Learn how the Board dashboard surfaces governance meetings, risks, packs, and decisions for directors and executives.",
  estimatedMinutes: 3,
  declaredTargetIds: [],
  steps: [
    {
      id: "welcome",
      title: "Governance starting point",
      body: "The Board dashboard aggregates upcoming meetings, open risks, pack status, and recent decisions. It is a read-only synthesis layer — approve minutes and update risks in the owning Board functions.",
      presentation: "callout",
    },
    {
      id: "kpis",
      title: "Governance KPIs",
      body: "Headline tiles may include meetings this quarter, open risks, packs awaiting review, and overdue actions. Values reflect Board, Risks, and Meetings data at load time.",
      presentation: "highlight",
      actions: ["Scan for overdue board actions", "Note the next scheduled meeting"],
    },
    {
      id: "meetings",
      title: "Meetings and packs",
      body: "Upcoming meetings and pack readiness indicators help directors prepare. Open Meetings or Board Packs when you need the full agenda, documents, or attendance record.",
      presentation: "callout",
    },
    {
      id: "risks",
      title: "Risk visibility",
      body: "Risk summaries highlight material items escalated to the board. Use Risks for detail, owners, and mitigation status — the dashboard only signals what needs attention.",
      presentation: "callout",
    },
    {
      id: "try-review",
      title: "Try it: prepare for governance",
      body: "Pick one open risk or upcoming meeting and open the Board function where you can review or update the record.",
      presentation: "try",
      tryPrompt: "Open one Board function from this dashboard to prepare for the next governance cycle.",
    },
    {
      id: "complete",
      title: "You are ready",
      body: "Use this dashboard before each board cycle. Pair with Corporate Information for cap table and company details referenced in packs.",
      presentation: "callout",
    },
  ],
};
