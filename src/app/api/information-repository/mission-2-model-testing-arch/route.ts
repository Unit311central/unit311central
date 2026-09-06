import { NextResponse } from "next/server";

import { requireInterfaceWorxWorkspaceSession } from "@/lib/interface-worx-information-repository-auth";
import { isWolfCentralSlug } from "@/lib/wolf/wolf-surface";
import { buildWolfMission2ModelTestingArchPayload } from "@/lib/wolf/wolf-mission2-model-testing-arch-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireInterfaceWorxWorkspaceSession();
  if ("error" in auth) return auth.error;

  if (!isWolfCentralSlug(auth.workspace.slug)) {
    return NextResponse.json(
      { error: "MISSION 2 MODEL TESTING ARCH is only available on WOLF Central." },
      { status: 403 },
    );
  }

  return NextResponse.json(buildWolfMission2ModelTestingArchPayload());
}
