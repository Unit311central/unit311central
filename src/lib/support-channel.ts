import { internalAppPath } from "@/lib/app-domains";
import {
  SUPPORT_CHANNEL_ROOM,
  SUPPORT_PRIORITY_LABELS,
  type SupportTicket,
} from "@/lib/support-data";
import {
  getChannelByName,
  getChannelByRoom,
  sendMessage,
  updateChannelMembers,
} from "@/lib/internal-messaging-service";
import {
  mapMessageChannel,
  slugifyChannelName,
  type MessageChannel,
} from "@/lib/internal-messaging-data";
import { listInternalOperators } from "@/lib/internal-operators-service";
import type { MessagingWorkspaceScope } from "@/lib/messaging-workspace";
import { resolveMessagingWorkspaceId } from "@/lib/messaging-workspace";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { createInitialUsers } from "@/lib/user-management-data";

export { SUPPORT_CHANNEL_ROOM };

export const DEFAULT_SUPPORT_OPERATOR_IDS = ["user-admin", "user-info", "user-paul"] as const;

const DEFAULT_SUPPORT_EMAILS = [
  "admin@unit311central.com",
  "info@unit311central.com",
  "paul@unit311central.com",
] as const;

export function clientSupportChannelName(companyName: string) {
  const name = companyName.trim() || "Client";
  return `Support - ${name}`;
}

export function clientSupportChannelRoom(input: {
  clientId?: string | null;
  companyName: string;
}) {
  if (input.clientId?.trim()) {
    const safe = input.clientId.trim().replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 48);
    if (safe) return `support-client-${safe}`;
  }
  const slug = slugifyChannelName(input.companyName.trim() || "client") || "client";
  return `support-org-${slug}`;
}

export function isClientSupportChannelRoom(room: string) {
  return (
    room === SUPPORT_CHANNEL_ROOM ||
    room.startsWith("support-client-") ||
    room.startsWith("support-org-")
  );
}

export async function resolveDefaultSupportOperatorIds(): Promise<string[]> {
  const operators = await listInternalOperators().catch(() => createInitialUsers());
  const wanted = new Set(DEFAULT_SUPPORT_EMAILS.map((email) => email.toLowerCase()));
  const matched = operators
    .filter((operator) => {
      const email = (operator.email || operator.username || "").trim().toLowerCase();
      return wanted.has(email) || DEFAULT_SUPPORT_OPERATOR_IDS.includes(operator.id as (typeof DEFAULT_SUPPORT_OPERATOR_IDS)[number]);
    })
    .map((operator) => operator.id);

  const unique = Array.from(new Set(matched));
  return unique.length > 0 ? unique : [...DEFAULT_SUPPORT_OPERATOR_IDS];
}

/** Ensure a staff channel "Support - {Company}" exists with admin@, info@, paul@. */
export async function ensureClientSupportChannel(input: {
  companyName: string;
  clientId?: string | null;
  scope?: MessagingWorkspaceScope;
}): Promise<MessageChannel> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }

  const companyName = input.companyName.trim() || "Client";
  const channelName = clientSupportChannelName(companyName);
  const room = clientSupportChannelRoom({
    clientId: input.clientId,
    companyName,
  });
  const workspaceId = await resolveMessagingWorkspaceId(input.scope);
  const workspaceScope = { workspaceId };
  const memberIds = await resolveDefaultSupportOperatorIds();

  const existing =
    (await getChannelByRoom(room, workspaceScope).catch(() => null)) ??
    (await getChannelByName(channelName, workspaceScope).catch(() => null));

  if (existing) {
    const merged = Array.from(new Set([...existing.memberOperatorIds, ...memberIds]));
    if (merged.length !== existing.memberOperatorIds.length) {
      return updateChannelMembers(existing.id, merged, workspaceScope).catch(() => existing);
    }
    return existing;
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("internal_message_channels")
    .insert({
      workspace_id: workspaceId,
      room,
      name: channelName,
      channel_type: "internal",
      client_key: input.clientId?.trim() || null,
      created_by_operator_id: "system",
      created_by_operator_name: "System",
      member_operator_ids: memberIds,
      member_client_usernames: [],
    })
    .select("*")
    .single();

  if (error) {
    const retry =
      (await getChannelByRoom(room, workspaceScope).catch(() => null)) ??
      (await getChannelByName(channelName, workspaceScope).catch(() => null));
    if (retry) return retry;
    throw new Error(error.message);
  }

  const channel = mapMessageChannel(data);
  await sendMessage(
    {
      room: channel.room,
      operatorId: "system",
      operatorName: "System",
      username: "system",
      messageType: "system",
      content: `${channelName} created for Demo support. Admin, Info, and Paul are members.`,
    },
    workspaceScope,
  );

  return channel;
}

export function formatSupportChannelTicketMessage(
  ticket: SupportTicket,
  options?: { resumeUrl?: string | null },
) {
  const priorityLabel =
    ticket.clientPriorityLabel?.trim() || SUPPORT_PRIORITY_LABELS[ticket.priority];
  const supportHref = `${internalAppPath("support")}&ticketId=${encodeURIComponent(ticket.id)}`;
  const caseUrl = options?.resumeUrl?.trim() || ticket.ticketPublicUrl?.trim() || "";
  const lines = [
    `New support ticket ${ticket.id}`,
    `${ticket.organisation || "Client"} · ${ticket.name}`,
    `Priority: ${priorityLabel}`,
    ticket.requesterEmail ? `Email: ${ticket.requesterEmail}` : null,
    caseUrl ? `Unique URL: ${caseUrl}` : null,
    "",
    ticket.description,
    "",
    `Open support request: ${supportHref}`,
  ];

  if (caseUrl) {
    lines.push(`Client case link: ${caseUrl}`);
  }

  lines.push(`Assign support ticket: ${ticket.id}`);
  return lines.filter((line) => line !== null).join("\n");
}

export async function postTicketToSupportChannel(
  ticket: SupportTicket,
  scope?: MessagingWorkspaceScope,
  options?: { resumeUrl?: string | null },
) {
  const companyName = ticket.organisation?.trim() || "Client";
  const channel = await ensureClientSupportChannel({
    companyName,
    clientId: ticket.clientId,
    scope,
  });

  return sendMessage(
    {
      operatorId: "system",
      operatorName: "Support Desk",
      username: "system",
      content: formatSupportChannelTicketMessage(ticket, options),
      room: channel.room,
      messageType: "system",
    },
    scope,
  );
}

/** @deprecated Prefer the assign dropdown embedded in the ticket message. */
export async function postAssignmentPromptToSupportChannel(
  ticketId: string,
  scope?: MessagingWorkspaceScope,
  options?: { companyName?: string | null; clientId?: string | null },
) {
  const companyName = options?.companyName?.trim() || "Client";
  const channel = await ensureClientSupportChannel({
    companyName,
    clientId: options?.clientId,
    scope,
  });

  return sendMessage(
    {
      operatorId: "system",
      operatorName: "Unit311 Support",
      username: "system",
      content: [
        `What user do you want to assign? (${ticketId})`,
        `Assign support ticket: ${ticketId}`,
      ].join("\n"),
      room: channel.room,
      messageType: "system",
    },
    scope,
  );
}
