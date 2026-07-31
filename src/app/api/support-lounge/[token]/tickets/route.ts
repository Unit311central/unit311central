import { NextRequest, NextResponse } from "next/server";

import { ensureSupportLoungeSchema, withSupportLoungeSchema } from "@/lib/internal-db-migrations";
import { createLoungeTicketFromIntake } from "@/lib/support-lounge-chat";
import {
  getLoungeClientByToken,
  listLoungeOpenTicketsForClient,
  listLoungeTicketsForRequester,
} from "@/lib/support-lounge-service";
import {
  applyLoungeRequesterCookie,
  readOrCreateLoungeRequesterId,
} from "@/lib/support-lounge-session";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ token: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    const { token } = await context.params;
    await ensureSupportLoungeSchema();
    const lounge = await withSupportLoungeSchema(() => getLoungeClientByToken(token));
    if (!lounge) {
      return NextResponse.json({ error: "Support lounge not found." }, { status: 404 });
    }

    const session = await readOrCreateLoungeRequesterId(lounge.loungeToken);
    const [tickets, openTickets] = await withSupportLoungeSchema(() =>
      Promise.all([
        listLoungeTicketsForRequester({
          workspaceId: lounge.workspaceId,
          clientId: lounge.id,
          requesterAnonId: session.requesterAnonId,
        }),
        listLoungeOpenTicketsForClient({
          workspaceId: lounge.workspaceId,
          clientId: lounge.id,
        }),
      ]),
    );

    const headers = new Headers();
    if (session.setCookie) {
      applyLoungeRequesterCookie(headers, session.setCookie);
    }

    const mapTicket = (t: (typeof tickets)[number]) => ({
      id: t.id,
      status: t.status,
      priority: t.priority,
      description: t.description,
      name: t.name,
      requesterEmail: t.requesterEmail,
      requesterFirstName: t.requesterFirstName,
      requesterLastName: t.requesterLastName,
      requesterDepartment: t.requesterDepartment,
      requesterRole: t.requesterRole,
      ticketKind: t.ticketKind,
      ticketPublicToken: t.ticketPublicToken,
      ticketPublicUrl: t.ticketPublicUrl,
      resumePath: t.ticketPublicToken
        ? `/s/${encodeURIComponent(lounge.loungeToken)}/t/${encodeURIComponent(t.ticketPublicToken)}`
        : null,
      escalated: t.escalated,
      updatedAt: t.updatedAt,
      createdAt: t.createdAt,
      closed: t.closed,
      userAssigned: t.userAssigned,
    });

    return NextResponse.json(
      {
        tickets: tickets.map(mapTicket),
        openTickets: openTickets.map(mapTicket),
      },
      { headers },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list tickets";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    const { token } = await context.params;
    await ensureSupportLoungeSchema();
    const lounge = await withSupportLoungeSchema(() => getLoungeClientByToken(token));
    if (!lounge) {
      return NextResponse.json({ error: "Support lounge not found." }, { status: 404 });
    }

    const session = await readOrCreateLoungeRequesterId(lounge.loungeToken);
    const form = await request.formData();
    const files = form
      .getAll("files")
      .filter((entry): entry is File => entry instanceof File && entry.size > 0);

    const intake = {
      firstName: String(form.get("firstName") || "").trim(),
      lastName: String(form.get("lastName") || "").trim(),
      email: String(form.get("email") || "").trim(),
      department: String(form.get("department") || "").trim(),
      role: String(form.get("role") || "").trim(),
      ticketKind:
        String(form.get("ticketKind") || "new").trim() === "existing"
          ? ("existing" as const)
          : ("new" as const),
      existingTicketId: String(form.get("existingTicketId") || "").trim() || null,
      summary: String(form.get("summary") || "").trim() || undefined,
      description: String(form.get("description") || "").trim(),
    };

    const result = await withSupportLoungeSchema(() =>
      createLoungeTicketFromIntake({
        lounge,
        requesterAnonId: session.requesterAnonId,
        intake,
        files,
        origin: request.nextUrl.origin,
      }),
    );

    const headers = new Headers();
    if (session.setCookie) {
      applyLoungeRequesterCookie(headers, session.setCookie);
    }

    return NextResponse.json(result, { headers });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create ticket";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
