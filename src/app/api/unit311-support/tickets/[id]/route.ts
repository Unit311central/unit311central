import { NextResponse } from "next/server";

import {
  requireCustomerUnit311SupportApiContext,
  unit311SupportErrorResponse,
} from "@/lib/unit311-support/api-helpers";
import { getUnit311SupportTicketForOrganisation } from "@/lib/unit311-support/service";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const ctx = await requireCustomerUnit311SupportApiContext();
    const ticket = await getUnit311SupportTicketForOrganisation(id, ctx.organisationId);
    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
    }
    return NextResponse.json({ ticket });
  } catch (error) {
    return unit311SupportErrorResponse(error);
  }
}
