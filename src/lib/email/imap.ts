import { ImapFlow } from "imapflow";
import { simpleParser, type Attachment } from "mailparser";

import {
  getAccountCredentials,
  getAccountDefinition,
  ZOHO_IMAP_HOST,
  ZOHO_IMAP_PORT,
} from "@/lib/email/accounts";
import { EmailServiceError, type EmailAccountId, type EmailAttachmentMeta, type EmailMailboxFolder, type EmailMessage } from "@/lib/email/types";

const DEFAULT_FETCH_LIMIT = 50;

function parseAddress(value: string | undefined) {
  if (!value) return { name: "Unknown", email: "" };
  const match = value.match(/^(?:"?([^"]*)"?\s)?<?([^>]+@[^>]+)>?$/);
  if (match) {
    return {
      name: (match[1] || match[2]?.split("@")[0] || "Unknown").trim(),
      email: match[2]?.trim() ?? value.trim(),
    };
  }
  return { name: value.split("@")[0] || "Unknown", email: value.trim() };
}

function parseAddressList(field: { value?: { address?: string | null }[] } | undefined) {
  return (field?.value ?? []).map((entry) => entry.address ?? "").filter(Boolean);
}

function buildSnippet(text: string, html: string, max = 160) {
  const source = text.trim() || html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  if (source.length <= max) return source;
  return `${source.slice(0, max - 1)}…`;
}

function mapAttachments(attachments: Attachment[] | undefined): EmailAttachmentMeta[] {
  return (attachments ?? [])
    .filter((attachment) => attachment.filename)
    .map((attachment, index) => ({
      filename: attachment.filename ?? `attachment-${index + 1}`,
      contentType: attachment.contentType ?? "application/octet-stream",
      size: attachment.size ?? 0,
      partId: String(index),
    }));
}

type ImapFlowError = Error & {
  response?: string;
  responseStatus?: string;
  responseText?: string;
  serverResponseCode?: string;
  executedCommand?: string;
  authenticationFailed?: boolean;
};

function formatImapConnectionError(error: unknown): string {
  const imapError = error as ImapFlowError;

  if (imapError.responseText?.trim()) {
    return imapError.responseText.trim();
  }

  if (imapError.response?.trim()) {
    return imapError.response.trim();
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }

  return "Unable to connect to Zoho Mail.";
}

function logImapConnectionError(accountId: EmailAccountId, username: string, error: unknown) {
  const imapError = error as ImapFlowError;
  console.error("[email/imap] connection failed", {
    account: accountId,
    username,
    host: ZOHO_IMAP_HOST,
    port: ZOHO_IMAP_PORT,
    secure: true,
    response: imapError.response ?? null,
    responseStatus: imapError.responseStatus ?? null,
    responseText: imapError.responseText ?? null,
    serverResponseCode: imapError.serverResponseCode ?? null,
    executedCommand: imapError.executedCommand ?? null,
    authenticationFailed: imapError.authenticationFailed ?? null,
    message: error instanceof Error ? error.message : null,
  });
}

async function withImapClient<T>(
  accountId: EmailAccountId,
  fn: (client: ImapFlow, mailboxEmail: string) => Promise<T>,
): Promise<T> {
  let credentials;
  try {
    credentials = await getAccountCredentials(accountId);
  } catch {
    throw new EmailServiceError("Mailbox credentials are not configured.", "NOT_CONFIGURED");
  }

  const client = new ImapFlow({
    host: ZOHO_IMAP_HOST,
    port: ZOHO_IMAP_PORT,
    secure: true,
    auth: {
      user: credentials.email,
      pass: credentials.password,
    },
    logger: false,
    emitLogs: false,
  });

  try {
    await client.connect();
    return await fn(client, credentials.email);
  } catch (error) {
    logImapConnectionError(accountId, credentials.email, error);
    throw new EmailServiceError(formatImapConnectionError(error), "CONNECTION_FAILED");
  } finally {
    try {
      await client.logout();
    } catch {
      // ignore logout errors
    }
  }
}

async function parseMessageSource(
  source: Buffer,
  meta: {
    uid: number;
    unread: boolean;
    mailboxEmail: string;
  },
): Promise<EmailMessage> {
  const parsed = await simpleParser(source);
  const from = parseAddress(parsed.from?.text ?? "");
  const to = parseAddressList(Array.isArray(parsed.to) ? parsed.to[0] : parsed.to);
  const cc = parseAddressList(Array.isArray(parsed.cc) ? parsed.cc[0] : parsed.cc);
  const bcc = parseAddressList(Array.isArray(parsed.bcc) ? parsed.bcc[0] : parsed.bcc);
  const subject = parsed.subject?.trim() || "(No subject)";
  const text = parsed.text ?? "";
  const html = typeof parsed.html === "string" ? parsed.html : "";
  const date = (parsed.date ?? new Date()).toISOString();
  const messageId = parsed.messageId ?? null;
  const inReplyTo = parsed.inReplyTo ?? null;
  const references = parsed.references
    ? Array.isArray(parsed.references)
      ? parsed.references
      : [parsed.references]
    : [];
  const fromEmail = from.email.toLowerCase();
  const direction =
    fromEmail === meta.mailboxEmail.toLowerCase() ? ("outbound" as const) : ("inbound" as const);

  return {
    id: String(meta.uid),
    uid: meta.uid,
    subject,
    from: parsed.from?.text ?? from.email,
    fromName: from.name,
    fromEmail: from.email,
    to,
    cc,
    bcc,
    date,
    snippet: buildSnippet(text, html),
    body: text,
    html,
    unread: meta.unread,
    attachments: mapAttachments(parsed.attachments),
    messageId,
    inReplyTo,
    references,
    direction,
  };
}

async function resolveImapFolderPath(
  client: ImapFlow,
  folder: EmailMailboxFolder,
): Promise<string> {
  if (folder === "inbox") return "INBOX";

  try {
    const mailboxes = await client.list();
    const specialSent = mailboxes.find((box) =>
      (box.specialUse ?? "").toUpperCase().includes("SENT"),
    );
    if (specialSent?.path) return specialSent.path;

    const byName = mailboxes.find((box) => {
      const name = `${box.name ?? ""} ${box.path ?? ""}`.toLowerCase();
      return (
        name === "sent" ||
        name.includes("sent items") ||
        name.includes("sent mail") ||
        /(^|\/)sent($|\/)/.test(name)
      );
    });
    if (byName?.path) return byName.path;
  } catch (error) {
    console.warn("[email/imap] mailbox list failed; falling back to Sent", error);
  }

  return "Sent";
}

export async function fetchMailboxMessages(
  accountId: EmailAccountId,
  limit = DEFAULT_FETCH_LIMIT,
  folder: EmailMailboxFolder = "inbox",
): Promise<EmailMessage[]> {
  return withImapClient(accountId, async (client, mailboxEmail) => {
    const folderPath = await resolveImapFolderPath(client, folder);
    const lock = await client.getMailboxLock(folderPath);
    try {
      if (!client.mailbox || client.mailbox.exists === 0) return [];

      const total = client.mailbox.exists;
      const start = Math.max(1, total - limit + 1);
      const range = `${start}:${total}`;
      const messages: EmailMessage[] = [];

      for await (const item of client.fetch(range, {
        uid: true,
        flags: true,
        source: true,
      })) {
        if (!item.source || !item.uid) continue;
        const unread = !item.flags?.has("\\Seen");
        const parsed = await parseMessageSource(item.source, {
          uid: item.uid,
          unread,
          mailboxEmail,
        });
        messages.push(
          folder === "sent"
            ? { ...parsed, direction: "outbound" as const, unread: false }
            : parsed,
        );
      }

      return messages.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );
    } finally {
      lock.release();
    }
  });
}

export async function fetchMailboxMessageById(
  accountId: EmailAccountId,
  messageId: string,
  folder: EmailMailboxFolder = "inbox",
): Promise<EmailMessage> {
  const uid = Number(messageId);
  if (!Number.isFinite(uid) || uid <= 0) {
    throw new EmailServiceError("Invalid message id.", "NOT_FOUND");
  }

  return withImapClient(accountId, async (client, mailboxEmail) => {
    const folderPath = await resolveImapFolderPath(client, folder);
    const lock = await client.getMailboxLock(folderPath);
    try {
      const item = await client.fetchOne(String(uid), { uid: true, flags: true, source: true }, {
        uid: true,
      });

      if (!item || !item.source || !item.uid) {
        throw new EmailServiceError("Message not found.", "NOT_FOUND");
      }

      const parsed = await parseMessageSource(item.source, {
        uid: item.uid,
        unread: !item.flags?.has("\\Seen"),
        mailboxEmail,
      });
      return folder === "sent"
        ? { ...parsed, direction: "outbound" as const, unread: false }
        : parsed;
    } finally {
      lock.release();
    }
  });
}

export async function fetchAttachmentContent(
  accountId: EmailAccountId,
  messageId: string,
  partId: string,
  folder: EmailMailboxFolder = "inbox",
): Promise<{ filename: string; contentType: string; content: Buffer }> {
  const message = await fetchMailboxMessageById(accountId, messageId, folder);
  const index = Number(partId);
  const attachment = message.attachments[index];
  if (!attachment) {
    throw new EmailServiceError("Attachment not found.", "NOT_FOUND");
  }

  const uid = Number(messageId);
  return withImapClient(accountId, async (client) => {
    const folderPath = await resolveImapFolderPath(client, folder);
    const lock = await client.getMailboxLock(folderPath);
    try {
      const item = await client.fetchOne(String(uid), { source: true }, { uid: true });
      if (!item || !item.source) {
        throw new EmailServiceError("Message not found.", "NOT_FOUND");
      }
      const parsed = await simpleParser(item.source);
      const file = parsed.attachments?.[index];
      if (!file?.content) throw new EmailServiceError("Attachment not found.", "NOT_FOUND");
      return {
        filename: attachment.filename,
        contentType: attachment.contentType,
        content: file.content,
      };
    } finally {
      lock.release();
    }
  });
}

export function getMailboxLabel(accountId: EmailAccountId) {
  return getAccountDefinition(accountId).email;
}
