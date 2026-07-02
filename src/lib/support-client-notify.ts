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

export async function notifyClientTicketAssigned(ticket: SupportTicket, assignee: string) {
  if (!isWhatsAppConfigured()) return null;

  const phone = resolveTicketClientPhone(ticket);
  const label = formatAssigneeForClient(assignee);

  try {
    return await sendWhatsAppMessage(formatSupportTicketClientAssignedMessage(ticket.id, label), phone);
  } catch (error) {
    console.error("[support/notify] client assignment WhatsApp failed", error);
    return null;
  }
}

export async function notifyClientTicketUpdate(ticket: SupportTicket, message: string) {
  const trimmed = message.trim();
  if (!trimmed) return null;
  if (!isWhatsAppConfigured()) return null;

  const phone = resolveTicketClientPhone(ticket);

  try {
    return await sendWhatsAppMessage(trimmed, phone);
  } catch (error) {
    console.error("[support/notify] client update WhatsApp failed", error);
    return null;
  }
}

export async function notifyClientTicketClosed(ticket: SupportTicket) {
  if (!isWhatsAppConfigured()) return null;

  const phone = resolveTicketClientPhone(ticket);

  try {
    return await sendWhatsAppMessage(formatSupportTicketClosedMessage(ticket.id), phone);
  } catch (error) {
    console.error("[support/notify] client close WhatsApp failed", error);
    return null;
  }
}
