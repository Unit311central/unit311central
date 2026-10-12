import { NextResponse, type NextRequest } from "next/server";

import { getRequestHost } from "@/lib/app-domains";
import { requirePlatformSession } from "@/lib/platform-session";
import { assertSalesManagementTargetClientsWorkspace } from "@/lib/sales-management-rollout";
import { assertTargetClientsApiHost } from "@/lib/target-clients";
import { requireCurrentWorkspace } from "@/lib/workspace-context";

export async function requireTargetClientsApiContext(request: NextRequest) {
  await requirePlatformSession();
  const workspace = await requireCurrentWorkspace();
  assertTargetClientsApiHost(getRequestHost(request));
  assertSalesManagementTargetClientsWorkspace(workspace.slug);
  return workspace;
}

export function targetClientsErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Request failed.";
  let status = 500;
  if (
    message.includes("Authentication required") ||
    message.includes("Workspace context") ||
    message.includes("Session")
  ) {
    status = 401;
  } else if (
    message.includes("only available on the internal") ||
    message.includes("only available on Internal, Demo and WOLF") ||
    message.includes("only available on the internal Unit311Central") ||
    message.includes("not a Target Client")
  ) {
    status = 403;
  } else if (message.includes("Lead not found")) {
    status = 404;
  }
  return NextResponse.json({ error: message }, { status });
}
