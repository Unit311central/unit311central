import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { isAbhiPortalsAllowedUsername } from "@/lib/abhi/portals-auth";
import { isAbhiSlug } from "@/lib/abhi-surface";
import { getRequestHost, parseClientPlatformSubdomainSafe } from "@/lib/app-domains";
import { getPlatformSession } from "@/lib/platform-session";
import { requireCurrentWorkspace } from "@/lib/workspace-context";

const NO_STORE_HEADERS = {
  "Cache-Control": "private, no-cache, no-store, max-age=0, must-revalidate",
  Vary: "Cookie",
} as const;

export { NO_STORE_HEADERS as ABHI_EA_NO_STORE_HEADERS };

/** True when the request is on the ABHI customer host (abhi.unit311central.com). */
export async function isAbhiCustomerHostRequest(): Promise<boolean> {
  const requestHeaders = await headers();
  const host = getRequestHost({ headers: requestHeaders });
  return isAbhiSlug(parseClientPlatformSubdomainSafe(host));
}

/**
 * ABHI EA testing APIs + /testing page — any authenticated user on the ABHI host,
 * or an authorised ABHI workspace session, or ABHI portal demo accounts.
 */
export async function assertAbhiEaAccess(): Promise<NextResponse | null> {
  const session = await getPlatformSession();
  if (!session) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401, headers: NO_STORE_HEADERS },
    );
  }

  if (await isAbhiCustomerHostRequest()) {
    return null;
  }

  if (isAbhiPortalsAllowedUsername(session.username)) {
    return null;
  }

  try {
    const workspace = await requireCurrentWorkspace();
    if (!isAbhiSlug(workspace.slug)) {
      return NextResponse.json(
        { error: "Open https://abhi.unit311central.com/testing while signed in to ABHI." },
        { status: 403, headers: NO_STORE_HEADERS },
      );
    }
    return null;
  } catch {
    return NextResponse.json(
      { error: "Open https://abhi.unit311central.com/testing while signed in to ABHI." },
      { status: 403, headers: NO_STORE_HEADERS },
    );
  }
}

/** Browser navigations to JSON API routes should land on the /testing UI. */
export function redirectAbhiEaApiToTesting(request: Request): NextResponse | null {
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
