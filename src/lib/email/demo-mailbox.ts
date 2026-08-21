/**
 * Demo-only helpers. Mailbox *accounts* are the real Unit311 Zoho inboxes
 * (see accounts.ts). Synthetic Meridian threads remain available only if a
 * caller explicitly wants fixture messages — production Email APIs use Zoho.
 */

import { getDemoEnterpriseFixtures } from "@/lib/demo-enterprise";
import type { EmailAccount, EmailAccountId, EmailMailboxFolder, EmailMessage } from "@/lib/email/types";

const UNIT311_ACCOUNTS: readonly EmailAccount[] = [
  { id: "info", email: "info@unit311central.com", name: "Shared Inbox" },
  { id: "paul", email: "paul@unit311central.com", name: "Paul" },
  { id: "admin", email: "admin@unit311central.com", name: "Admin" },
  { id: "demo", email: "demo@unit311central.com", name: "Demo" },
];

export function getDemoPublicEmailAccounts(): EmailAccount[] {
  return UNIT311_ACCOUNTS.map((account) => ({ ...account }));
}

export function isDemoEmailAccountConfigured(id: EmailAccountId): boolean {
  return UNIT311_ACCOUNTS.some((row) => row.id === id);
}

export function listDemoMailboxMessages(
  accountId: EmailAccountId,
  folder: EmailMailboxFolder = "inbox",
): EmailMessage[] {
  const fixtures = getDemoEnterpriseFixtures();
  const account = UNIT311_ACCOUNTS.find((row) => row.id === accountId);
  const mailbox = account?.email ?? "info@unit311central.com";
  const hasDemoThreads = fixtures.emails.threads.some((thread) => thread.accountId === "demo");
  const effectiveAccountId =
    accountId === "demo" && !hasDemoThreads ? ("info" as EmailAccountId) : accountId;

  return fixtures.emails.threads
    .filter((thread) => thread.accountId === effectiveAccountId && thread.folder === folder)
    .map((thread, index) => {
      const date = new Date(Date.now() + thread.dateOffsetHours * 3600_000).toISOString();
      const body = thread.body;
      return {
        id: thread.id,
        uid: 9000 + index,
        subject: thread.subject,
        from: `${thread.fromName} <${thread.fromEmail}>`,
        fromName: thread.fromName,
        fromEmail: thread.fromEmail,
        to: [mailbox],
        cc: [],
        bcc: [],
        date,
        snippet: thread.snippet,
        body,
        html: `<pre style="font-family:inherit;white-space:pre-wrap">${body.replace(/</g, "&lt;")}</pre>`,
        unread: thread.unread,
        attachments: [],
        messageId: `<${thread.id}@unit311central.com>`,
        inReplyTo: null,
        references: [],
        replyToEmail: null,
        direction: folder === "sent" ? ("outbound" as const) : ("inbound" as const),
      };
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
