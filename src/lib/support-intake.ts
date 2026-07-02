import type { SupportTicket } from "@/lib/support-data";
import { createSupportTicket, updateSupportTicket } from "@/lib/support-tickets-service";
import {
  postAssignmentPromptToSupportChannel,
  postTicketToSupportChannel,
} from "@/lib/support-channel";
import {
  clearWhatsAppSupportSession,
  getWhatsAppSupportSession,
  upsertWhatsAppSupportSession,
  type WhatsAppSupportSessionStep,
} from "@/lib/support-whatsapp-session";
import {
  CLIENT_INTAKE_PROMPTS,
  isOpenTicketCommand,
  nextPromptForStep,
  parseClientPriorityAnswer,
} from "@/lib/support-intake-prompts";
import { isWhatsAppConfigured, normalizeWhatsAppPhone, sendWhatsAppMessage } from "@/lib/whatsapp/client";

export type WhatsAppIntakeOptions = {
  phone?: string | null;
  suppressWhatsApp?: boolean;
};

export type WhatsAppIntakeResult =
  | {
      mode: "step";
      step: WhatsAppSupportSessionStep;
      ticket: SupportTicket;
      reply: string;
      whatsappAck?: unknown;
    }
  | { mode: "submitted"; ticket: SupportTicket; reply: string; [key: string]: unknown }
  | { mode: "ignored"; reason: string; reply?: string };

function preserveClientAnswer(text: string) {
  return text.trim();
}

function requireClientAnswer(text: string, label: string) {
  const answer = preserveClientAnswer(text);
  if (!answer) {
    throw new Error(`Please enter your ${label}.`);
  }
  return answer;
}

function normalizeClientPhone(phone?: string | null) {
  if (!phone?.trim()) return null;
  return normalizeWhatsAppPhone(phone);
}

export function isSupportTicketWhatsAppCommand(text: string) {
  return isOpenTicketCommand(text);
}

async function maybeSendClientReply(
  text: string,
  phone?: string | null,
  suppressWhatsApp = false,
) {
  if (suppressWhatsApp || !isWhatsAppConfigured()) return null;
  try {
    return await sendWhatsAppMessage(text, phone ?? undefined);
  } catch (error) {
    console.error("[support/intake] WhatsApp send failed", error);
    return null;
  }
}

async function attachClientPhone(ticket: SupportTicket, phone?: string | null) {
  const clientPhone = normalizeClientPhone(phone);
  if (!clientPhone) return ticket;
  return updateSupportTicket(ticket.id, { clientPhone });
}

async function completeTicketIntake(
  ticket: SupportTicket,
  phone?: string | null,
  suppressWhatsApp = false,
) {
  ticket = await attachClientPhone(ticket, phone);
  const channelMessage = await postTicketToSupportChannel(ticket);
  const assignmentPrompt = await postAssignmentPromptToSupportChannel(ticket.id);
  await clearWhatsAppSupportSession(phone);
  const reply = CLIENT_INTAKE_PROMPTS.received;
  const whatsappAck = await maybeSendClientReply(reply, ticket.clientPhone ?? phone, suppressWhatsApp);

  return {
    channelMessage,
    assignmentPrompt,
    reply,
    whatsappAck,
  };
}

async function processOpenNewTicket(phone?: string | null, suppressWhatsApp = false) {
  const ticket = await createSupportTicket({
    name: "(collecting)",
    organisation: "",
    priority: "low",
    description: "",
    clientPhone: normalizeClientPhone(phone),
  });

  await upsertWhatsAppSupportSession({
    phone,
    ticketId: ticket.id,
    step: "awaiting_name",
  });

  const reply = CLIENT_INTAKE_PROMPTS.name;
  const whatsappAck = await maybeSendClientReply(reply, phone, suppressWhatsApp);

  return {
    mode: "step" as const,
    step: "awaiting_name" as const,
    ticket,
    reply,
    whatsappAck,
  };
}

async function processSessionStep(
  text: string,
  phone?: string | null,
  suppressWhatsApp = false,
): Promise<WhatsAppIntakeResult | null> {
  const session = await getWhatsAppSupportSession(phone);
  if (!session) return null;

  if (session.step === "awaiting_assignment") {
    await clearWhatsAppSupportSession(phone);
    return { mode: "ignored", reason: "already_submitted" };
  }

  const trimmed = preserveClientAnswer(text);

  if (session.step === "awaiting_name") {
    const name = requireClientAnswer(trimmed, "name");
    const ticket = await updateSupportTicket(session.ticketId, { name });
    await upsertWhatsAppSupportSession({
      phone,
      ticketId: ticket.id,
      step: "awaiting_organisation",
    });
    const reply = CLIENT_INTAKE_PROMPTS.organisation;
    const whatsappAck = await maybeSendClientReply(reply, phone, suppressWhatsApp);
    return {
      mode: "step",
      step: "awaiting_organisation",
      ticket,
      reply,
      whatsappAck,
    };
  }

  if (session.step === "awaiting_organisation") {
    const organisation = requireClientAnswer(trimmed, "organisation name");
    const ticket = await updateSupportTicket(session.ticketId, { organisation });
    await upsertWhatsAppSupportSession({
      phone,
      ticketId: ticket.id,
      step: "awaiting_priority",
    });
    const reply = CLIENT_INTAKE_PROMPTS.priority;
    const whatsappAck = await maybeSendClientReply(reply, phone, suppressWhatsApp);
    return {
      mode: "step",
      step: "awaiting_priority",
      ticket,
      reply,
      whatsappAck,
    };
  }

  if (session.step === "awaiting_priority") {
    const priorityAnswer = requireClientAnswer(trimmed, "priority");
    const priority = parseClientPriorityAnswer(priorityAnswer) ?? "medium";

    const ticket = await updateSupportTicket(session.ticketId, {
      priority,
      clientPriorityLabel: priorityAnswer,
    });
    await upsertWhatsAppSupportSession({
      phone,
      ticketId: ticket.id,
      step: "awaiting_description",
    });
    const reply = CLIENT_INTAKE_PROMPTS.description;
    const whatsappAck = await maybeSendClientReply(reply, phone, suppressWhatsApp);
    return {
      mode: "step",
      step: "awaiting_description",
      ticket,
      reply,
      whatsappAck,
    };
  }

  if (session.step === "awaiting_description") {
    const description = requireClientAnswer(trimmed, "problem description");
    const ticket = await updateSupportTicket(session.ticketId, { description });
    const completion = await completeTicketIntake(ticket, phone, suppressWhatsApp);
    return {
      mode: "submitted",
      ticket,
      ...completion,
    };
  }

  return null;
}

export async function processSupportTicketFromWhatsApp(
  text: string,
  options: WhatsAppIntakeOptions = {},
): Promise<WhatsAppIntakeResult> {
  const phone = options.phone ?? null;
  const trimmed = text.trim();
  if (!trimmed) {
    return { mode: "ignored", reason: "empty_message" };
  }

  const normalized = preserveClientAnswer(trimmed).replace(/\s+/g, " ");

  const suppressWhatsApp = options.suppressWhatsApp ?? false;

  if (isOpenTicketCommand(normalized)) {
    return processOpenNewTicket(phone, suppressWhatsApp);
  }

  const sessionResult = await processSessionStep(normalized, phone, suppressWhatsApp);
  if (sessionResult) {
    return sessionResult;
  }

  const session = await getWhatsAppSupportSession(phone);
  if (session) {
    const hint = nextPromptForStep(session.step);
    throw new Error(hint ? `Please answer: ${hint}` : "Unexpected message for the current ticket step.");
  }

  return {
    mode: "ignored",
    reason: "not_a_ticket_command",
    reply: 'Start the flow by typing "Open new ticket".',
  };
}
