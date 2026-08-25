export type Unit311SupportStatus =
  | "open"
  | "in_progress"
  | "awaiting_customer"
  | "resolved"
  | "closed";

export type Unit311SupportSeverity = "p1" | "p2" | "p3" | "p4";

export type Unit311SupportCategory =
  | "platform_problem"
  | "account_user"
  | "data_problem"
  | "integration_problem"
  | "configuration_help"
  | "how_do_i"
  | "billing"
  | "security_concern"
  | "other";

export type Unit311SupportAuthorKind = "customer" | "internal";

export type Unit311SupportTicket = {
  id: string;
  organisationId: string;
  organisationName?: string | null;
  workspaceId: string;
  workspaceName?: string | null;
  workspaceSlug?: string | null;
  submittedByUserId: string;
  submittedByName: string;
  submittedByEmail: string;
  subject: string;
  description: string;
  category: Unit311SupportCategory;
  affectedModule: string;
  severity: Unit311SupportSeverity | null;
  status: Unit311SupportStatus;
  assignedTo: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Unit311SupportMessage = {
  id: string;
  ticketId: string;
  authorKind: Unit311SupportAuthorKind;
  authorUserId: string;
  authorName: string;
  body: string;
  createdAt: string;
};

export type Unit311SupportTicketDetail = Unit311SupportTicket & {
  messages: Unit311SupportMessage[];
};

export type CreateUnit311SupportTicketInput = {
  subject: string;
  description: string;
  category: Unit311SupportCategory;
  affectedModule: string;
  workspaceId: string;
};

export type Unit311SupportSummaryCounts = {
  open: number;
  awaitingCustomer: number;
  resolved: number;
};
