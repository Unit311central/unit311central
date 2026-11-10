import { NextRequest, NextResponse } from "next/server";

import { requireDemoAttendanceAccess } from "@/lib/attendance/auth";
import { updateAttendanceEmployee } from "@/lib/attendance/service";
import { parseEmployeeWrite } from "@/lib/attendance/validation";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireDemoAttendanceAccess();
  if ("error" in auth) return auth.error;
  try {
    const { id } = await context.params;
    const parsed = parseEmployeeWrite(await request.json());
    if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
    const employee = await updateAttendanceEmployee(id, parsed.value);
    return NextResponse.json({ employee });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update employee.";
    const status = message === "Employee not found." ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
