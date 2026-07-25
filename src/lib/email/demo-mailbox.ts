/**
 * Demo-only synthetic mailbox — never calls Zoho/IMAP.
 */

import { getDemoEnterpriseFixtures } from "@/lib/demo-enterprise";
import type { EmailAccount, EmailAccountId, EmailMailboxFolder, EmailMessage } from "@/lib/email/types";

export function getDemoPublicEmailAccounts(): EmailAccount[] {
  return getDemoEnterpriseFixtures().emails.accounts.map((row) => ({
    id: row.id as EmailAccountId,
    email: row.email,
    name: row.name,
  }));
}

export function isDemoEmailAccountConfigured(id: EmailAccountId): boolean {
  return getDemoEnterpriseFixtures().emails.accounts.some(
    (row) => row.id === id && row.configured !== false,
  );
}

export function listDemoMailboxMessages(
  accountId: EmailAccountId,
  folder: EmailMailboxFolder = "inbox",
): EmailMessage[] {
  const fixtures = getDemoEnterpriseFixtures();
  const account = fixtures.emails.accounts.find((row) => row.id === accountId);
  const mailbox = account?.email ?? `hello@${fixtures.company.domain}`;

  return fixtures.emails.threads
    .filter((thread) => thread.accountId === accountId && thread.folder === folder)
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
        messageId: `<${thread.id}@meridianatlas.demo>`,
        inReplyTo: null,
        references: [],
        direction: folder === "sent" ? ("outbound" as const) : ("inbound" as const),
      };
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
