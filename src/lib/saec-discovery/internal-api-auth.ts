import "server-only";

import type { NextRequest } from "next/server";

import { getRequestHost, isInternalDomainHost } from "@/lib/app-domains";
import { getPlatformSession, type PlatformSession } from "@/lib/platform-session";

export async function requireInternalSaecOperator(
  request: NextRequest,
): Promise<PlatformSession> {
  const host = getRequestHost(request);
  if (!isInternalDomainHost(host)) {
    throw new Error("Not available on this host.");
  }

  const session = await getPlatformSession();
  if (!session) {
    throw new Error("Authentication required.");
  }
  if (session.userType !== "internal") {
    throw new Error("Internal operators only.");
  }

  return session;
}
