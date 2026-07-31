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
  note?: string;
};

function parseDecision(raw: string): ModelDecision {
  try {
    const parsed = JSON.parse(raw) as ModelDecision;
    if (!parsed.reply?.trim()) {
      return { reply: "How can I help with your support request?", action: "none" };
    }
    return parsed;
  } catch {
    return { reply: raw.trim() || "How can I help with your support request?", action: "none" };
  }
}

export async function runSupportLoungeChat(input: {
  lounge: SupportLoungeClient;
  requesterAnonId: string;
  history: LoungeChatMessage[];
  userMessage: string;
  activeTicketPublicToken?: string | null;
}): Promise<LoungeChatResult> {
  const system = `You are the Support Lounge assistant for "${input.lounge.companyName}".
Help their employees raise and track support tickets with their service provider.
Be concise, professional, and warm. Never require email or login.
Respond ONLY with JSON:
{
  "reply": "message shown to the visitor",
  "action": "none" | "create_ticket" | "list_tickets" | "request_human",
  "summary": "short title when creating",
  "description": "full details when creating",
  "priority": "low"|"medium"|"high"|"urgent",
  "requester_name": "optional",
  "note": "optional escalation note"
}
Rules:
- Use create_ticket only when you have a clear issue (what broke / what they need).
- Prefer asking one clarifying question before create_ticket if details are thin.
- Use list_tickets when they ask about past/open tickets.
- Use request_human when they ask for a person.`;

  const client = createOpenAIClient();
  let decision: ModelDecision;
  try {
    const completion = await client.chat.completions.create({
      model: getAssistantModel(),
      response_format: { type: "json_object" },
      temperature: 0.4,
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
    if (summary || description) {
      const created = await createLoungeTicket({
        lounge: input.lounge,
        requesterAnonId: input.requesterAnonId,
        summary: summary || description.slice(0, 80),
        description: summary ? `${summary}\n\n${description}` : description,
        priority: ["low", "medium", "high", "urgent"].includes(String(decision.priority))
          ? decision.priority
          : "medium",
        requesterName: decision.requester_name?.trim() || undefined,
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
        reply = `${reply}\n\nTicket ${created.ticket.id} is open. Our team has been notified.`.trim();
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
        .map((t) => `• ${t.id} — ${t.status || (t.closed ? "closed" : "open")} — ${t.description.slice(0, 90)}`)
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
      reply = `${reply}\n\nI can connect you to a person as soon as we open a ticket — tell me what's going wrong.`.trim();
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
