import {
  createOpenAIClient,
  formatOpenAIError,
  getAssistantModel,
} from "@/lib/ai-operating-assistant/openai-client";
import type { SupportTicketPriority } from "@/lib/support-data";
import {
  appendLoungeMessage,
  createLoungeTicket,
  escalateLoungeTicket,
  getLoungeTicketByPublicToken,
  listLoungeTicketsForRequester,
  type SupportLoungeClient,
} from "@/lib/support-lounge-service";

export type LoungeChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type LoungeChatResult = {
  reply: string;
  ticketId?: string;
  ticketPublicToken?: string;
  resumePath?: string;
  escalated?: boolean;
};

type ModelDecision = {
  reply: string;
  action?: "none" | "create_ticket" | "list_tickets" | "request_human" | null;
  summary?: string;
  description?: string;
  priority?: SupportTicketPriority;
  requester_name?: string;
  first_name?: string;
  last_name?: string;
  department?: string;
  role?: string;
  ticket_kind?: "new" | "existing";
  note?: string;
};

function parseDecision(raw: string): ModelDecision {
  try {
    const parsed = JSON.parse(raw) as ModelDecision;
    if (!parsed.reply?.trim()) {
      return { reply: "What is your first and last name?", action: "none" };
    }
    return parsed;
  } catch {
    return { reply: raw.trim() || "What is your first and last name?", action: "none" };
  }
}

export async function runSupportLoungeChat(input: {
  lounge: SupportLoungeClient;
  requesterAnonId: string;
  history: LoungeChatMessage[];
  userMessage: string;
  activeTicketPublicToken?: string | null;
}): Promise<LoungeChatResult> {
  const system = `You are the Demo Support Lounge assistant helping people from "${input.lounge.companyName}" raise tickets with Demo operations.
Be concise, professional, and warm. Never require email or login.
Collect intake ONE question at a time, in this exact order, before creating a ticket:
1) First and last name
2) Department
3) Role / job title
4) Is this a new ticket or an existing ticket?
5) Problem description (or update for an existing ticket)

Do not skip ahead. Do not ask multiple questions in one reply unless the visitor already volunteered several answers.
When all five are known, use create_ticket.

Respond ONLY with JSON:
{
  "reply": "message shown to the visitor",
  "action": "none" | "create_ticket" | "list_tickets" | "request_human",
  "summary": "short title when creating",
  "description": "full problem details when creating",
  "priority": "low"|"medium"|"high"|"urgent",
  "first_name": "",
  "last_name": "",
  "department": "",
  "role": "",
  "ticket_kind": "new"|"existing",
  "requester_name": "optional full name",
  "note": "optional escalation note"
}
Rules:
- create_ticket only after name, department, role, ticket_kind, and problem description are known.
- Prefer list_tickets / request_human when asked.
- Keep replies short.`;

  const client = createOpenAIClient();
  let decision: ModelDecision;
  try {
    const completion = await client.chat.completions.create({
      model: getAssistantModel(),
      response_format: { type: "json_object" },
      temperature: 0.3,
      messages: [
        { role: "system", content: system },
        ...input.history.slice(-16).map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
        { role: "user", content: input.userMessage },
      ],
    });
    decision = parseDecision(completion.choices[0]?.message?.content || "");
  } catch (error) {
    throw new Error(formatOpenAIError(error));
  }

  const action = decision.action || "none";
  let ticketId: string | undefined;
  let ticketPublicToken: string | undefined;
  let resumePath: string | undefined;
  let escalated = false;
  let reply = decision.reply.trim();

  if (action === "create_ticket") {
    const summary = (decision.summary || "").trim();
    const description = (decision.description || "").trim() || input.userMessage.trim();
    const firstName = (decision.first_name || "").trim();
    const lastName = (decision.last_name || "").trim();
    const department = (decision.department || "").trim();
    const role = (decision.role || "").trim();
    const ticketKind =
      decision.ticket_kind === "existing" || decision.ticket_kind === "new"
        ? decision.ticket_kind
        : "new";
    const missing = [
      !firstName && !decision.requester_name ? "name" : null,
      !department ? "department" : null,
      !role ? "role" : null,
      !description ? "problem description" : null,
    ].filter(Boolean);

    if (missing.length > 0) {
      reply = `Before I open the ticket I still need your ${missing.join(", ")}.`;
    } else {
      const profileLines = [
        firstName || lastName ? `Name: ${[firstName, lastName].filter(Boolean).join(" ")}` : null,
        department ? `Department: ${department}` : null,
        role ? `Role: ${role}` : null,
        `Ticket type: ${ticketKind}`,
      ].filter(Boolean);
      const created = await createLoungeTicket({
        lounge: input.lounge,
        requesterAnonId: input.requesterAnonId,
        summary: summary || description.slice(0, 80),
        description: `${profileLines.join("\n")}\n\n${summary ? `${summary}\n\n` : ""}${description}`,
        priority: ["low", "medium", "high", "urgent"].includes(String(decision.priority))
          ? decision.priority
          : "medium",
        requesterName: decision.requester_name?.trim() || undefined,
        requesterFirstName: firstName || null,
        requesterLastName: lastName || null,
        requesterDepartment: department || null,
        requesterRole: role || null,
        ticketKind,
      });
      ticketId = created.ticket.id;
      ticketPublicToken = created.ticket.ticketPublicToken || undefined;
      resumePath = created.resumePath;
      await appendLoungeMessage({
        workspaceId: input.lounge.workspaceId,
        ticketId: created.ticket.id,
        role: "user",
        content: input.userMessage,
      });
      if (!/SUP-\d+/i.test(reply)) {
        reply = `${reply}\n\nTicket ${created.ticket.id} is open. Our Demo team has been notified.`.trim();
      }
    }
  } else if (action === "list_tickets") {
    const tickets = await listLoungeTicketsForRequester({
      workspaceId: input.lounge.workspaceId,
      clientId: input.lounge.id,
      requesterAnonId: input.requesterAnonId,
    });
    if (tickets.length === 0) {
      reply = `${reply}\n\nI don't see any tickets from this browser yet.`.trim();
    } else {
      const lines = tickets
        .slice(0, 8)
        .map(
          (t) =>
            `• ${t.id} — ${t.status || (t.closed ? "closed" : "open")} — ${t.description.slice(0, 90)}`,
        )
        .join("\n");
      reply = `${reply}\n\n${lines}`.trim();
    }
  } else if (action === "request_human") {
    const token =
      input.activeTicketPublicToken?.trim() ||
      ticketPublicToken ||
      (
        await listLoungeTicketsForRequester({
          workspaceId: input.lounge.workspaceId,
          clientId: input.lounge.id,
          requesterAnonId: input.requesterAnonId,
        })
      ).find((t) => !t.closed)?.ticketPublicToken ||
      "";

    if (!token) {
      reply = `${reply}\n\nI can connect you to a person as soon as we open a ticket — let's finish the intake first.`.trim();
    } else {
      const ticket = await getLoungeTicketByPublicToken({
        workspaceId: input.lounge.workspaceId,
        clientId: input.lounge.id,
        ticketPublicToken: token,
      });
      if (ticket) {
        const updated = await escalateLoungeTicket({
          lounge: input.lounge,
          ticket,
          note: decision.note?.trim() || input.userMessage,
        });
        ticketId = updated.id;
        ticketPublicToken = updated.ticketPublicToken || token;
        escalated = true;
        reply = `${reply}\n\nI've flagged ${updated.id} for a human operator. They'll continue from here.`.trim();
      }
    }
  }

  if (ticketId) {
    try {
      await appendLoungeMessage({
        workspaceId: input.lounge.workspaceId,
        ticketId,
        role: "assistant",
        content: reply,
      });
    } catch {
      // non-fatal
    }
  }

  return {
    reply,
    ticketId,
    ticketPublicToken,
    resumePath,
    escalated,
  };
}
