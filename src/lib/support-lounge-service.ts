import { randomBytes, randomUUID } from "node:crypto";

import {
  mapSupportTicket,
  type SupportTicket,
  type SupportTicketPriority,
  type SupportTicketStatus,
} from "@/lib/support-data";
import {
  postAssignmentPromptToSupportChannel,
  postTicketToSupportChannel,
} from "@/lib/support-channel";
import { createSupportTicket, updateSupportTicket } from "@/lib/support-tickets-service";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { DEMO_SITE_URL } from "@/lib/app-domains";

export type SupportLoungeClient = {
  id: string;
  workspaceId: string;
  companyName: string;
  loungeToken: string;
  enabled: boolean;
};

export type SupportLoungeMessage = {
  id: string;
  ticketId: string;
  role: "user" | "assistant" | "operator" | "system";
  content: string;
  createdAt: string;
};

type DbLoungeClient = {
  id: string;
  workspace_id: string;
  company_name: string;
  support_lounge_token: string | null;
  support_lounge_enabled: boolean | null;
};

function requireLoungeSupabase() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }
  return createSupabaseServerClient();
}

export function createLoungeToken() {
  return randomBytes(18).toString("base64url");
}

export function createTicketPublicToken() {
  return randomBytes(24).toString("base64url");
}

export function createRequesterAnonId() {
  return randomUUID();
}

export function buildLoungeUrl(loungeToken: string, origin?: string) {
  const base = (origin || DEMO_SITE_URL).replace(/\/$/, "");
  return `${base}/s/${encodeURIComponent(loungeToken)}`;
}

export function buildTicketResumeUrl(
  loungeToken: string,
  ticketPublicToken: string,
  origin?: string,
) {
  return `${buildLoungeUrl(loungeToken, origin)}/t/${encodeURIComponent(ticketPublicToken)}`;
}

function mapLoungeClient(row: DbLoungeClient): SupportLoungeClient {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    companyName: row.company_name,
    loungeToken: row.support_lounge_token || "",
    enabled: row.support_lounge_enabled !== false,
  };
}

export async function getLoungeClientByToken(
  loungeToken: string,
): Promise<SupportLoungeClient | null> {
  const token = loungeToken.trim();
  if (!token) return null;
  const supabase = requireLoungeSupabase();
  const { data, error } = await supabase
    .from("internal_clients")
    .select("id,workspace_id,company_name,support_lounge_token,support_lounge_enabled")
    .eq("support_lounge_token", token)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  const client = mapLoungeClient(data as DbLoungeClient);
  if (!client.enabled || !client.loungeToken) return null;
  return client;
}

export async function ensureClientLoungeToken(input: {
  clientId: string;
  workspaceId: string;
}): Promise<SupportLoungeClient> {
  const supabase = requireLoungeSupabase();
  const { data: existing, error: readError } = await supabase
    .from("internal_clients")
    .select("id,workspace_id,company_name,support_lounge_token,support_lounge_enabled")
    .eq("id", input.clientId)
    .eq("workspace_id", input.workspaceId)
    .maybeSingle();

  if (readError) throw new Error(readError.message);
  if (!existing) throw new Error("Client not found.");

  const mapped = mapLoungeClient(existing as DbLoungeClient);
  if (mapped.loungeToken) return mapped;

  const token = createLoungeToken();
  const { data, error } = await supabase
    .from("internal_clients")
    .update({
      support_lounge_token: token,
      support_lounge_enabled: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.clientId)
    .eq("workspace_id", input.workspaceId)
    .select("id,workspace_id,company_name,support_lounge_token,support_lounge_enabled")
    .single();

  if (error) throw new Error(error.message);
  return mapLoungeClient(data as DbLoungeClient);
}

export async function listLoungeTicketsForRequester(input: {
  workspaceId: string;
  clientId: string;
  requesterAnonId: string;
}): Promise<SupportTicket[]> {
  const supabase = requireLoungeSupabase();
  const { data, error } = await supabase
    .from("support_tickets")
    .select("*")
    .eq("workspace_id", input.workspaceId)
    .eq("client_id", input.clientId)
    .eq("requester_anon_id", input.requesterAnonId)
    .eq("archived", false)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []).map((row) => mapSupportTicket(row as Parameters<typeof mapSupportTicket>[0]));
}

export async function getLoungeTicketByPublicToken(input: {
  workspaceId: string;
  clientId: string;
  ticketPublicToken: string;
}): Promise<SupportTicket | null> {
  const supabase = requireLoungeSupabase();
  const { data, error } = await supabase
    .from("support_tickets")
    .select("*")
    .eq("workspace_id", input.workspaceId)
    .eq("client_id", input.clientId)
    .eq("ticket_public_token", input.ticketPublicToken)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? mapSupportTicket(data as Parameters<typeof mapSupportTicket>[0]) : null;
}

export async function createLoungeTicket(input: {
  lounge: SupportLoungeClient;
  requesterAnonId: string;
  summary: string;
  description: string;
  priority?: SupportTicketPriority;
  requesterName?: string;
  requesterEmail?: string | null;
}): Promise<{ ticket: SupportTicket; resumePath: string }> {
  const publicToken = createTicketPublicToken();
  const name = (input.requesterName || "Support guest").trim() || "Support guest";
  const ticket = await createSupportTicket(
    {
      name,
      organisation: input.lounge.companyName,
      priority: input.priority || "medium",
      description: input.description.trim(),
      clientId: input.lounge.id,
      requesterAnonId: input.requesterAnonId,
      requesterEmail: input.requesterEmail?.trim() || null,
      ticketPublicToken: publicToken,
      status: "open",
      escalated: false,
      source: "lounge",
      closed: false,
      archived: false,
    },
    { workspaceId: input.lounge.workspaceId },
  );

  await appendLoungeMessage({
    workspaceId: input.lounge.workspaceId,
    ticketId: ticket.id,
    role: "system",
    content: `Ticket ${ticket.id} opened via Support Lounge for ${input.lounge.companyName}.`,
  });

  try {
    await postTicketToSupportChannel(ticket, { workspaceId: input.lounge.workspaceId });
    await postAssignmentPromptToSupportChannel(ticket.id, {
      workspaceId: input.lounge.workspaceId,
    });
  } catch (error) {
    console.warn("[support-lounge] desk notify failed:", error);
  }

  return {
    ticket,
    resumePath: `/s/${encodeURIComponent(input.lounge.loungeToken)}/t/${encodeURIComponent(publicToken)}`,
  };
}

export async function escalateLoungeTicket(input: {
  lounge: SupportLoungeClient;
  ticket: SupportTicket;
  note?: string;
}): Promise<SupportTicket> {
  const updated = await updateSupportTicket(
    input.ticket.id,
    {
      escalated: true,
      status: "in_progress",
      closed: false,
    },
    { workspaceId: input.lounge.workspaceId },
  );

  const note = input.note?.trim();
  await appendLoungeMessage({
    workspaceId: input.lounge.workspaceId,
    ticketId: input.ticket.id,
    role: "system",
    content: note
      ? `Escalated to a human operator. Note: ${note}`
      : "Escalated to a human operator. A Demo support agent will continue this thread.",
  });

  try {
    const { sendMessage } = await import("@/lib/internal-messaging-service");
    await sendMessage(
      {
        operatorId: "lounge:escalation",
        operatorName: "Support Lounge",
        username: "lounge",
        content: [
          `Human help requested on ${input.ticket.id}`,
          `${input.lounge.companyName} · ${input.ticket.name}`,
          note || input.ticket.description,
        ].join("\n"),
        room: "support-desk",
        messageType: "text",
      },
      { workspaceId: input.lounge.workspaceId },
    );
  } catch (error) {
    console.warn("[support-lounge] escalation notify failed:", error);
  }

  return updated;
}

export async function appendLoungeMessage(input: {
  workspaceId: string;
  ticketId: string;
  role: SupportLoungeMessage["role"];
  content: string;
}): Promise<SupportLoungeMessage> {
  const supabase = requireLoungeSupabase();
  const { data, error } = await supabase
    .from("support_lounge_messages")
    .insert({
      workspace_id: input.workspaceId,
      ticket_id: input.ticketId,
      role: input.role,
      content: input.content.trim(),
    })
    .select("id,ticket_id,role,content,created_at")
    .single();

  if (error) throw new Error(error.message);
  return {
    id: data.id as string,
    ticketId: data.ticket_id as string,
    role: data.role as SupportLoungeMessage["role"],
    content: data.content as string,
    createdAt: data.created_at as string,
  };
}

export async function listLoungeMessages(input: {
  workspaceId: string;
  ticketId: string;
}): Promise<SupportLoungeMessage[]> {
  const supabase = requireLoungeSupabase();
  const { data, error } = await supabase
    .from("support_lounge_messages")
    .select("id,ticket_id,role,content,created_at")
    .eq("workspace_id", input.workspaceId)
    .eq("ticket_id", input.ticketId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return (data || []).map((row) => ({
    id: row.id as string,
    ticketId: row.ticket_id as string,
    role: row.role as SupportLoungeMessage["role"],
    content: row.content as string,
    createdAt: row.created_at as string,
  }));
}

export async function setLoungeTicketStatus(input: {
  workspaceId: string;
  ticketId: string;
  status: SupportTicketStatus;
}): Promise<SupportTicket> {
  return updateSupportTicket(
    input.ticketId,
    {
      status: input.status,
      closed: input.status === "closed" || input.status === "resolved",
    },
    { workspaceId: input.workspaceId },
  );
}
