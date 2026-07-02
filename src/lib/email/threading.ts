import type { EmailMessage, EmailThreadStatus } from "@/lib/email/types";

function normalizeSubject(subject: string) {
  return subject.replace(/^(re|fwd?):\s*/gi, "").trim().toLowerCase();
}

export type EmailThread = {
  id: string;
  subject: string;
  fromName: string;
  fromEmail: string;
  receivedAt: string;
  lastActivityAt: string;
  status: EmailThreadStatus;
  unread: boolean;
  replyCount: number;
  messages: EmailMessage[];
};

export function groupMessagesIntoThreads(messages: EmailMessage[]): EmailThread[] {
  const groups = new Map<string, EmailMessage[]>();

  for (const message of messages) {
    const threadKey =
      message.references[0] ??
      message.inReplyTo ??
      message.messageId ??
      `${normalizeSubject(message.subject)}:${message.fromEmail}`;
    const bucket = groups.get(threadKey) ?? [];
    bucket.push(message);
    groups.set(threadKey, bucket);
  }

  return [...groups.entries()]
    .map(([threadId, threadMessages]) => {
      const sorted = [...threadMessages].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      );
      const firstInbound =
        sorted.find((entry) => entry.direction === "inbound") ?? sorted[0];
      const last = sorted[sorted.length - 1];
      const unread = sorted.some((entry) => entry.unread && entry.direction === "inbound");
      const hasOutboundReply = sorted.some((entry) => entry.direction === "outbound");
      const awaitingReply = !unread && last.direction === "inbound";
      const replied = hasOutboundReply && last.direction === "outbound";

      let status: EmailThreadStatus = "open";
      if (unread) status = "unread";
      else if (replied) status = "replied";
      else if (awaitingReply) status = "open";

      return {
        id: threadId,
        subject: firstInbound?.subject ?? sorted[0]?.subject ?? "(No subject)",
        fromName: firstInbound?.fromName ?? sorted[0]?.fromName ?? "Unknown",
        fromEmail: firstInbound?.fromEmail ?? sorted[0]?.fromEmail ?? "",
        receivedAt: firstInbound?.date ?? sorted[0]?.date ?? new Date().toISOString(),
        lastActivityAt: last?.date ?? sorted[0]?.date ?? new Date().toISOString(),
        status,
        unread,
        replyCount: sorted.filter((entry) => entry.direction === "outbound").length,
        messages: sorted,
      };
    })
    .sort((a, b) => new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime());
}
