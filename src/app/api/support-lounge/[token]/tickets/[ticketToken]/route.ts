import { NextRequest, NextResponse } from "next/server";

import { ensureSupportLoungeSchema, withSupportLoungeSchema } from "@/lib/internal-db-migrations";
import {
  appendLoungeMessage,
  getLoungeClientByToken,
  getLoungeTicketByPublicToken,
  listLoungeAttachments,
  listLoungeMessages,
  uploadLoungeAttachment,
} from "@/lib/support-lounge-service";
import {
  applyLoungeRequesterCookie,
  readOrCreateLoungeRequesterId,
} from "@/lib/support-lounge-session";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ token: string; ticketToken: string }> };

function ticketPayload(
  ticket: NonNullable<Awaited<ReturnType<typeof getLoungeTicketByPublicToken>>>,
  loungeToken: string,
) {
  return {
    id: ticket.id,
    status: ticket.status,
    priority: ticket.priority,
    description: ticket.description,
    name: ticket.name,
    organisation: ticket.organisation,
    requesterEmail: ticket.requesterEmail,
    requesterFirstName: ticket.requesterFirstName,
    requesterLastName: ticket.requesterLastName,
    requesterDepartment: ticket.requesterDepartment,
    requesterRole: ticket.requesterRole,
    ticketKind: ticket.ticketKind,
    ticketPublicToken: ticket.ticketPublicToken,
    ticketPublicUrl: ticket.ticketPublicUrl,
    resumePath: ticket.ticketPublicToken
      ? `/s/${encodeURIComponent(loungeToken)}/t/${encodeURIComponent(ticket.ticketPublicToken)}`
      : null,
    escalated: ticket.escalated,
    closed: ticket.closed,
    userAssigned: ticket.userAssigned,
    updatedAt: ticket.updatedAt,
    createdAt: ticket.createdAt,
  };
}

export async function GET(_request: NextRequest, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    const { token, ticketToken } = await context.params;
    await ensureSupportLoungeSchema();
    const lounge = await withSupportLoungeSchema(() => getLoungeClientByToken(token));
    if (!lounge) {
      return NextResponse.json({ error: "Support lounge not found." }, { status: 404 });
    }

    const session = await readOrCreateLoungeRequesterId(lounge.loungeToken);
    const ticket = await withSupportLoungeSchema(() =>
      getLoungeTicketByPublicToken({
        workspaceId: lounge.workspaceId,
        clientId: lounge.id,
        ticketPublicToken: ticketToken,
      }),
    );
    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
    }

    const [messages, attachments] = await Promise.all([
      withSupportLoungeSchema(() =>
        listLoungeMessages({
          workspaceId: lounge.workspaceId,
          ticketId: ticket.id,
        }),
      ),
      withSupportLoungeSchema(() =>
        listLoungeAttachments({
          workspaceId: lounge.workspaceId,
          ticketId: ticket.id,
        }),
      ).catch(() => []),
    ]);

    const headers = new Headers();
    if (session.setCookie) {
      applyLoungeRequesterCookie(headers, session.setCookie);
    }

    return NextResponse.json(
      {
        ticket: ticketPayload(ticket, lounge.loungeToken),
        messages,
        attachments,
      },
      { headers },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load ticket";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    const { token, ticketToken } = await context.params;
    const contentType = request.headers.get("content-type") || "";
    await ensureSupportLoungeSchema();
    const lounge = await withSupportLoungeSchema(() => getLoungeClientByToken(token));
    if (!lounge) {
      return NextResponse.json({ error: "Support lounge not found." }, { status: 404 });
    }

    const session = await readOrCreateLoungeRequesterId(lounge.loungeToken);
    const ticket = await withSupportLoungeSchema(() =>
      getLoungeTicketByPublicToken({
        workspaceId: lounge.workspaceId,
        clientId: lounge.id,
        ticketPublicToken: ticketToken,
      }),
    );
    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
    }

    const headers = new Headers();
    if (session.setCookie) {
      applyLoungeRequesterCookie(headers, session.setCookie);
    }

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const file = form.get("file");
      if (!(file instanceof File) || file.size === 0) {
        return NextResponse.json({ error: "A file is required." }, { status: 400 });
      }
      const attachment = await withSupportLoungeSchema(() =>
        uploadLoungeAttachment({
          workspaceId: lounge.workspaceId,
          ticketId: ticket.id,
          file,
        }),
      );
      const messages = await withSupportLoungeSchema(() =>
        listLoungeMessages({
          workspaceId: lounge.workspaceId,
          ticketId: ticket.id,
        }),
      );
      return NextResponse.json({ attachment, messages, ticket: ticketPayload(ticket, lounge.loungeToken) }, { headers });
    }

    const body = (await request.json()) as { note?: string };
    const note = body.note?.trim();
    if (!note) {
      return NextResponse.json({ error: "Note is required." }, { status: 400 });
    }
    if (note.length > 4000) {
      return NextResponse.json({ error: "Note is too long." }, { status: 400 });
    }

    await withSupportLoungeSchema(() =>
      appendLoungeMessage({
        workspaceId: lounge.workspaceId,
        ticketId: ticket.id,
        role: "user",
        content: note,
      }),
    );
    await withSupportLoungeSchema(() =>
      appendLoungeMessage({
        workspaceId: lounge.workspaceId,
        ticketId: ticket.id,
        role: "assistant",
        content:
          "Thanks — I've added that to the case. Our Demo support team can see the update.",
      }),
    );

    try {
      const { ensureClientSupportChannel } = await import("@/lib/support-channel");
      const { sendMessage } = await import("@/lib/internal-messaging-service");
      const channel = await ensureClientSupportChannel({
        companyName: lounge.companyName,
        clientId: lounge.id,
        scope: { workspaceId: lounge.workspaceId },
      });
      await sendMessage(
        {
          operatorId: "lounge:update",
          operatorName: "Support Lounge",
          username: "lounge",
          content: [`Client update on ${ticket.id}`, note].join("\n"),
          room: channel.room,
          messageType: "text",
        },
        { workspaceId: lounge.workspaceId },
      );
    } catch (notifyError) {
      console.warn("[support-lounge] update channel notify failed:", notifyError);
    }

    const messages = await withSupportLoungeSchema(() =>
      listLoungeMessages({
        workspaceId: lounge.workspaceId,
        ticketId: ticket.id,
      }),
    );

    return NextResponse.json(
      { ok: true, messages, ticket: ticketPayload(ticket, lounge.loungeToken) },
      { headers },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update ticket";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
