import { createSupportTicket } from "@/lib/support-tickets-service";
import type { SupportTicketPriority } from "@/lib/support-data";
import type { AssistantActionDefinition } from "../../types";
import type { AssistantBusinessContext } from "../../../types";

function asTrimmedString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asPriority(value: unknown): SupportTicketPriority {
  const raw = asTrimmedString(value).toLowerCase();
  if (raw === "high" || raw === "urgent") return "high";
  if (raw === "low") return "low";
  return "medium";
}

function supportScope(business: AssistantBusinessContext) {
  return { workspaceId: business.workspace.id?.trim() || null };
}

export const createSupportTicketAction: AssistantActionDefinition = {
  id: "support.createTicket",
  name: "Create support ticket",
  description:
    "Open a new support desk ticket. Use when the user asks to log, raise, or create a support ticket.",
  module: "system",
  requiredPermissions: ["authenticated"],
  confirmationRequired: true,
  auditRequired: true,
  undoCapable: false,
  inputSchema: {
    type: "object",
    properties: {
      name: { type: "string" },
      description: { type: "string" },
      organisation: { type: "string" },
      priority: { type: "string" },
      clientId: { type: "string" },
    },
    required: ["name", "description"],
  },
  capability: {
    id: "support.createTicket",
    businessObject: "SupportTicket",
    intentExamples: [
      "Create a support ticket for VPN access issue",
      "Log a high priority ticket — billing portal down",
      "Raise a support ticket for Acme Corp login failure",
    ],
    semanticAliases: ["support", "ticket", "helpdesk", "raise", "log", "create"],
    entityExtraction: {
      primaryNameFields: ["name", "organisation"],
      fields: [{ field: "organisation", from: "named_entity" }],
    },
    confirmationPolicy: "always",
    successFormatter: {
      template: "Support ticket created — {recordLabel}.",
      fields: [{ token: "recordLabel", path: "result.recordLabel" }],
    },
  },
  handler: {
    async validate(input, ctx) {
      if (!ctx.business.user.id) {
        return { ok: false, errors: ["Authentication required."], warnings: [] };
      }
      const name = asTrimmedString(input.name) || asTrimmedString(input.title);
      const description =
        asTrimmedString(input.description) || asTrimmedString(input.details);
      const errors: string[] = [];
      if (!name) errors.push("Provide a short ticket title.");
      if (!description) errors.push("Provide a ticket description.");
      return { ok: errors.length === 0, errors, warnings: [] };
    },

    async preview(input, ctx) {
      const name = asTrimmedString(input.name) || asTrimmedString(input.title) || "Support ticket";
      const priority = asPriority(input.priority);
      return {
        summary: `Create ${priority} priority ticket — ${name}`,
        affectedRecords: [{ type: "support_ticket", id: "new", label: name, change: "Create" }],
        warnings: [],
        reversible: false,
      };
    },

    async execute(input, ctx) {
      const name = asTrimmedString(input.name) || asTrimmedString(input.title);
      const description =
        asTrimmedString(input.description) || asTrimmedString(input.details);
      if (!name || !description) {
        return { ok: false, message: "Title and description are required." };
      }

      try {
        const ticket = await createSupportTicket(
          {
            name,
            description,
            organisation: asTrimmedString(input.organisation) || ctx.business.organisation.name || "",
            priority: asPriority(input.priority),
            clientId: asTrimmedString(input.clientId) || null,
            source: "executive-assistant",
          },
          supportScope(ctx.business),
        );

        return {
          ok: true,
          message: `Support ticket created — ${ticket.id} · ${ticket.name}.`,
          recordId: ticket.id,
          recordLabel: `${ticket.id} · ${ticket.name}`,
          afterState: { ticketId: ticket.id, name: ticket.name, priority: ticket.priority },
          output: { ticketId: ticket.id, name: ticket.name },
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return { ok: false, message: `Could not create ticket: ${message}` };
      }
    },
  },
};
