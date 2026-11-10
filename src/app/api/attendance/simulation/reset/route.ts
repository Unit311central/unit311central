import { NextRequest, NextResponse } from "next/server";

import { requireDemoAttendanceAccess } from "@/lib/attendance/auth";
import { resetAttendanceSimulation } from "@/lib/attendance/service";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const auth = await requireDemoAttendanceAccess();
  if ("error" in auth) return auth.error;
  try {
    const body = (await request.json()) as { simulationId?: string };
    if (!body.simulationId) {
      return NextResponse.json({ error: "A simulation id is required." }, { status: 400 });
    }
    const result = await resetAttendanceSimulation(body.simulationId);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to reset the simulation.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
