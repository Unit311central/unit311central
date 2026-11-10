import "server-only";

import { NextResponse } from "next/server";

import { assertDemoAttendanceWorkspace } from "@/lib/attendance/isolation";
import { getPlatformSession, type PlatformSession } from "@/lib/platform-session";
import { requireCurrentWorkspace, type CurrentWorkspace } from "@/lib/workspace-context";

export async function requireDemoAttendanceAccess(): Promise<
  { error: NextResponse } | { workspace: CurrentWorkspace; session: PlatformSession }
> {
  const session = await getPlatformSession();
  if (!session) {
    return { error: NextResponse.json({ error: "Authentication required." }, { status: 401 }) };
  }

  try {
    const workspace = await requireCurrentWorkspace();
    assertDemoAttendanceWorkspace(workspace);
    return { workspace, session };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Attendance is only available in the demo workspace.";
    const status = message.includes("only available") ? 403 : 401;
    return { error: NextResponse.json({ error: message }, { status }) };
  }
}
