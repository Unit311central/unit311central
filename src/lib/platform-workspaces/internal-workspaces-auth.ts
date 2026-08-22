import { NextRequest, NextResponse } from "next/server";

import { getRequestHost, isInternalDomainHost } from "@/lib/app-domains";
import { requireInternalAdministratorSession } from "@/lib/internal-admin-auth";

const INTERNAL_ONLY = "Workspaces administration is only available on Internal Central.";

export async function requireInternalWorkspacesAccess(
  request: NextRequest,
): Promise<{ error: NextResponse } | { actor: string }> {
  const host = getRequestHost(request);
  if (!isInternalDomainHost(host)) {
    return { error: NextResponse.json({ error: INTERNAL_ONLY }, { status: 403 }) };
  }

  const auth = await requireInternalAdministratorSession();
  if ("error" in auth) return auth;

  return { actor: auth.session.username || "internal-admin" };
}
