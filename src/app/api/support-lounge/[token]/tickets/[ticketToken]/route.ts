import { NextRequest, NextResponse } from "next/server";

import { ensureSupportLoungeSchema, withSupportLoungeSchema } from "@/lib/internal-db-migrations";
import {
  getLoungeClientByToken,
  getLoungeTicketByPublicToken,
  listLoungeMessages,
} from "@/lib/support-lounge-service";
import {
  applyLoungeRequesterCookie,
  readOrCreateLoungeRequesterId,
} from "@/lib/support-lounge-session";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ token: string; ticketToken: string }> };

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

    const messages = await withSupportLoungeSchema(() =>
      listLoungeMessages({
        workspaceId: lounge.workspaceId,
        ticketId: ticket.id,
      }),
    );

    const headers = new Headers();
    if (session.setCookie) {
      applyLoungeRequesterCookie(headers, session.setCookie);
    }

    return NextResponse.json(
      {
        ticket: {
          id: ticket.id,
          status: ticket.status,
          priority: ticket.priority,
          description: ticket.description,
          ticketPublicToken: ticket.ticketPublicToken,
          escalated: ticket.escalated,
          closed: ticket.closed,
          updatedAt: ticket.updatedAt,
          createdAt: ticket.createdAt,
        },
        messages,
      },
      { headers },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load ticket";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
