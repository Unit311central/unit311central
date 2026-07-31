import { DEMO_SITE_URL } from "@/lib/app-domains";
import type { SupportTicketPriority } from "@/lib/support-data";
import {
  appendLoungeMessage,
  createLoungeTicket,
  escalateLoungeTicket,
  getLoungeTicketByPublicToken,
  listLoungeOpenTicketsForClient,
  listLoungeTicketsForRequester,
  sendLoungeTicketDeskNotifyEmail,
  sendLoungeTicketSummaryEmail,
  uploadLoungeAttachment,
  type SupportLoungeClient,
} from "@/lib/support-lounge-service";

export type LoungeChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type LoungeIntakePayload = {
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  role: string;
  ticketKind: "new" | "existing";
  existingTicketId?: string | null;
  summary?: string;
  description: string;
  priority?: SupportTicketPriority;
};

export type LoungeChatResult = {
  reply: string;
  ticketId?: string;
  ticketPublicToken?: string;
  resumePath?: string;
  resumeUrl?: string;
  escalated?: boolean;
};

function looksLikeEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function parseName(raw: string) {
  const parts = raw.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

/** Fast deterministic intake — no LLM. Used for guided lounge create. */
export async function createLoungeTicketFromIntake(input: {
  lounge: SupportLoungeClient;
  requesterAnonId: string;
  intake: LoungeIntakePayload;
  files?: File[];
  origin?: string | null;
}): Promise<LoungeChatResult> {
  const firstName = input.intake.firstName.trim();
  const lastName = input.intake.lastName.trim();
  const email = input.intake.email.trim();
  const department = input.intake.department.trim();
  const role = input.intake.role.trim();
  const description = input.intake.description.trim();
  const ticketKind = input.intake.ticketKind === "existing" ? "existing" : "new";

  const missing = [
    !firstName ? "first name" : null,
    !email || !looksLikeEmail(email) ? "company email" : null,
    !department ? "department" : null,
    !role ? "role" : null,
    !description ? "problem description" : null,
  ].filter(Boolean);

  if (missing.length > 0) {
    return { reply: `Before I open the ticket I still need your ${missing.join(", ")}.` };
  }

  if (ticketKind === "existing" && input.intake.existingTicketId?.trim()) {
    const wantedId = input.intake.existingTicketId.trim().toUpperCase();
    const openForClient = await listLoungeOpenTicketsForClient({
      workspaceId: input.lounge.workspaceId,
      clientId: input.lounge.id,
    });
    const existing =
      openForClient.find((t) => t.id.toUpperCase() === wantedId) ||
      (
        await listLoungeTicketsForRequester({
          workspaceId: input.lounge.workspaceId,
          clientId: input.lounge.id,
          requesterAnonId: input.requesterAnonId,
        })
      ).find((t) => t.id.toUpperCase() === wantedId);

    if (existing?.ticketPublicToken) {
      await appendLoungeMessage({
        workspaceId: input.lounge.workspaceId,
        ticketId: existing.id,
        role: "user",
        content: description,
      });
      await appendLoungeMessage({
        workspaceId: input.lounge.workspaceId,
        ticketId: existing.id,
        role: "assistant",
        content:
          "Thanks — I've added that update to your existing case. Our Demo support team can see it.",
      });

      try {
        const { ensureClientSupportChannel } = await import("@/lib/support-channel");
        const { sendMessage } = await import("@/lib/internal-messaging-service");
        const channel = await ensureClientSupportChannel({
          companyName: input.lounge.companyName,
          clientId: input.lounge.id,
          scope: { workspaceId: input.lounge.workspaceId },
        });
        await sendMessage(
          {
            operatorId: "lounge:update",
            operatorName: "Support Lounge",
            username: "lounge",
            content: [
              `Client update on ${existing.id}`,
              `${input.lounge.companyName} · ${[firstName, lastName].filter(Boolean).join(" ")}`,
              description,
            ].join("\n"),
            room: channel.room,
            messageType: "text",
          },
          { workspaceId: input.lounge.workspaceId },
        );
      } catch {
        // non-fatal
      }

      const origin = (input.origin || DEMO_SITE_URL).replace(/\/$/, "");
      const resumePath = `/s/${encodeURIComponent(input.lounge.loungeToken)}/t/${encodeURIComponent(existing.ticketPublicToken)}`;
      return {
        reply: [
          `I've added your update to ${existing.id}.`,
          "",
          "Track the case here:",
          `${origin}${resumePath}`,
        ].join("\n"),
        ticketId: existing.id,
        ticketPublicToken: existing.ticketPublicToken,
        resumePath,
        resumeUrl: `${origin}${resumePath}`,
      };
    }
  }

  const profileLines = [
    `Name: ${[firstName, lastName].filter(Boolean).join(" ")}`,
    `Email: ${email}`,
    `Department: ${department}`,
    `Role: ${role}`,
    `Ticket type: ${ticketKind}`,
  ];

  const created = await createLoungeTicket({
    lounge: input.lounge,
    requesterAnonId: input.requesterAnonId,
    summary: (input.intake.summary || description).slice(0, 80),
    description: `${profileLines.join("\n")}\n\n${description}`,
    priority: ["low", "medium", "high", "urgent"].includes(String(input.intake.priority))
      ? input.intake.priority
      : "medium",
    requesterName: [firstName, lastName].filter(Boolean).join(" "),
    requesterEmail: email,
    requesterFirstName: firstName,
    requesterLastName: lastName || null,
    requesterDepartment: department,
    requesterRole: role,
    ticketKind,
  });

  for (const file of input.files || []) {
    try {
      await uploadLoungeAttachment({
        workspaceId: input.lounge.workspaceId,
        ticketId: created.ticket.id,
        file,
      });
    } catch (error) {
      console.warn("[support-lounge] attachment upload failed:", error);
    }
  }

  const origin = (input.origin || DEMO_SITE_URL).replace(/\/$/, "");
  const resumeUrl = `${origin}${created.resumePath}`;

  const emailed = await sendLoungeTicketSummaryEmail({
    lounge: input.lounge,
    ticket: created.ticket,
    resumeUrl,
  });
  const deskEmailed = await sendLoungeTicketDeskNotifyEmail({
    lounge: input.lounge,
    ticket: created.ticket,
    resumeUrl,
  });

  const reply = [
    `Ticket ${created.ticket.id} is open.`,
    "Our Demo support team has been notified and will begin working on the case.",
    emailed ? `I've emailed a summary to ${email}.` : null,
    deskEmailed ? "I've also notified the Demo support inbox." : null,
    "",
    "Track updates and add more information anytime here:",
    resumeUrl,
  ]
    .filter((line) => line !== null)
    .join("\n");

  await appendLoungeMessage({
    workspaceId: input.lounge.workspaceId,
    ticketId: created.ticket.id,
    role: "assistant",
    content: reply,
  });

  return {
    reply,
    ticketId: created.ticket.id,
    ticketPublicToken: created.ticket.ticketPublicToken || undefined,
    resumePath: created.resumePath,
    resumeUrl,
  };
}

/**
 * Lightweight chat after a ticket exists (human request / freeform).
 * Intake create should use createLoungeTicketFromIntake (no OpenAI).
 */
export async function runSupportLoungeChat(input: {
  lounge: SupportLoungeClient;
  requesterAnonId: string;
  history: LoungeChatMessage[];
  userMessage: string;
  activeTicketPublicToken?: string | null;
  origin?: string | null;
}): Promise<LoungeChatResult> {
  const text = input.userMessage.trim();
  const lower = text.toLowerCase();

  // Deterministic short-path for human help / updates — avoid OpenAI latency.
  if (
    /\b(human|person|agent|operator|speak to|talk to)\b/i.test(lower) &&
    input.activeTicketPublicToken
  ) {
    const ticket = await getLoungeTicketByPublicToken({
      workspaceId: input.lounge.workspaceId,
      clientId: input.lounge.id,
      ticketPublicToken: input.activeTicketPublicToken,
    });
    if (ticket) {
      const updated = await escalateLoungeTicket({
        lounge: input.lounge,
        ticket,
        note: text,
      });
      const reply = `I've flagged ${updated.id} for a human operator. They'll continue from here.`;
      await appendLoungeMessage({
        workspaceId: input.lounge.workspaceId,
        ticketId: updated.id,
        role: "assistant",
        content: reply,
      });
      return {
        reply,
        ticketId: updated.id,
        ticketPublicToken: updated.ticketPublicToken || input.activeTicketPublicToken,
        escalated: true,
      };
    }
  }

  if (input.activeTicketPublicToken) {
    const ticket = await getLoungeTicketByPublicToken({
      workspaceId: input.lounge.workspaceId,
      clientId: input.lounge.id,
      ticketPublicToken: input.activeTicketPublicToken,
    });
    if (ticket) {
      await appendLoungeMessage({
        workspaceId: input.lounge.workspaceId,
        ticketId: ticket.id,
        role: "user",
        content: text,
      });

      try {
        const { ensureClientSupportChannel } = await import("@/lib/support-channel");
        const { sendMessage } = await import("@/lib/internal-messaging-service");
        const channel = await ensureClientSupportChannel({
          companyName: input.lounge.companyName,
          clientId: input.lounge.id,
          scope: { workspaceId: input.lounge.workspaceId },
        });
        await sendMessage(
          {
            operatorId: "lounge:update",
            operatorName: "Support Lounge",
            username: "lounge",
            content: [`Client message on ${ticket.id}`, text].join("\n"),
            room: channel.room,
            messageType: "text",
          },
          { workspaceId: input.lounge.workspaceId },
        );
      } catch {
        // non-fatal
      }

      const reply =
        "Thanks — I've added that to the case and notified the Demo support team.";
      await appendLoungeMessage({
        workspaceId: input.lounge.workspaceId,
        ticketId: ticket.id,
        role: "assistant",
        content: reply,
      });
      return {
        reply,
        ticketId: ticket.id,
        ticketPublicToken: ticket.ticketPublicToken || input.activeTicketPublicToken,
      };
    }
  }

  // Fallback: guide back to structured intake (instant, no LLM).
  const { firstName } = parseName(text);
  if (!firstName) {
    return { reply: "What is your first and last name?" };
  }
  return {
    reply:
      "Thanks. Please use the guided steps on this page (or refresh) to finish opening your ticket — it's quicker than freeform chat.",
  };
}
