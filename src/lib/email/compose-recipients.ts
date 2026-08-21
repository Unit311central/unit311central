import type { EmailMessage } from "@/lib/email/types";
import type { EmailThread } from "@/lib/email/threading";

export function extractEmailAddress(value: string | null | undefined) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return "";
  const match = trimmed.match(/<([^>]+)>/);
  return (match?.[1] ?? trimmed).trim();
}

export function normalizeEmailAddress(value: string | null | undefined) {
  return extractEmailAddress(value).toLowerCase();
}

export function isSameMailboxAddress(left: string | null | undefined, right: string | null | undefined) {
  const a = normalizeEmailAddress(left);
  const b = normalizeEmailAddress(right);
  return Boolean(a && b && a === b);
}

export function uniqueEmailAddresses(values: Array<string | null | undefined>) {
  const seen = new Set<string>();
  const ordered: string[] = [];

  for (const value of values) {
    const email = extractEmailAddress(value);
    if (!email) continue;
    const key = email.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    ordered.push(email);
  }

  return ordered;
}

export function excludeMailboxAddresses(
  addresses: string[],
  mailboxEmail: string,
  extraExcluded: string[] = [],
) {
  const excluded = new Set(
    [mailboxEmail, ...extraExcluded]
      .map(normalizeEmailAddress)
      .filter(Boolean),
  );
  return addresses.filter((address) => !excluded.has(normalizeEmailAddress(address)));
}

export function resolveReplyTargetMessage(thread: EmailThread) {
  return (
    [...thread.messages].reverse().find((message) => message.direction === "inbound") ??
    thread.messages[thread.messages.length - 1] ??
    null
  );
}

export function resolveReplyToAddress(message: EmailMessage | null | undefined) {
  if (!message) return null;
  const replyTo = extractEmailAddress(message.replyToEmail);
  if (replyTo) return replyTo;
  return extractEmailAddress(message.fromEmail || message.from) || null;
}

export function resolveThreadReplyRecipient(thread: EmailThread, mailboxEmail: string) {
  const target = resolveReplyTargetMessage(thread);
  const replyTo = resolveReplyToAddress(target);
  if (replyTo && !isSameMailboxAddress(replyTo, mailboxEmail)) return replyTo;

  const last = thread.messages[thread.messages.length - 1];
  if (!last) return thread.fromEmail || null;

  const externalRecipient = last.to
    .map((entry) => extractEmailAddress(entry))
    .find((entry) => entry && !isSameMailboxAddress(entry, mailboxEmail));
  if (externalRecipient) return externalRecipient;

  const fromExternal = extractEmailAddress(last.fromEmail || last.from);
  if (fromExternal && !isSameMailboxAddress(fromExternal, mailboxEmail)) return fromExternal;

  return thread.fromEmail || null;
}

function collectParticipantAddresses(thread: EmailThread) {
  const addresses: string[] = [];

  for (const message of thread.messages) {
    addresses.push(extractEmailAddress(message.fromEmail || message.from));
    addresses.push(extractEmailAddress(message.replyToEmail));
    for (const entry of message.to) addresses.push(extractEmailAddress(entry));
    for (const entry of message.cc) addresses.push(extractEmailAddress(entry));
  }

  return uniqueEmailAddresses(addresses);
}

export function resolveReplyAllRecipients(thread: EmailThread, mailboxEmail: string) {
  const primary = resolveThreadReplyRecipient(thread, mailboxEmail);
  const participants = excludeMailboxAddresses(collectParticipantAddresses(thread), mailboxEmail);
  const cc = excludeMailboxAddresses(
    participants.filter((address) => !isSameMailboxAddress(address, primary)),
    mailboxEmail,
  );

  return {
    to: primary,
    cc,
  };
}

export function resolveForwardAllRecipients(thread: EmailThread, mailboxEmail: string) {
  const last = thread.messages[thread.messages.length - 1];
  if (!last) {
    return {
      to: excludeMailboxAddresses([thread.fromEmail], mailboxEmail),
      cc: [] as string[],
    };
  }

  const to = excludeMailboxAddresses(
    uniqueEmailAddresses([...last.to, thread.fromEmail, last.fromEmail || last.from]),
    mailboxEmail,
  );
  const cc = excludeMailboxAddresses(
    uniqueEmailAddresses(last.cc).filter((address) => !to.some((entry) => isSameMailboxAddress(entry, address))),
    mailboxEmail,
  );

  return { to, cc };
}

export function buildForwardQuotedBody(thread: EmailThread, message: EmailMessage | null | undefined) {
  const source = message ?? thread.messages[thread.messages.length - 1];
  if (!source) return "";

  const quoted = source.body?.trim() || source.snippet?.trim() || source.html?.replace(/<[^>]+>/g, " ").trim() || "";
  if (!quoted) return "";

  return `\n\n---------- Forwarded message ---------\nFrom: ${source.fromName ?? "Unknown"} <${source.fromEmail ?? ""}>\nDate: ${source.date}\nSubject: ${thread.subject}\n\n${quoted}`;
}

export function buildReplySubject(subject: string) {
  const trimmed = subject.trim();
  return trimmed.toLowerCase().startsWith("re:") ? trimmed : `Re: ${trimmed}`;
}

export function buildForwardSubject(subject: string) {
  const trimmed = subject.trim();
  return trimmed.toLowerCase().startsWith("fwd:") ? trimmed : `Fwd: ${trimmed}`;
}
