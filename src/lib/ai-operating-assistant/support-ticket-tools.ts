/**
 * Support desk tools for EA — live workspace-scoped ticket search.
 */

import { listSupportTickets } from "@/lib/support-tickets-service";
import type { AssistantToolExecutionContext } from "./tool-result";
import { toolError, toolForbidden, toolOk } from "./tool-result";

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function searchSupportTickets(
  args: Record<string, unknown>,
  ctx: AssistantToolExecutionContext,
) {
  try {
    const status = asString(args.status).toLowerCase();
    const query = asString(args.query);
    const tickets = await listSupportTickets();

    const filtered = tickets.filter((ticket) => {
      if (status === "open" && (ticket.closed || ticket.archived)) return false;
      if (status === "closed" && !ticket.closed) return false;
      if (query) {
        const haystack = [
          ticket.name,
          ticket.organisation,
          ticket.description,
          ticket.status,
        ].join(" ");
        if (!haystack.toLowerCase().includes(query.toLowerCase())) return false;
      }
      return true;
    });

    return toolOk(
      "searchSupportTickets",
      filtered.slice(0, 50).map((ticket) => ({
        id: ticket.id,
        subject: ticket.name,
        clientName: ticket.organisation,
        status: ticket.status,
        priority: ticket.priority,
        closed: ticket.closed,
      })),
      {
        source: ["supabase:support_tickets"],
        summary: {
          matched: filtered.length,
          openCount: filtered.filter((t) => !t.closed && !t.archived).length,
          message:
            filtered.length === 0
              ? "There are no support tickets matching that request."
              : `I found ${filtered.length} support ticket${filtered.length === 1 ? "" : "s"}.`,
        },
      },
    );
  } catch (error) {
    if (String(error).toLowerCase().includes("permission")) {
      return toolForbidden("searchSupportTickets", "Support desk access is not available for your role.");
    }
    return toolError(
      "searchSupportTickets",
      error instanceof Error ? error.message : "Failed to search support tickets.",
      ["supabase:support_tickets"],
    );
  }
}
