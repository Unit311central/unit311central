import { NextResponse } from "next/server";

import { requireDemoAttendanceAccess } from "@/lib/attendance/auth";
import { listAttendanceHistory } from "@/lib/attendance/service";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireDemoAttendanceAccess();
  if ("error" in auth) return auth.error;
  try {
    const { id } = await context.params;
    const events = await listAttendanceHistory(id);
    return NextResponse.json({ events });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load attendance history.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
