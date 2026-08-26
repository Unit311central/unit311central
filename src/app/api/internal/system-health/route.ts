import { NextRequest, NextResponse } from "next/server";

import { getRequestHost, isInternalDomainHost } from "@/lib/app-domains";
import { getPlatformSession } from "@/lib/platform-session";
import { buildSystemHealthReport } from "@/lib/system-health/service";

export const dynamic = "force-dynamic";

/**
 * Internal System Health diagnostics — internal host + internal operators only.
 */
export async function GET(request: NextRequest) {
  const host = getRequestHost(request);
  if (!isInternalDomainHost(host)) {
    return NextResponse.json({ error: "Not available on this host." }, { status: 403 });
  }

  const session = await getPlatformSession();
  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  if (session.userType !== "internal") {
    return NextResponse.json({ error: "Internal operators only." }, { status: 403 });
  }

  try {
    const report = await buildSystemHealthReport();
    return NextResponse.json(report, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch {
    return NextResponse.json({ error: "Unable to load system health." }, { status: 500 });
  }
}
