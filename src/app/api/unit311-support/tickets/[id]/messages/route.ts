import { NextRequest, NextResponse } from "next/server";

import {
  requireCustomerUnit311SupportApiContext,
  unit311SupportErrorResponse,
} from "@/lib/unit311-support/api-helpers";
import {
  appendUnit311SupportMessage,
  getUnit311SupportTicketForOrganisation,
} from "@/lib/unit311-support/service";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const ctx = await requireCustomerUnit311SupportApiContext();
    const existing = await getUnit311SupportTicketForOrganisation(id, ctx.organisationId);
    if (!existing) {
      return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
    }

    const body = (await request.json()) as { body?: string };
    const message = String(body.body ?? "").trim();
    if (!message) {
      return NextResponse.json({ error: "Message body is required." }, { status: 400 });
    }

    await appendUnit311SupportMessage({
      ticketId: id,
      authorKind: "customer",
      authorUserId: ctx.actor.userId,
      authorName: ctx.actor.displayName,
      body: message,
      statusAfterReply: "open",
    });

    const ticket = await getUnit311SupportTicketForOrganisation(id, ctx.organisationId);
    return NextResponse.json({ ticket });
  } catch (error) {
    return unit311SupportErrorResponse(error);
  }
}
