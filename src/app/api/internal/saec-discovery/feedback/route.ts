import { NextRequest, NextResponse } from "next/server";

import { getRequestHost, isInternalDomainHost } from "@/lib/app-domains";
import { getPlatformSession } from "@/lib/platform-session";
import { getSaecDiscoverySubmissionForInternal } from "@/lib/saec-discovery/submissions-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Internal SAEC Feedback — submitted Current Systems discovery for SAEC.
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
    const submission = await getSaecDiscoverySubmissionForInternal();
    return NextResponse.json({ submission }, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load SAEC Feedback." },
      { status: 500 },
    );
  }
}
