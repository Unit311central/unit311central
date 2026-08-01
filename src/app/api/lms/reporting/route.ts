import { NextResponse } from "next/server";

import { requireLmsWorkspaceSession } from "@/lib/lms/auth";
import { getWorkspaceReporting } from "@/lib/lms/service";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireLmsWorkspaceSession();
  if ("error" in auth) return auth.error;

  if (auth.session.userType !== "internal") {
    return NextResponse.json(
      { error: "Internal access required for LMS reporting." },
      { status: 403 },
    );
  }

  try {
    const reporting = await getWorkspaceReporting(auth.workspace.id);
    return NextResponse.json(reporting);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load reporting.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
