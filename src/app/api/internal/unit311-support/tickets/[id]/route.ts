import { NextRequest, NextResponse } from "next/server";

import {
  requireInternalUnit311SupportApiContext,
  unit311SupportErrorResponse,
} from "@/lib/unit311-support/api-helpers";
import {
  getUnit311SupportTicketInternal,
  updateUnit311SupportTicketInternal,
} from "@/lib/unit311-support/service";
import type { Unit311SupportSeverity, Unit311SupportStatus } from "@/lib/unit311-support/types";
import { UNIT311_SUPPORT_SEVERITIES, UNIT311_SUPPORT_STATUSES } from "@/lib/unit311-support/data";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    await requireInternalUnit311SupportApiContext();
    const ticket = await getUnit311SupportTicketInternal(id);
    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
    }
    return NextResponse.json({ ticket });
  } catch (error) {
    return unit311SupportErrorResponse(error);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    await requireInternalUnit311SupportApiContext();
    const body = (await request.json()) as {
      status?: string;
      severity?: string | null;
      assignedTo?: string | null;
    };

    const patch: {
      status?: Unit311SupportStatus;
      severity?: Unit311SupportSeverity | null;
      assignedTo?: string | null;
    } = {};

    if (body.status !== undefined) {
      if (!UNIT311_SUPPORT_STATUSES.includes(body.status as Unit311SupportStatus)) {
        return NextResponse.json({ error: "Invalid status." }, { status: 400 });
      }
      patch.status = body.status as Unit311SupportStatus;
    }

    if (body.severity !== undefined) {
      if (
        body.severity !== null &&
        !UNIT311_SUPPORT_SEVERITIES.includes(body.severity as Unit311SupportSeverity)
      ) {
        return NextResponse.json({ error: "Invalid severity." }, { status: 400 });
      }
      patch.severity = body.severity as Unit311SupportSeverity | null;
    }

    if (body.assignedTo !== undefined) {
      patch.assignedTo = body.assignedTo?.trim() || null;
    }

    const ticket = await updateUnit311SupportTicketInternal(id, patch);
    return NextResponse.json({ ticket });
  } catch (error) {
    return unit311SupportErrorResponse(error);
  }
}
