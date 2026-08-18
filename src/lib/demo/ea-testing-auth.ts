import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { getRequestHost, isDemoDomainHost, parseClientPlatformSubdomainSafe } from "@/lib/app-domains";
import { DEMO_WORKSPACE_SLUG } from "@/lib/app-domains";
import { getPlatformSession } from "@/lib/platform-session";
import { requireCurrentWorkspace } from "@/lib/workspace-context";

const NO_STORE_HEADERS = {
  "Cache-Control": "private, no-cache, no-store, max-age=0, must-revalidate",
  Vary: "Cookie",
} as const;

export { NO_STORE_HEADERS as DEMO_EA_NO_STORE_HEADERS };

export async function isDemoCustomerHostRequest(): Promise<boolean> {
  const requestHeaders = await headers();
  const host = getRequestHost({ headers: requestHeaders });
  return isDemoDomainHost(host);
}

export async function assertDemoEaAccess(): Promise<NextResponse | null> {
  if (await isDemoCustomerHostRequest()) return null;

  const session = await getPlatformSession();
  if (!session) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401, headers: NO_STORE_HEADERS },
    );
  }

  try {
    const workspace = await requireCurrentWorkspace();
    if (workspace.slug !== DEMO_WORKSPACE_SLUG) {
      return NextResponse.json(
        { error: "Open https://demo.unit311central.com/testing while signed in to the Demo workspace." },
        { status: 403, headers: NO_STORE_HEADERS },
      );
    }
    return null;
  } catch {
    const requestHeaders = await headers();
    const hostSlug = parseClientPlatformSubdomainSafe(getRequestHost({ headers: requestHeaders }));
    if (hostSlug === DEMO_WORKSPACE_SLUG) return null;
    return NextResponse.json(
      { error: "Open https://demo.unit311central.com/testing while signed in to the Demo workspace." },
      { status: 403, headers: NO_STORE_HEADERS },
    );
  }
}

export function redirectDemoEaApiToTesting(request: Request): NextResponse | null {
  const accept = request.headers.get("accept") ?? "";
  const secFetchDest = request.headers.get("sec-fetch-dest") ?? "";
  if (secFetchDest === "document" || accept.includes("text/html")) {
    return NextResponse.redirect(new URL("/testing", request.url), {
      status: 302,
      headers: NO_STORE_HEADERS,
    });
  }
  return null;
}
