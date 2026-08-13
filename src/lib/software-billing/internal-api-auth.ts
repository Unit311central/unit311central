import { NextRequest, NextResponse } from "next/server";

import { getRequestHost, isInternalDomainHost } from "@/lib/app-domains";
import { requireInternalWorkspaceSession } from "@/lib/internal-admin-auth";
import { INTERNAL_WORKSPACE_SLUG } from "@/lib/workspace-host";

const INTERNAL_ONLY = "Software billing is only available on the internal workspace.";

export async function requireInternalSoftwareBillingAccess(
  request: NextRequest,
): Promise<
  | { error: NextResponse }
  | { workspaceId: string; workspaceSlug: string }
> {
  const host = getRequestHost(request);
  if (!isInternalDomainHost(host)) {
    return { error: NextResponse.json({ error: INTERNAL_ONLY }, { status: 403 }) };
  }

  const auth = await requireInternalWorkspaceSession();
  if ("error" in auth) return auth;

  if (auth.workspace.slug !== INTERNAL_WORKSPACE_SLUG) {
    return { error: NextResponse.json({ error: INTERNAL_ONLY }, { status: 403 }) };
  }

  return { workspaceId: auth.workspace.id, workspaceSlug: auth.workspace.slug };
}
