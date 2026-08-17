import { assertDemoMutationAllowedForRequest } from "@/lib/demo/mutation-guard";
import { NextRequest, NextResponse } from "next/server";

import { getPlatformSession } from "@/lib/platform-session";
import { isTalantonPortalsAllowedUsername } from "@/lib/talanton/portals-auth";
import { runTalantonEaTestSuite } from "@/lib/talanton/ea-test-suite";
import { isTalantonImpactSlug } from "@/lib/talanton-surface";
import { requireCurrentWorkspace } from "@/lib/workspace-context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = {
  "Cache-Control": "private, no-cache, no-store, max-age=0, must-revalidate",
  Vary: "Cookie",
} as const;

async function assertTalantonEaAccess(): Promise<NextResponse | null> {
  const session = await getPlatformSession();
  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401, headers: NO_STORE_HEADERS });
  }

  try {
    const workspace = await requireCurrentWorkspace();
    if (!isTalantonImpactSlug(workspace.slug)) {
      return NextResponse.json(
        { error: "Talanton Impact workspace required." },
        { status: 403, headers: NO_STORE_HEADERS },
      );
    }
    return null;
  } catch {
    if (isTalantonPortalsAllowedUsername(session.username)) {
      return null;
    }
    return NextResponse.json(
      { error: "Talanton Impact workspace required." },
      { status: 403, headers: NO_STORE_HEADERS },
    );
  }
}

export async function GET() {
  const denied = await assertTalantonEaAccess();
  if (denied) return denied;

  const report = await runTalantonEaTestSuite();
  return NextResponse.json(report, { headers: NO_STORE_HEADERS });
}

export async function POST(request: NextRequest) {
  const demoMutationBlock = await assertDemoMutationAllowedForRequest(request);
  if (demoMutationBlock) return demoMutationBlock;

  return GET();
}
