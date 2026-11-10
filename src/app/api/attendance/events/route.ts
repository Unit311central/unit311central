import { NextRequest, NextResponse } from "next/server";

import { requireDemoAttendanceAccess } from "@/lib/attendance/auth";
import { recordAttendanceEvent } from "@/lib/attendance/service";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const auth = await requireDemoAttendanceAccess();
  if ("error" in auth) return auth.error;
  try {
    const body = (await request.json()) as {
      employeeId?: string;
      employeeNumber?: string;
      nfcUid?: string;
      eventType?: "IN" | "OUT";
      eventTimestamp?: string;
      source?: "SIMULATED" | "NFC";
      simulationId?: string;
    };
    if (!body.eventType || !body.eventTimestamp || !body.source) {
      return NextResponse.json(
        { error: "Event type, timestamp, and source are required." },
        { status: 400 },
      );
    }
    const result = await recordAttendanceEvent({
      employeeId: body.employeeId,
      employeeNumber: body.employeeNumber,
      nfcUid: body.nfcUid,
      eventType: body.eventType,
      eventTimestamp: body.eventTimestamp,
      source: body.source,
      simulationId: body.simulationId,
    });
    return NextResponse.json(result, { status: result.duplicate ? 200 : 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to record attendance.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
