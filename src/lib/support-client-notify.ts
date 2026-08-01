import type { SupportTicket } from "@/lib/support-data";
import { SUPPORT_DESK_NOTIFY_EMAIL, buildSupportEmail } from "@/lib/support-email-html";
import {
  formatSupportTicketClientAssignedMessage,
  formatSupportTicketClosedMessage,
  getWhatsAppNotifyPhone,
  isWhatsAppConfigured,
  normalizeWhatsAppPhone,
  sendWhatsAppMessage,
} from "@/lib/whatsapp/client";

export function resolveTicketClientPhone(ticket: SupportTicket) {
  return normalizeWhatsAppPhone(ticket.clientPhone ?? getWhatsAppNotifyPhone());
}

export function formatAssigneeForClient(assignee: string) {
  return assignee.trim().replace(/\s+/g, "");
}

async function emailTicketRequester(input: {
  ticket: SupportTicket;
  subject: string;
  text: string;
  html?: string;
  workspaceId?: string | null;
}) {
  const to = input.ticket.requesterEmail?.trim();
  if (!to || !to.includes("@")) return false;
  try {
    const { sendMailboxEmail } = await import("@/lib/email/smtp");
    await sendMailboxEmail({
      account: "demo",
      workspaceId: input.workspaceId || undefined,
      to,
      subject: input.subject,
      text: input.text,
      html: input.html,
    });
    return true;
  } catch (error) {
    console.warn("[support/notify] requester email failed:", error);
    return false;
  }
}

async function emailDeskCopy(input: {
  ticket: SupportTicket;
  subject: string;
  text: string;
  html?: string;
  workspaceId?: string | null;
}) {
  try {
    const { sendMailboxEmail } = await import("@/lib/email/smtp");
    await sendMailboxEmail({
      account: "demo",
      workspaceId: input.workspaceId || undefined,
      to: SUPPORT_DESK_NOTIFY_EMAIL,
      subject: input.subject,
      text: input.text,
      html: input.html,
    });
    return true;
  } catch (error) {
    console.warn("[support/notify] desk email failed:", error);
    return false;
  }
}

async function echoUpdateToSupportChannel(
  ticket: SupportTicket,
  message: string,
  scope?: { workspaceId?: string | null },
  operatorName?: string | null,
) {
  if (!scope?.workspaceId) return;
  try {
    const { ensureClientSupportChannel } = await import("@/lib/support-channel");
    const { sendMessage } = await import("@/lib/internal-messaging-service");
    const channel = await ensureClientSupportChannel({
      companyName: ticket.organisation || "Client",
      clientId: ticket.clientId,
      scope: { workspaceId: scope.workspaceId },
    });
    const who = operatorName?.trim() || "Demo Support";
    await sendMessage(
      {
        operatorId: "support:client-update",
        operatorName: who,
        username: "support",
        content: [`[${ticket.id}] Update sent to client`, "", message].join("\n"),
        room: channel.room,
        messageType: "text",
      },
      { workspaceId: scope.workspaceId },
    );
  } catch (error) {
    console.warn("[support/notify] channel echo failed:", error);
  }
}

export async function notifyClientTicketAssigned(ticket: SupportTicket, assignee: string) {
  const label = formatAssigneeForClient(assignee);
  const caseUrl = ticket.ticketPublicUrl?.trim() || "";
  const email = buildSupportEmail({
    title: `Ticket ${ticket.id} assigned`,
    intro: `Your support ticket ${ticket.id} has been assigned to ${label}.`,
    ctaLabel: "Track your case",
    ctaUrl: caseUrl || undefined,
  });
  const emailed = await emailTicketRequester({
    ticket,
    subject: `Ticket ${ticket.id} assigned — Demo Support`,
    text: email.text,
    html: email.html,
  });

  if (!isWhatsAppConfigured()) return emailed ? { ok: true, emailed: true } : null;

  const phone = resolveTicketClientPhone(ticket);
  try {
    const whatsapp = await sendWhatsAppMessage(
      formatSupportTicketClientAssignedMessage(ticket.id, label),
      phone,
    );
    return { ...whatsapp, emailed };
  } catch (error) {
    console.error("[support/notify] client assignment WhatsApp failed", error);
    return emailed ? { ok: true, emailed: true } : null;
  }
}

export async function notifyClientTicketUpdate(
  ticket: SupportTicket,
  message: string,
  scope?: { workspaceId?: string | null; operatorName?: string | null },
) {
  const trimmed = message.trim();
  if (!trimmed) return null;

  const caseUrl = ticket.ticketPublicUrl?.trim() || "";
  const who = scope?.operatorName?.trim() || "Demo Support";
  const loungeContent = `Hi, my name is ${who} and I am a real person from Demo Support.\n\n${trimmed}`;
  const email = buildSupportEmail({
    preheader: `Update on ${ticket.id}`,
    title: `Update on ticket ${ticket.id}`,
    intro: `${who} sent an update on your support case.`,
    body: trimmed,
    ctaLabel: "Open your case",
    ctaUrl: caseUrl || undefined,
  });

  const emailed = await emailTicketRequester({
    ticket,
    workspaceId: scope?.workspaceId,
    subject: `Update on ticket ${ticket.id} — Demo Support`,
    text: email.text,
    html: email.html,
  });

  await emailDeskCopy({
    ticket,
    workspaceId: scope?.workspaceId,
    subject: `Client update on ${ticket.id} — ${ticket.organisation || "Client"}`,
    text: email.text,
    html: email.html,
  });

  if (ticket.id && scope?.workspaceId) {
    try {
      const { appendLoungeMessage } = await import("@/lib/support-lounge-service");
      await appendLoungeMessage({
        workspaceId: scope.workspaceId,
        ticketId: ticket.id,
        role: "operator",
        content: loungeContent,
      });
    } catch (error) {
      console.warn("[support/notify] lounge message append failed:", error);
    }
  }

  await echoUpdateToSupportChannel(ticket, trimmed, scope, who);

  if (!isWhatsAppConfigured()) {
    return { ok: true, emailed, whatsappSent: false };
  }

  const phone = resolveTicketClientPhone(ticket);
  try {
    const whatsapp = await sendWhatsAppMessage(trimmed, phone);
    return { ok: Boolean(whatsapp?.ok), emailed, whatsappSent: Boolean(whatsapp?.ok) };
  } catch (error) {
    console.error("[support/notify] client update WhatsApp failed", error);
    return { ok: emailed, emailed, whatsappSent: false };
  }
}

export async function notifyClientTicketClosed(
  ticket: SupportTicket,
  notes?: string,
  scope?: { workspaceId?: string | null },
) {
  const caseUrl = ticket.ticketPublicUrl?.trim() || "";
  const note = notes?.trim();
  const email = buildSupportEmail({
    title: `Ticket ${ticket.id} closed`,
    intro: `Your support ticket ${ticket.id} has been closed.`,
    body: note ? `Closing notes:\n${note}` : undefined,
    ctaLabel: "View case history",
    ctaUrl: caseUrl || undefined,
  });
  const emailed = await emailTicketRequester({
    ticket,
    workspaceId: scope?.workspaceId,
    subject: `Ticket ${ticket.id} closed — Demo Support`,
    text: email.text,
    html: email.html,
  });

  await emailDeskCopy({
    ticket,
    workspaceId: scope?.workspaceId,
    subject: `Ticket closed ${ticket.id} — ${ticket.organisation || "Client"}`,
    text: email.text,
    html: email.html,
  });

  if (scope?.workspaceId) {
    try {
      const { appendLoungeMessage } = await import("@/lib/support-lounge-service");
      await appendLoungeMessage({
        workspaceId: scope.workspaceId,
        ticketId: ticket.id,
        role: "operator",
        content: note ? `Ticket closed.\n\n${note}` : "Ticket closed by Demo support.",
      });
    } catch (error) {
      console.warn("[support/notify] lounge close message failed:", error);
    }
  }

  if (!isWhatsAppConfigured()) {
    return { ok: true, emailed, whatsappSent: false };
  }

  const phone = resolveTicketClientPhone(ticket);
  try {
    const whatsapp = await sendWhatsAppMessage(formatSupportTicketClosedMessage(ticket.id), phone);
    return { ok: Boolean(whatsapp?.ok), emailed, whatsappSent: Boolean(whatsapp?.ok) };
  } catch (error) {
    console.error("[support/notify] client closed WhatsApp failed", error);
    return { ok: emailed, emailed, whatsappSent: false };
  }
}

export async function notifyClientTicketCancelled(
  ticket: SupportTicket,
  reason?: string,
  scope?: { workspaceId?: string | null },
) {
  const caseUrl = ticket.ticketPublicUrl?.trim() || "";
  const note = reason?.trim();
  const email = buildSupportEmail({
    title: `Ticket ${ticket.id} cancelled`,
    intro: `Your support ticket ${ticket.id} has been cancelled.`,
    body: note ? `Reason:\n${note}` : undefined,
    ctaLabel: "View case history",
    ctaUrl: caseUrl || undefined,
  });
  const emailed = await emailTicketRequester({
    ticket,
    workspaceId: scope?.workspaceId,
    subject: `Ticket ${ticket.id} cancelled — Demo Support`,
    text: email.text,
    html: email.html,
  });

  await emailDeskCopy({
    ticket,
    workspaceId: scope?.workspaceId,
    subject: `Ticket cancelled ${ticket.id} — ${ticket.organisation || "Client"}`,
    text: email.text,
    html: email.html,
  });

  if (scope?.workspaceId) {
    try {
      const { appendLoungeMessage } = await import("@/lib/support-lounge-service");
      await appendLoungeMessage({
        workspaceId: scope.workspaceId,
        ticketId: ticket.id,
        role: "user",
        content: note
          ? `Ticket cancelled by requester.\n\n${note}`
          : "Ticket cancelled by requester.",
      });
      await appendLoungeMessage({
        workspaceId: scope.workspaceId,
        ticketId: ticket.id,
        role: "assistant",
        content:
          "This ticket is cancelled and archived. Contact Demo Support if you need a new case.",
      });
    } catch (error) {
      console.warn("[support/notify] lounge cancel message failed:", error);
    }
  }

  return { ok: true, emailed, whatsappSent: false };
}
