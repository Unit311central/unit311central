export type PlatformEmailAccountId = "info" | "paul" | "admin" | "demo";

/** Platform ids (info/paul/admin/demo) or workspace-scoped mailbox slugs (e.g. tom). */
export type EmailAccountId = PlatformEmailAccountId | (string & {});

export type EmailManagedAddressKind = "primary" | "alias";

export type EmailManagedAddress = {
  address: string;
  kind: EmailManagedAddressKind;
};

export type EmailMailboxFolder = "inbox" | "sent";

export type EmailAccount = {
  id: EmailAccountId;
  email: string;
  name: string;
  provider?: "zoho";
  addresses?: EmailManagedAddress[];
  configured?: boolean;
};

export type EmailAttachmentMeta = {
  filename: string;
  contentType: string;
  size: number;
  partId: string;
};

export type EmailMessage = {
  id: string;
  uid: number;
  subject: string;
  from: string;
  fromName: string;
  fromEmail: string;
  to: string[];
  cc: string[];
  bcc: string[];
  date: string;
  snippet: string;
  body: string;
  html: string;
  unread: boolean;
  attachments: EmailAttachmentMeta[];
  messageId: string | null;
  inReplyTo: string | null;
  references: string[];
  replyToEmail: string | null;
  direction: "inbound" | "outbound";
  /** Managed address the message was received on (inbound) or sent from (outbound). */
  receivedBy: string | null;
};

export type EmailThreadStatus = "unread" | "open" | "replied" | "closed";

export type EmailSendAttachment = {
  filename: string;
  content: Buffer | string;
  contentType?: string;
};

export type EmailSendPayload = {
  account: EmailAccountId;
  to: string;
  cc?: string;
  bcc?: string;
  replyTo?: string;
  fromAddress?: string;
  subject: string;
  html?: string;
  text?: string;
  attachments?: EmailSendAttachment[];
  inReplyTo?: string | null;
  references?: string[];
  /** Explicit tenant for DB/memory mailbox credentials (public/system callers). */
  workspaceId?: string | null;
};

export type EmailReplyContext = {
  to: string;
  subject: string;
  messageId?: string | null;
  references?: string[];
};

export type EmailReplyPayload = {
  account: EmailAccountId;
  messageId: string;
  html?: string;
  text?: string;
  fromAddress?: string;
  /** When provided, SMTP send skips IMAP re-fetch (required when inbox read is unavailable). */
  context?: EmailReplyContext;
  workspaceId?: string | null;
};

export class EmailServiceError extends Error {
  readonly code: "NOT_CONFIGURED" | "CONNECTION_FAILED" | "NOT_FOUND" | "SEND_FAILED";

  constructor(
    message: string,
    code: "NOT_CONFIGURED" | "CONNECTION_FAILED" | "NOT_FOUND" | "SEND_FAILED",
  ) {
    super(message);
    this.name = "EmailServiceError";
    this.code = code;
  }
}
