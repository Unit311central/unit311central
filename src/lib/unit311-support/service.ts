import type {
  CreateUnit311SupportTicketInput,
  Unit311SupportAuthorKind,
  Unit311SupportMessage,
  Unit311SupportSeverity,
  Unit311SupportStatus,
  Unit311SupportSummaryCounts,
  Unit311SupportTicket,
  Unit311SupportTicketDetail,
} from "@/lib/unit311-support/types";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

type DbTicket = {
  id: string;
  organisation_id: string;
  workspace_id: string;
  submitted_by_user_id: string;
  submitted_by_name: string;
  submitted_by_email: string;
  subject: string;
  description: string;
  category: string;
  affected_module: string;
  severity: string | null;
  status: Unit311SupportStatus;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
};

type DbMessage = {
  id: string;
  ticket_id: string;
  author_kind: Unit311SupportAuthorKind;
  author_user_id: string;
  author_name: string;
  body: string;
  created_at: string;
};

function requireSupabase() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }
  return createSupabaseServerClient();
}

function mapTicket(row: DbTicket, extras?: Partial<Unit311SupportTicket>): Unit311SupportTicket {
  return {
    id: row.id,
    organisationId: row.organisation_id,
    workspaceId: row.workspace_id,
    submittedByUserId: row.submitted_by_user_id,
    submittedByName: row.submitted_by_name,
    submittedByEmail: row.submitted_by_email,
    subject: row.subject,
    description: row.description,
    category: row.category as Unit311SupportTicket["category"],
    affectedModule: row.affected_module,
    severity: (row.severity as Unit311SupportSeverity | null) ?? null,
    status: row.status,
    assignedTo: row.assigned_to,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...extras,
  };
}

function mapMessage(row: DbMessage): Unit311SupportMessage {
  return {
    id: row.id,
    ticketId: row.ticket_id,
    authorKind: row.author_kind,
    authorUserId: row.author_user_id,
    authorName: row.author_name,
    body: row.body,
    createdAt: row.created_at,
  };
}

async function nextTicketId(): Promise<string> {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("unit311_support_tickets")
    .select("id")
    .order("id", { ascending: false })
    .limit(1);

  if (error) throw new Error(error.message);
  const latest = data?.[0]?.id as string | undefined;
  const match = latest?.match(/^U311-(\d+)$/);
  const nextNumber = match ? Number(match[1]) + 1 : 1;
  return `U311-${String(nextNumber).padStart(4, "0")}`;
}

async function enrichTickets(rows: DbTicket[]): Promise<Unit311SupportTicket[]> {
  if (!rows.length) return [];

  const supabase = requireSupabase();
  const orgIds = [...new Set(rows.map((row) => row.organisation_id))];
  const workspaceIds = [...new Set(rows.map((row) => row.workspace_id))];

  const [{ data: orgs }, { data: workspaces }] = await Promise.all([
    supabase.from("platform_organisations").select("id, name").in("id", orgIds),
    supabase.from("workspaces").select("id, name, slug").in("id", workspaceIds),
  ]);

  const orgMap = new Map((orgs ?? []).map((row) => [row.id, row.name]));
  const workspaceMap = new Map(
    (workspaces ?? []).map((row) => [row.id, { name: row.name, slug: row.slug }]),
  );

  return rows.map((row) =>
    mapTicket(row, {
      organisationName: orgMap.get(row.organisation_id) ?? null,
      workspaceName: workspaceMap.get(row.workspace_id)?.name ?? null,
      workspaceSlug: workspaceMap.get(row.workspace_id)?.slug ?? null,
    }),
  );
}

export async function listUnit311SupportTicketsForOrganisation(
  organisationId: string,
): Promise<Unit311SupportTicket[]> {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("unit311_support_tickets")
    .select("*")
    .eq("organisation_id", organisationId)
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);
  return enrichTickets((data ?? []) as DbTicket[]);
}

export async function listAllUnit311SupportTickets(): Promise<Unit311SupportTicket[]> {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("unit311_support_tickets")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);
  return enrichTickets((data ?? []) as DbTicket[]);
}

export async function getUnit311SupportSummaryCounts(
  organisationId: string,
): Promise<Unit311SupportSummaryCounts> {
  const tickets = await listUnit311SupportTicketsForOrganisation(organisationId);
  return {
    open: tickets.filter((ticket) => ticket.status === "open" || ticket.status === "in_progress")
      .length,
    awaitingCustomer: tickets.filter((ticket) => ticket.status === "awaiting_customer").length,
    resolved: tickets.filter((ticket) => ticket.status === "resolved").length,
  };
}

export async function getUnit311SupportTicketForOrganisation(
  ticketId: string,
  organisationId: string,
): Promise<Unit311SupportTicketDetail | null> {
  const supabase = requireSupabase();
  const { data: ticketRow, error } = await supabase
    .from("unit311_support_tickets")
    .select("*")
    .eq("id", ticketId)
    .eq("organisation_id", organisationId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!ticketRow) return null;

  const [ticket] = await enrichTickets([ticketRow as DbTicket]);
  const messages = await listUnit311SupportMessages(ticketId);
  return { ...ticket, messages };
}

export async function getUnit311SupportTicketInternal(
  ticketId: string,
): Promise<Unit311SupportTicketDetail | null> {
  const supabase = requireSupabase();
  const { data: ticketRow, error } = await supabase
    .from("unit311_support_tickets")
    .select("*")
    .eq("id", ticketId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!ticketRow) return null;

  const [ticket] = await enrichTickets([ticketRow as DbTicket]);
  const messages = await listUnit311SupportMessages(ticketId);
  return { ...ticket, messages };
}

export async function listUnit311SupportMessages(ticketId: string): Promise<Unit311SupportMessage[]> {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("unit311_support_messages")
    .select("*")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return ((data ?? []) as DbMessage[]).map(mapMessage);
}

export async function createUnit311SupportTicket(input: {
  organisationId: string;
  workspaceId: string;
  submittedByUserId: string;
  submittedByName: string;
  submittedByEmail: string;
  ticket: CreateUnit311SupportTicketInput;
}): Promise<Unit311SupportTicketDetail> {
  const supabase = requireSupabase();
  const id = await nextTicketId();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("unit311_support_tickets")
    .insert({
      id,
      organisation_id: input.organisationId,
      workspace_id: input.workspaceId,
      submitted_by_user_id: input.submittedByUserId,
      submitted_by_name: input.submittedByName,
      submitted_by_email: input.submittedByEmail,
      subject: input.ticket.subject.trim(),
      description: input.ticket.description.trim(),
      category: input.ticket.category,
      affected_module: input.ticket.affectedModule.trim(),
      status: "open",
      created_at: now,
      updated_at: now,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  const initialMessage = await appendUnit311SupportMessage({
    ticketId: id,
    authorKind: "customer",
    authorUserId: input.submittedByUserId,
    authorName: input.submittedByName,
    body: input.ticket.description.trim(),
  });

  const [ticket] = await enrichTickets([data as DbTicket]);
  return { ...ticket, messages: [initialMessage] };
}

export async function appendUnit311SupportMessage(input: {
  ticketId: string;
  authorKind: Unit311SupportAuthorKind;
  authorUserId: string;
  authorName: string;
  body: string;
  statusAfterReply?: Unit311SupportStatus;
}): Promise<Unit311SupportMessage> {
  const supabase = requireSupabase();
  const now = new Date().toISOString();
  const body = input.body.trim();
  if (!body) throw new Error("Message body is required.");

  const { data, error } = await supabase
    .from("unit311_support_messages")
    .insert({
      ticket_id: input.ticketId,
      author_kind: input.authorKind,
      author_user_id: input.authorUserId,
      author_name: input.authorName,
      body,
      created_at: now,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  const patch: Record<string, string | null> = { updated_at: now };
  if (input.statusAfterReply) {
    patch.status = input.statusAfterReply;
  } else if (input.authorKind === "customer") {
    patch.status = "open";
  } else if (input.authorKind === "internal") {
    patch.status = "awaiting_customer";
  }

  const { error: ticketError } = await supabase
    .from("unit311_support_tickets")
    .update(patch)
    .eq("id", input.ticketId);

  if (ticketError) throw new Error(ticketError.message);

  return mapMessage(data as DbMessage);
}

export async function updateUnit311SupportTicketInternal(
  ticketId: string,
  patch: {
    status?: Unit311SupportStatus;
    severity?: Unit311SupportSeverity | null;
    assignedTo?: string | null;
  },
): Promise<Unit311SupportTicketDetail> {
  const supabase = requireSupabase();
  const payload: Record<string, string | null> = {
    updated_at: new Date().toISOString(),
  };

  if (patch.status !== undefined) payload.status = patch.status;
  if (patch.severity !== undefined) payload.severity = patch.severity;
  if (patch.assignedTo !== undefined) payload.assigned_to = patch.assignedTo;

  const { data, error } = await supabase
    .from("unit311_support_tickets")
    .update(payload)
    .eq("id", ticketId)
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  const detail = await getUnit311SupportTicketInternal(ticketId);
  if (!detail) throw new Error("Ticket not found.");
  return detail;
}
