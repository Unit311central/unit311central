import type { ChatMessage } from "@/lib/internal-messaging-data";
import { isClientSupportChannelRoom } from "@/lib/support-channel-shared";
import { listSupportTickets, updateSupportTicket } from "@/lib/support-tickets-service";
import { sendMessage } from "@/lib/internal-messaging-service";
import type { MessagingWorkspaceScope } from "@/lib/messaging-workspace";
import type { SupportWorkspaceScope } from "@/lib/support-workspace";
import { formatAssigneeForClient, notifyClientTicketAssigned } from "@/lib/support-client-notify";
import { createInitialUsers } from "@/lib/user-management-data";
import { listInternalOperators } from "@/lib/internal-operators-service";

const ASSIGN_USER_RE = /^user\s*(\d+)\.?$/i;
const TICKET_ID_RE = /\b(SUP-\d{3,}|CC-SUP-\d{3,})\b/i;
const ASSIGN_COMMAND_RE =
  /^(?:assign(?:ed)?(?:\s+to)?|@)\s+(.+?)(?:\s+(?:to\s+)?(SUP-\d{3,}|CC-SUP-\d{3,}))?$/i;

function extractTicketId(content: string) {
  return content.match(TICKET_ID_RE)?.[1]?.toUpperCase() ?? null;
}

async function resolveNamedAssignee(raw: string): Promise<string | null> {
  const value = raw.trim();
  if (!value) return null;

  const userMatch = value.match(ASSIGN_USER_RE);
  if (userMatch) return `User ${userMatch[1]}`;

  const operators = await listInternalOperators().catch(() => createInitialUsers());
  const needle = value.toLowerCase();
  const match = operators.find((operator) => {
    const candidates = [
      operator.fullName,
      operator.operatorLabel,
      operator.email,
      operator.username,
      operator.id,
    ]
      .filter(Boolean)
      .map((part) => String(part).toLowerCase());
    return candidates.some((candidate) => candidate === needle || candidate.startsWith(needle));
  });

  if (match) {
    return match.fullName || match.operatorLabel || match.email || match.username;
  }

  // Allow free-text assignee labels typed in chat.
  if (value.length >= 2 && value.length <= 80) return value;
  return null;
}

function parseAssigneeFromMessage(content: string) {
  const trimmed = content.trim();
  const command = trimmed.match(ASSIGN_COMMAND_RE);
  if (command?.[1]) return command[1].trim();

  const userMatch = trimmed.match(ASSIGN_USER_RE);
  if (userMatch) return `User ${userMatch[1]}`;
  return null;
}

async function resolveTicketId(content: string, scope?: SupportWorkspaceScope) {
  const explicitId = extractTicketId(content);
  if (explicitId) return explicitId;

  const tickets = await listSupportTickets(false, scope);
  const openUnassigned = tickets.find((ticket) => !ticket.archived && !ticket.userAssigned);
  return openUnassigned?.id ?? null;
}

export async function handleSupportChannelClaimMessage(
  message: ChatMessage,
  scope?: MessagingWorkspaceScope & SupportWorkspaceScope,
) {
  if (!isClientSupportChannelRoom(message.room)) return { handled: false as const };
  if (message.messageType === "system") return { handled: false as const };
  if (message.operatorId.startsWith("whatsapp:") || message.operatorId.startsWith("client:")) {
    return { handled: false as const };
  }

  const rawAssignee = parseAssigneeFromMessage(message.content);
  if (!rawAssignee) return { handled: false as const };

  const assignee = await resolveNamedAssignee(rawAssignee);
  if (!assignee) return { handled: false as const };

  const ticketId = await resolveTicketId(message.content, scope);
  if (!ticketId) {
    return { handled: false as const, reason: "no_ticket" as const };
  }

  const ticket = await updateSupportTicket(ticketId, { userAssigned: assignee }, scope);
  const assigneeLabel = formatAssigneeForClient(assignee);

  await sendMessage(
    {
      operatorId: "system",
      operatorName: "Unit311 Support",
      username: "system",
      content: `${assigneeLabel} assigned to ${ticket.id}.`,
      room: message.room,
      messageType: "system",
    },
    scope,
  );

  const whatsappReply = await notifyClientTicketAssigned(ticket, assignee);

  return { handled: true as const, ticket, assignee, whatsappReply };
}
