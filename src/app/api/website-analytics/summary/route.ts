import { NextRequest, NextResponse } from "next/server";

import { getRequestHost, isInternalDomainHost } from "@/lib/app-domains";
import { getPlatformSession } from "@/lib/platform-session";
import { buildWebsiteAnalyticsSummary } from "@/lib/website-analytics/service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
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

    const summary = await buildWebsiteAnalyticsSummary();
    return NextResponse.json(summary, {
      headers: { "Cache-Control": "private, max-age=60" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load website analytics.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
