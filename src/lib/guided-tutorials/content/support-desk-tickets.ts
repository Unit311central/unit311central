import type { TutorialDefinition } from "@/lib/guided-tutorials/types";

/** SUPPORT DESK — ticket queue (primary binding: support). */
export const SUPPORT_DESK_TICKETS_TUTORIAL: TutorialDefinition = {
  tutorialId: "support-desk.tickets",
  viewId: "support",
  workspaces: "*",
  moduleLabel: "Support Desk",
  functionLabel: "Tickets",
  title: "Support Tickets",
  description:
    "Learn how to monitor, triage, and resolve customer support tickets from the Support Desk ticket queue.",
  estimatedMinutes: 3,
  declaredTargetIds: [],
  steps: [
    {
      id: "welcome",
      title: "Support operations queue",
      body: "The Tickets screen is the primary work queue for customer and internal support requests. Each row represents a ticket with status, priority, assignee, and channel metadata.",
      presentation: "callout",
    },
    {
      id: "filters",
      title: "Filter and sort",
      body: "Use status, priority, and assignee filters to focus on open, escalated, or unassigned work. Saved views help agents run consistent daily triage.",
      presentation: "highlight",
      actions: ["Filter to open high-priority tickets", "Sort by oldest unresolved first"],
    },
    {
      id: "ticket-detail",
      title: "Ticket detail panel",
      body: "Opening a ticket shows conversation history, client context, linked projects, and resolution notes. Update status and assignee as you progress the case.",
      presentation: "callout",
    },
    {
      id: "sla",
      title: "SLA and escalation",
      body: "Overdue or breaching tickets are visually flagged. Escalate or reassign when resolution requires another team; keep the requester informed in the ticket thread.",
      presentation: "callout",
    },
    {
      id: "try-review",
      title: "Try it: triage one ticket",
      body: "Select one open ticket, review its context, and update status or assignee to reflect your next action.",
      presentation: "try",
      tryPrompt: "Open one ticket from the queue and set a clear next status or assignee.",
    },
    {
      id: "complete",
      title: "You are ready",
      body: "Run this queue daily for support operations. Pair with Ticket Overview for management reporting.",
      presentation: "callout",
    },
  ],
};
