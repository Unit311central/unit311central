import type { SupportTicket } from "@/lib/support-data";
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
    });
    return true;
  } catch (error) {
    console.warn("[support/notify] requester email failed:", error);
    return false;
  }
}

export async function notifyClientTicketAssigned(ticket: SupportTicket, assignee: string) {
  const label = formatAssigneeForClient(assignee);
  const caseUrl = ticket.ticketPublicUrl?.trim() || "";
  const emailed = await emailTicketRequester({
    ticket,
    subject: `Ticket ${ticket.id} assigned — Demo Support`,
    text: [
      `Your support ticket ${ticket.id} has been assigned to ${label}.`,
      "",
      caseUrl ? `Track updates here: ${caseUrl}` : null,
      "",
      "— Demo Support",
    ]
      .filter((line) => line !== null)
      .join("\n"),
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
  scope?: { workspaceId?: string | null },
) {
  const trimmed = message.trim();
  if (!trimmed) return null;

  const caseUrl = ticket.ticketPublicUrl?.trim() || "";
  const emailed = await emailTicketRequester({
    ticket,
    workspaceId: scope?.workspaceId,
    subject: `Update on ticket ${ticket.id} — Demo Support`,
    text: [
      `Update on your support ticket ${ticket.id}:`,
      "",
      trimmed,
      "",
      caseUrl ? `View your case: ${caseUrl}` : null,
      "",
      "— Demo Support",
    ]
      .filter((line) => line !== null)
      .join("\n"),
  });

  if (ticket.id && scope?.workspaceId) {
    try {
      const { appendLoungeMessage } = await import("@/lib/support-lounge-service");
      await appendLoungeMessage({
        workspaceId: scope.workspaceId,
        ticketId: ticket.id,
        role: "operator",
        content: trimmed,
      });
    } catch (error) {
      console.warn("[support/notify] lounge message append failed:", error);
    }
  }

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
  const emailed = await emailTicketRequester({
    ticket,
    workspaceId: scope?.workspaceId,
    subject: `Ticket ${ticket.id} closed — Demo Support`,
    text: [
      `Your support ticket ${ticket.id} has been closed.`,
      note ? "" : null,
      note ? `Closing notes: ${note}` : null,
      "",
      caseUrl ? `Case history: ${caseUrl}` : null,
      "",
      "— Demo Support",
    ]
      .filter((line) => line !== null)
      .join("\n"),
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
    console.error("[support/notify] client close WhatsApp failed", error);
    return { ok: emailed, emailed, whatsappSent: false };
  }
}
