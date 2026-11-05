import { NextResponse } from "next/server";

import { listCourseSubmissions } from "@/lib/course/malaysian-land-survey-store";
import { WorkspaceAccessError } from "@/lib/workspace-context";
import { requireWolfCentralWorkspace } from "@/lib/wolf/wolf-central-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "private, no-store" };

function authFailure(error: unknown) {
  if (error instanceof WorkspaceAccessError) {
    return NextResponse.json(
      { error: error.status === 401 ? "Authentication required." : "Workspace access denied." },
      { status: error.status, headers: NO_STORE },
    );
  }
  const message = error instanceof Error ? error.message : "";
  if (message.includes("Authentication") || message.includes("Workspace context")) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401, headers: NO_STORE });
  }
  if (message.includes("only available") || message.includes("denied")) {
    return NextResponse.json({ error: "Workspace access denied." }, { status: 403, headers: NO_STORE });
  }
  return null;
}

export async function GET() {
  try {
    await requireWolfCentralWorkspace();
  } catch (error) {
    const denied = authFailure(error);
    if (denied) return denied;
    return NextResponse.json(
      { error: "Course responses could not be loaded." },
      { status: 500, headers: NO_STORE },
    );
  }

  const result = await listCourseSubmissions();
  if (!result.ok) {
    const status = result.reason === "unavailable" ? 503 : 500;
    const error =
      result.reason === "unavailable"
        ? "Course responses are not available yet. The database migration still needs to be applied."
        : "Course responses could not be loaded.";
    return NextResponse.json({ error }, { status, headers: NO_STORE });
  }

  return NextResponse.json({ submissions: result.submissions }, { headers: NO_STORE });
}
