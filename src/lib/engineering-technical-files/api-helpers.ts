import { NextResponse } from "next/server";

import { isModuleEnabledInWorkspace } from "@/lib/central-application-model/workspace-enablement";
import { apiErrorStatus } from "@/lib/api-error-status";
import type { PlatformSession } from "@/lib/platform-session";
import { requirePlatformSession } from "@/lib/platform-session";
import {
  requireCurrentWorkspace,
  WorkspaceAccessError,
  type CurrentWorkspace,
} from "@/lib/workspace-context";

export function technicalFileActor(session: PlatformSession) {
  return { userId: session.sub, displayName: session.displayName || session.username };
}

export type EngineeringTechnicalFilesApiContext = {
  session: PlatformSession;
  workspace: CurrentWorkspace;
  actor: ReturnType<typeof technicalFileActor>;
};

/**
 * Shared Engineering Technical Files API gate:
 * platform session → workspace tenancy → Engineering module enablement.
 */
export async function requireEngineeringTechnicalFilesApiContext(): Promise<EngineeringTechnicalFilesApiContext> {
  const session = await requirePlatformSession();
  const workspace = await requireCurrentWorkspace();

  if (!isModuleEnabledInWorkspace("engineering", workspace.slug)) {
    throw new WorkspaceAccessError("Engineering is not enabled for this workspace.", 403);
  }

  return {
    session,
    workspace,
    actor: technicalFileActor(session),
  };
}

export function technicalFileErrorResponse(error: unknown, fallback = "Request failed.") {
  const message = error instanceof Error ? error.message : fallback;
  const status = apiErrorStatus(error, 500);
  return NextResponse.json({ error: message }, { status });
}
