import { NextResponse } from "next/server";

import { WorkspaceAccessError } from "@/lib/workspace-context";

const QA_FORBIDDEN = "QA features are only available on the dedicated Test workspace.";

export function qaApiErrorResponse(error: unknown): NextResponse {
  if (error instanceof WorkspaceAccessError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  const message = error instanceof Error ? error.message : "Request failed.";
  const status =
    message === "Authentication required."
      ? 401
      : message.includes(QA_FORBIDDEN)
        ? 403
        : 500;

  return NextResponse.json({ error: message }, { status });
}
