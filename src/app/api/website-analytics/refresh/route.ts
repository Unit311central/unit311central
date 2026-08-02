import { NextRequest, NextResponse } from "next/server";

import { getRequestHost, isInternalDomainHost } from "@/lib/app-domains";
import { getPlatformSession } from "@/lib/platform-session";
import { refreshClaritySnapshot } from "@/lib/website-analytics/service";

export const dynamic = "force-dynamic";

/** Manual Clarity snapshot refresh (Internal only; respects Clarity daily quota). */
export async function POST(request: NextRequest) {
  try {
    const host = getRequestHost(request);
    if (!isInternalDomainHost(host)) {
      return NextResponse.json({ error: "Not available on this host." }, { status: 403 });
    }
    const session = await getPlatformSession();
    if (!session || session.userType !== "internal") {
      return NextResponse.json({ error: "Internal operators only." }, { status: 403 });
    }

    const result = await refreshClaritySnapshot();
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 502 });
    }
    return NextResponse.json({ ok: true, fetchedAt: result.fetchedAt });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Refresh failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
