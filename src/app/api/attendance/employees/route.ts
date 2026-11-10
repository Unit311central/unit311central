import { NextRequest, NextResponse } from "next/server";

import { requireDemoAttendanceAccess } from "@/lib/attendance/auth";
import { createAttendanceEmployee, listAttendanceEmployees } from "@/lib/attendance/service";
import { parseEmployeeWrite } from "@/lib/attendance/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireDemoAttendanceAccess();
  if ("error" in auth) return auth.error;
  try {
    const employees = await listAttendanceEmployees();
    return NextResponse.json({ employees });
  } catch (error) {
    return NextResponse.json({ error: messageOf(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireDemoAttendanceAccess();
  if ("error" in auth) return auth.error;
  try {
    const parsed = parseEmployeeWrite(await request.json());
    if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
    const employee = await createAttendanceEmployee(parsed.value);
    return NextResponse.json({ employee }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: messageOf(error) }, { status: 400 });
  }
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : "Attendance request failed.";
}
