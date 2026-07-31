import { randomBytes, randomUUID } from "node:crypto";

import {
  mapSupportTicket,
  type SupportTicket,
  type SupportTicketPriority,
  type SupportTicketStatus,
} from "@/lib/support-data";
import {
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
  attachmentName?: string | null;
  attachmentUrl?: string | null;
  attachmentMime?: string | null;
};

export type SupportLoungeAttachment = {
  id: string;
  ticketId: string;
  fileName: string;
  fileUrl: string;
  mimeType: string | null;
  sizeBytes: number | null;
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
  if (mapped.loungeToken) {
    if (existing.support_lounge_enabled === false) {
      await supabase
        .from("internal_clients")
        .update({ support_lounge_enabled: true, updated_at: new Date().toISOString() })
        .eq("id", input.clientId)
        .eq("workspace_id", input.workspaceId);
    }
    return { ...mapped, enabled: true };
  }

  const companySlug = (mapped.companyName || "client")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 24);
  const token = companySlug ? `${companySlug}-${createLoungeToken()}` : createLoungeToken();
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

/** Mint a unique Support Lounge token for every client in the workspace that is missing one. */
export async function ensureAllWorkspaceLoungeTokens(input: {
  workspaceId: string;
}): Promise<Array<{ clientId: string; companyName: string; loungeToken: string; created: boolean }>> {
  const supabase = requireLoungeSupabase();
  const { data, error } = await supabase
    .from("internal_clients")
    .select("id,workspace_id,company_name,support_lounge_token,support_lounge_enabled")
    .eq("workspace_id", input.workspaceId)
    .order("company_name", { ascending: true });

  if (error) throw new Error(error.message);

  const results: Array<{
    clientId: string;
    companyName: string;
    loungeToken: string;
    created: boolean;
  }> = [];

  for (const row of data || []) {
    const had = Boolean((row.support_lounge_token as string | null)?.trim());
    const lounge = await ensureClientLoungeToken({
      clientId: row.id as string,
      workspaceId: input.workspaceId,
    });
    results.push({
      clientId: lounge.id,
      companyName: lounge.companyName,
      loungeToken: lounge.loungeToken,
      created: !had,
    });
  }

  return results;
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

/** Open tickets for this lounge client (any requester) — used for Existing ticket dropdown. */
export async function listLoungeOpenTicketsForClient(input: {
  workspaceId: string;
  clientId: string;
}): Promise<SupportTicket[]> {
  const supabase = requireLoungeSupabase();
  const { data, error } = await supabase
    .from("support_tickets")
    .select("*")
    .eq("workspace_id", input.workspaceId)
    .eq("client_id", input.clientId)
    .eq("archived", false)
    .eq("closed", false)
    .order("created_at", { ascending: false })
    .limit(50);

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
  requesterFirstName?: string | null;
  requesterLastName?: string | null;
  requesterDepartment?: string | null;
  requesterRole?: string | null;
  ticketKind?: "new" | "existing" | null;
}): Promise<{ ticket: SupportTicket; resumePath: string }> {
  const publicToken = createTicketPublicToken();
  const resumePath = `/s/${encodeURIComponent(input.lounge.loungeToken)}/t/${encodeURIComponent(publicToken)}`;
  const resumeUrl = `${DEMO_SITE_URL.replace(/\/$/, "")}${resumePath}`;
  const composedName = [input.requesterFirstName, input.requesterLastName]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" ");
  const name =
    composedName ||
    (input.requesterName || "Support guest").trim() ||
    "Support guest";
  const ticket = await createSupportTicket(
    {
      name,
      organisation: input.lounge.companyName,
      priority: input.priority || "medium",
      description: input.description.trim(),
      clientId: input.lounge.id,
      requesterAnonId: input.requesterAnonId,
      requesterEmail: input.requesterEmail?.trim() || null,
      requesterFirstName: input.requesterFirstName?.trim() || null,
      requesterLastName: input.requesterLastName?.trim() || null,
      requesterDepartment: input.requesterDepartment?.trim() || null,
      requesterRole: input.requesterRole?.trim() || null,
      ticketKind: input.ticketKind || "new",
      ticketPublicToken: publicToken,
      ticketPublicUrl: resumeUrl,
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
    await postTicketToSupportChannel(
      ticket,
      { workspaceId: input.lounge.workspaceId },
      { resumeUrl: ticket.ticketPublicUrl || resumeUrl },
    );
  } catch (error) {
    console.warn("[support-lounge] desk notify failed:", error);
  }

  return {
    ticket,
    resumePath,
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
    const { ensureClientSupportChannel } = await import("@/lib/support-channel");
    const { sendMessage } = await import("@/lib/internal-messaging-service");
    const channel = await ensureClientSupportChannel({
      companyName: input.lounge.companyName,
      clientId: input.lounge.id,
      scope: { workspaceId: input.lounge.workspaceId },
    });
    await sendMessage(
      {
        operatorId: "lounge:escalation",
        operatorName: "Support Lounge",
        username: "lounge",
        content: [
          `Human help requested on ${input.ticket.id}`,
          `${input.lounge.companyName} · ${input.ticket.name}`,
          note || input.ticket.description,
          `Assign support ticket: ${input.ticket.id}`,
        ].join("\n"),
        room: channel.room,
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
  attachmentName?: string | null;
  attachmentUrl?: string | null;
  attachmentMime?: string | null;
}): Promise<SupportLoungeMessage> {
  const supabase = requireLoungeSupabase();
  const { data, error } = await supabase
    .from("support_lounge_messages")
    .insert({
      workspace_id: input.workspaceId,
      ticket_id: input.ticketId,
      role: input.role,
      content: input.content.trim(),
      attachment_name: input.attachmentName?.trim() || null,
      attachment_url: input.attachmentUrl?.trim() || null,
      attachment_mime: input.attachmentMime?.trim() || null,
    })
    .select("id,ticket_id,role,content,created_at,attachment_name,attachment_url,attachment_mime")
    .single();

  if (error) throw new Error(error.message);
  return {
    id: data.id as string,
    ticketId: data.ticket_id as string,
    role: data.role as SupportLoungeMessage["role"],
    content: data.content as string,
    createdAt: data.created_at as string,
    attachmentName: (data.attachment_name as string | null) ?? null,
    attachmentUrl: (data.attachment_url as string | null) ?? null,
    attachmentMime: (data.attachment_mime as string | null) ?? null,
  };
}

export async function listLoungeMessages(input: {
  workspaceId: string;
  ticketId: string;
}): Promise<SupportLoungeMessage[]> {
  const supabase = requireLoungeSupabase();
  const { data, error } = await supabase
    .from("support_lounge_messages")
    .select("id,ticket_id,role,content,created_at,attachment_name,attachment_url,attachment_mime")
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
    attachmentName: (row.attachment_name as string | null) ?? null,
    attachmentUrl: (row.attachment_url as string | null) ?? null,
    attachmentMime: (row.attachment_mime as string | null) ?? null,
  }));
}

export async function listLoungeAttachments(input: {
  workspaceId: string;
  ticketId: string;
}): Promise<SupportLoungeAttachment[]> {
  const supabase = requireLoungeSupabase();
  const { data, error } = await supabase
    .from("support_lounge_attachments")
    .select("id,ticket_id,file_name,file_url,mime_type,size_bytes,created_at")
    .eq("workspace_id", input.workspaceId)
    .eq("ticket_id", input.ticketId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return (data || []).map((row) => ({
    id: row.id as string,
    ticketId: row.ticket_id as string,
    fileName: row.file_name as string,
    fileUrl: row.file_url as string,
    mimeType: (row.mime_type as string | null) ?? null,
    sizeBytes: (row.size_bytes as number | null) ?? null,
    createdAt: row.created_at as string,
  }));
}

export async function uploadLoungeAttachment(input: {
  workspaceId: string;
  ticketId: string;
  file: File;
}): Promise<SupportLoungeAttachment> {
  const { isAllowedLoungeAttachment, LOUNGE_MAX_ATTACHMENT_BYTES } = await import(
    "@/lib/support-lounge-attachments"
  );
  const check = isAllowedLoungeAttachment(input.file);
  if (!check.ok) {
    throw new Error(check.error);
  }
  if (input.file.size > LOUNGE_MAX_ATTACHMENT_BYTES) {
    throw new Error("Attachments must be 100 MB or smaller.");
  }

  const { INTERNAL_FILES_BUCKET } = await import("@/lib/internal-files-data");
  const supabase = requireLoungeSupabase();
  const safeName = input.file.name.replace(/[^\w.\-() ]+/g, "_");
  const storagePath = `support-lounge/${input.workspaceId}/${input.ticketId}/${Date.now()}-${safeName}`;
  const buffer = Buffer.from(await input.file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from(INTERNAL_FILES_BUCKET)
    .upload(storagePath, buffer, {
      contentType: input.file.type || "application/octet-stream",
      upsert: false,
    });
  if (uploadError) throw new Error(uploadError.message);

  const { data: publicData } = supabase.storage
    .from(INTERNAL_FILES_BUCKET)
    .getPublicUrl(storagePath);

  const { data, error } = await supabase
    .from("support_lounge_attachments")
    .insert({
      workspace_id: input.workspaceId,
      ticket_id: input.ticketId,
      file_name: input.file.name,
      file_url: publicData.publicUrl,
      mime_type: input.file.type || "application/octet-stream",
      size_bytes: input.file.size,
    })
    .select("id,ticket_id,file_name,file_url,mime_type,size_bytes,created_at")
    .single();

  if (error) throw new Error(error.message);

  await appendLoungeMessage({
    workspaceId: input.workspaceId,
    ticketId: input.ticketId,
    role: "user",
    content: `Uploaded file: ${input.file.name}`,
    attachmentName: input.file.name,
    attachmentUrl: publicData.publicUrl,
    attachmentMime: input.file.type || "application/octet-stream",
  });

  return {
    id: data.id as string,
    ticketId: data.ticket_id as string,
    fileName: data.file_name as string,
    fileUrl: data.file_url as string,
    mimeType: (data.mime_type as string | null) ?? null,
    sizeBytes: (data.size_bytes as number | null) ?? null,
    createdAt: data.created_at as string,
  };
}

export async function sendLoungeTicketSummaryEmail(input: {
  lounge: SupportLoungeClient;
  ticket: SupportTicket;
  resumeUrl: string;
}): Promise<boolean> {
  const to = input.ticket.requesterEmail?.trim();
  if (!to || !to.includes("@")) return false;

  try {
    const { sendMailboxEmail } = await import("@/lib/email/smtp");
    const name = [
      input.ticket.requesterFirstName,
      input.ticket.requesterLastName,
    ]
      .filter(Boolean)
      .join(" ")
      .trim() || input.ticket.name;

    const caseUrl = input.ticket.ticketPublicUrl || input.resumeUrl;

    await sendMailboxEmail({
      account: "demo",
      workspaceId: input.lounge.workspaceId,
      to,
      subject: `Support ticket ${input.ticket.id} received — Demo Support Lounge`,
      text: [
        `Hi ${name || "there"},`,
        "",
        `Your support ticket ${input.ticket.id} has been created with Demo Support Lounge.`,
        "",
        `Organisation: ${input.ticket.organisation}`,
        `Status: ${input.ticket.status || "open"}`,
        `Priority: ${input.ticket.priority}`,
        "",
        "Summary:",
        input.ticket.description,
        "",
        "Track updates and add more information anytime using this private link:",
        caseUrl,
        "",
        "Our Demo support team has been notified and will begin working on the case.",
        "",
        "— Demo Support Lounge",
      ].join("\n"),
    });
    return true;
  } catch (error) {
    console.warn("[support-lounge] summary email failed:", error);
    return false;
  }
}

/** Desk inbox for new lounge tickets. Prefer support@ when that mailbox exists. */
export const SUPPORT_DESK_NOTIFY_EMAIL = "info@unit311central.com";

export async function sendLoungeTicketDeskNotifyEmail(input: {
  lounge: SupportLoungeClient;
  ticket: SupportTicket;
  resumeUrl: string;
}): Promise<boolean> {
  try {
    const { sendMailboxEmail } = await import("@/lib/email/smtp");
    const caseUrl = input.ticket.ticketPublicUrl || input.resumeUrl;
    const supportHref = `/?view=support&ticketId=${encodeURIComponent(input.ticket.id)}`;

    await sendMailboxEmail({
      account: "demo",
      workspaceId: input.lounge.workspaceId,
      to: SUPPORT_DESK_NOTIFY_EMAIL,
      subject: `New support ticket ${input.ticket.id} — ${input.lounge.companyName}`,
      text: [
        `A new Support Lounge ticket was opened for ${input.lounge.companyName}.`,
        "",
        `Ticket: ${input.ticket.id}`,
        `Requester: ${input.ticket.name}`,
        `Email: ${input.ticket.requesterEmail || "—"}`,
        `Priority: ${input.ticket.priority}`,
        `Status: ${input.ticket.status || "open"}`,
        "",
        "Summary:",
        input.ticket.description,
        "",
        `Open in Support: ${supportHref}`,
        `Client case link: ${caseUrl}`,
        "",
        "Assign an owner in Messaging (Support - {client} channel) or on the Support ticket.",
        "",
        "— Demo Support Lounge",
      ].join("\n"),
    });
    return true;
  } catch (error) {
    console.warn("[support-lounge] desk notify email failed:", error);
    return false;
  }
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
