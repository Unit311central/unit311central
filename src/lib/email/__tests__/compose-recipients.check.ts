/**
 * Email compose recipient helpers.
 * Run: node --import tsx src/lib/email/__tests__/compose-recipients.check.ts
 */
import assert from "node:assert/strict";

import type { EmailMessage } from "@/lib/email/types";
import type { EmailThread } from "@/lib/email/threading";
import {
  buildForwardSubject,
  buildReplySubject,
  excludeMailboxAddresses,
  resolveForwardAllRecipients,
  resolveReplyAllRecipients,
  resolveReplyToAddress,
  resolveThreadReplyRecipient,
} from "@/lib/email/compose-recipients";

function message(partial: Partial<EmailMessage> & Pick<EmailMessage, "id">): EmailMessage {
  return {
    uid: 1,
    subject: "Hello",
    from: "Sender <sender@example.com>",
    fromName: "Sender",
    fromEmail: "sender@example.com",
    to: ["info@unit311central.com"],
    cc: [],
    bcc: [],
    date: new Date().toISOString(),
    snippet: "Hello",
    body: "Hello",
    html: "",
    unread: false,
    attachments: [],
    messageId: "<1@example.com>",
    inReplyTo: null,
    references: [],
    direction: "inbound",
    replyToEmail: null,
    ...partial,
  };
}

function thread(messages: EmailMessage[]): EmailThread {
  return {
    id: "thread-1",
    subject: "Project update",
    fromName: "Sender",
    fromEmail: "sender@example.com",
    receivedAt: messages[0]?.date ?? new Date().toISOString(),
    lastActivityAt: messages[messages.length - 1]?.date ?? new Date().toISOString(),
    status: "open",
    unread: false,
    replyCount: 0,
    messages,
  };
}

assert.equal(resolveReplyToAddress(message({ id: "1", replyToEmail: "help@example.com" })), "help@example.com");
assert.equal(
  resolveReplyToAddress(message({ id: "1", replyToEmail: null, fromEmail: "sender@example.com" })),
  "sender@example.com",
);

const inbound = message({
  id: "1",
  fromEmail: "sender@example.com",
  to: ["info@unit311central.com"],
  cc: ["cc@example.com", "paul@unit311central.com"],
});
const replyAll = resolveReplyAllRecipients(thread([inbound]), "info@unit311central.com");
assert.equal(replyAll.to, "sender@example.com");
assert.deepEqual(replyAll.cc, ["cc@example.com", "paul@unit311central.com"]);

const forwardAll = resolveForwardAllRecipients(thread([inbound]), "paul@unit311central.com");
assert.ok(forwardAll.to.includes("sender@example.com"));
assert.ok(forwardAll.to.includes("info@unit311central.com"));
assert.deepEqual(forwardAll.cc, ["cc@example.com"]);

assert.equal(
  resolveThreadReplyRecipient(thread([inbound]), "info@unit311central.com"),
  "sender@example.com",
);
assert.deepEqual(
  excludeMailboxAddresses(["info@unit311central.com", "sender@example.com"], "info@unit311central.com"),
  ["sender@example.com"],
);
assert.equal(buildReplySubject("Project update"), "Re: Project update");
assert.equal(buildReplySubject("Re: Project update"), "Re: Project update");
assert.equal(buildForwardSubject("Project update"), "Fwd: Project update");

console.log("compose-recipients.check.ts — all assertions passed");
