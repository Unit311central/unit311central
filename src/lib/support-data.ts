export type SupportTicketPriority = "low" | "medium" | "high" | "urgent";

export const SUPPORT_CHANNEL_ROOM = "support-desk";

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
};

export function mapSupportTicket(row: DbSupportTicket): SupportTicket {
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
    closed: row.closed ?? false,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
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
