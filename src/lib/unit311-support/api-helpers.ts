import { NextResponse } from "next/server";

import { apiErrorStatus } from "@/lib/api-error-status";
import { requireInternalWorkspaceSession } from "@/lib/internal-admin-auth";
import type { PlatformSession } from "@/lib/platform-session";
import { requirePlatformSession } from "@/lib/platform-session";
import {
  assertWorkspaceBelongsToOrganisation,
  isInternalCentralWorkspace,
  resolveOrganisationForSupport,
} from "@/lib/unit311-support/org-context";
import { WorkspaceAccessError, requireCurrentWorkspace } from "@/lib/workspace-context";

export function unit311SupportActor(session: PlatformSession) {
  return {
    userId: session.sub,
    displayName: session.displayName?.trim() || session.username,
    email: session.username,
  };
}

export type CustomerUnit311SupportApiContext = {
  session: PlatformSession;
  organisationId: string;
  organisationName: string;
  workspace: Awaited<ReturnType<typeof requireCurrentWorkspace>>;
  actor: ReturnType<typeof unit311SupportActor>;
};

export async function requireCustomerUnit311SupportApiContext(): Promise<CustomerUnit311SupportApiContext> {
  const session = await requirePlatformSession();
  const workspace = await requireCurrentWorkspace();

  if (isInternalCentralWorkspace(workspace.slug)) {
    throw new WorkspaceAccessError("Unit311 Support is not available on the internal application.", 403);
  }

  const organisation = await resolveOrganisationForSupport(session);
  return {
    session,
    organisationId: organisation.organisationId,
    organisationName: organisation.organisationName,
    workspace,
    actor: unit311SupportActor(session),
  };
}

export async function requireCustomerUnit311SupportWorkspace(
  ctx: CustomerUnit311SupportApiContext,
  workspaceId: string,
) {
  return assertWorkspaceBelongsToOrganisation(workspaceId, ctx.organisationId);
}

export async function requireInternalUnit311SupportApiContext(): Promise<{
  session: PlatformSession;
  actor: ReturnType<typeof unit311SupportActor>;
}> {
  const auth = await requireInternalWorkspaceSession();
  if ("error" in auth) {
    throw new WorkspaceAccessError("Authentication required.", 401);
  }
  if (!isInternalCentralWorkspace(auth.workspace.slug)) {
    throw new WorkspaceAccessError("Internal workspace access required.", 403);
  }
  return {
    session: auth.session,
    actor: unit311SupportActor(auth.session),
  };
}

export function unit311SupportErrorResponse(error: unknown, fallback = "Request failed.") {
  const message = error instanceof Error ? error.message : fallback;
  const status = apiErrorStatus(error, 500);
  return NextResponse.json({ error: message }, { status });
}
