import { NextRequest, NextResponse } from "next/server";

import { requireDemoAttendanceAccess } from "@/lib/attendance/auth";
import { buildAttendanceDashboard } from "@/lib/attendance/service";
import { londonIsoDate } from "@/lib/attendance/time";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireDemoAttendanceAccess();
  if ("error" in auth) return auth.error;
  try {
    const date = request.nextUrl.searchParams.get("date") || londonIsoDate(new Date());
    const employeeId = request.nextUrl.searchParams.get("employeeId");
    const asOf = request.nextUrl.searchParams.get("asOf");
    const dashboard = await buildAttendanceDashboard({ date, employeeId, asOf });
    return NextResponse.json(dashboard);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load the attendance dashboard.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
