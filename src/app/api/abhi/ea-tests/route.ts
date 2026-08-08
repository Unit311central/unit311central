import { NextResponse } from "next/server";

import { isAbhiPortalsAllowedUsername } from "@/lib/abhi/portals-auth";
import { runAbhiEaTestSuite } from "@/lib/abhi/ea-test-suite";
import { isAbhiSlug } from "@/lib/abhi-surface";
import { getPlatformSession } from "@/lib/platform-session";
import { requireCurrentWorkspace } from "@/lib/workspace-context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = {
  "Cache-Control": "private, no-cache, no-store, max-age=0, must-revalidate",
  Vary: "Cookie",
} as const;

async function assertAbhiEaAccess(): Promise<NextResponse | null> {
  const session = await getPlatformSession();
  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401, headers: NO_STORE_HEADERS });
  }

  try {
    const workspace = await requireCurrentWorkspace();
    if (!isAbhiSlug(workspace.slug)) {
      return NextResponse.json(
        { error: "ABHI workspace required." },
        { status: 403, headers: NO_STORE_HEADERS },
      );
    }
    return null;
  } catch {
    if (isAbhiPortalsAllowedUsername(session.username)) {
      return null;
    }
    return NextResponse.json(
      { error: "ABHI workspace required." },
      { status: 403, headers: NO_STORE_HEADERS },
    );
  }
}

export async function GET() {
  const denied = await assertAbhiEaAccess();
  if (denied) return denied;

  const report = await runAbhiEaTestSuite();
  return NextResponse.json(report, { headers: NO_STORE_HEADERS });
}

export async function POST() {
  return GET();
}
