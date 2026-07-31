export type SupportTicketPriority = "low" | "medium" | "high" | "urgent";

export type SupportTicketStatus =
  | "intake"
  | "open"
  | "in_progress"
  | "waiting_on_client"
  | "resolved"
  | "closed";

export const SUPPORT_CHANNEL_ROOM = "support-desk";

export const SUPPORT_TICKET_STATUSES: SupportTicketStatus[] = [
  "intake",
  "open",
  "in_progress",
  "waiting_on_client",
  "resolved",
  "closed",
];

export const SUPPORT_TICKET_STATUS_LABELS: Record<SupportTicketStatus, string> = {
  intake: "Intake",
  open: "Open",
  in_progress: "In progress",
  waiting_on_client: "Waiting on client",
  resolved: "Resolved",
  closed: "Closed",
};

export type SupportTicket = {
  id: string;
  name: string;
  organisation: string;
  priority: SupportTicketPriority;
  description: string;
  userAssigned: string | null;
  clientPhone: string | null;
  clientPriorityLabel: string | null;
  archived: boolean;
  closed: boolean;
  createdAt: string;
  updatedAt: string;
  clientId?: string | null;
  requesterAnonId?: string | null;
  requesterEmail?: string | null;
  requesterFirstName?: string | null;
  requesterLastName?: string | null;
  requesterDepartment?: string | null;
  requesterRole?: string | null;
  ticketKind?: "new" | "existing" | null;
  ticketPublicToken?: string | null;
  status?: SupportTicketStatus;
  escalated?: boolean;
  source?: string | null;
};

export const SUPPORT_PRIORITIES: SupportTicketPriority[] = ["low", "medium", "high", "urgent"];

export const SUPPORT_PRIORITY_LABELS: Record<SupportTicketPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

type DbSupportTicket = {
  id: string;
  name: string;
  organisation: string;
  priority: SupportTicketPriority;
  description: string;
  user_assigned: string | null;
  client_phone: string | null;
  client_priority_label: string | null;
  archived: boolean;
  closed: boolean;
  created_at: string;
  updated_at: string;
  client_id?: string | null;
  requester_anon_id?: string | null;
  requester_email?: string | null;
  requester_first_name?: string | null;
  requester_last_name?: string | null;
  requester_department?: string | null;
  requester_role?: string | null;
  ticket_kind?: string | null;
  ticket_public_token?: string | null;
  status?: string | null;
  escalated?: boolean | null;
  source?: string | null;
};

function normalizeStatus(row: DbSupportTicket): SupportTicketStatus {
  const raw = (row.status || "").trim().toLowerCase();
  if (
    raw === "intake" ||
    raw === "open" ||
    raw === "in_progress" ||
    raw === "waiting_on_client" ||
    raw === "resolved" ||
    raw === "closed"
  ) {
    return raw;
  }
  return row.closed ? "closed" : "open";
}

export function mapSupportTicket(row: DbSupportTicket): SupportTicket {
  const status = normalizeStatus(row);
  return {
    id: row.id,
    name: row.name,
    organisation: row.organisation,
    priority: row.priority,
    description: row.description,
    userAssigned: row.user_assigned,
    clientPhone: row.client_phone,
    clientPriorityLabel: row.client_priority_label,
    archived: row.archived,
    closed: row.closed ?? status === "closed",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    clientId: row.client_id ?? null,
    requesterAnonId: row.requester_anon_id ?? null,
    requesterEmail: row.requester_email ?? null,
    requesterFirstName: row.requester_first_name ?? null,
    requesterLastName: row.requester_last_name ?? null,
    requesterDepartment: row.requester_department ?? null,
    requesterRole: row.requester_role ?? null,
    ticketKind:
      row.ticket_kind === "new" || row.ticket_kind === "existing" ? row.ticket_kind : null,
    ticketPublicToken: row.ticket_public_token ?? null,
    status,
    escalated: row.escalated ?? false,
    source: row.source ?? null,
  };
}

export function createBlankTicketInput(): Omit<SupportTicket, "id" | "createdAt" | "updatedAt"> {
  return {
    name: "",
    organisation: "",
    priority: "low",
    description: "",
    userAssigned: null,
    clientPhone: null,
    clientPriorityLabel: null,
    archived: false,
    closed: false,
    clientId: null,
    requesterAnonId: null,
    requesterEmail: null,
    requesterFirstName: null,
    requesterLastName: null,
    requesterDepartment: null,
    requesterRole: null,
    ticketKind: null,
    ticketPublicToken: null,
    status: "open",
    escalated: false,
    source: "manual",
  };
}

export function ticketFieldsEqual(a: SupportTicket, b: SupportTicket) {
  return (
    a.name === b.name &&
    a.organisation === b.organisation &&
    a.priority === b.priority &&
    a.description === b.description &&
    a.userAssigned === b.userAssigned &&
    a.archived === b.archived &&
    a.closed === b.closed
  );
}

export function formatSupportDate(iso: string | null) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function priorityBadgeClass(priority: SupportTicketPriority) {
  switch (priority) {
    case "urgent":
      return "border-red-400/30 bg-red-500/15 text-red-200";
    case "high":
      return "border-orange-400/30 bg-orange-500/15 text-orange-200";
    case "medium":
      return "border-amber-400/30 bg-amber-500/15 text-amber-200";
    default:
      return "border-sky-400/30 bg-sky-500/15 text-sky-200";
  }
}
