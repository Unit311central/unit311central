import { NextResponse } from "next/server";

import {
  requireInternalUnit311SupportApiContext,
  unit311SupportErrorResponse,
} from "@/lib/unit311-support/api-helpers";
import { listAllUnit311SupportTickets } from "@/lib/unit311-support/service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireInternalUnit311SupportApiContext();
    const tickets = await listAllUnit311SupportTickets();
    return NextResponse.json({ tickets });
  } catch (error) {
    return unit311SupportErrorResponse(error);
  }
}
