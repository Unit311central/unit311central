import { assertDemoMutationAllowedForRequest } from "@/lib/demo/mutation-guard";
import { NextRequest } from "next/server";

import {
  PORTALS_BRIEFING_GATE_COOKIE,
  PORTALS_BRIEFING_VIEW_COOKIE,
} from "@/lib/portals/briefing/cookie-names";
import {
  handleGetPortalsBriefingContent,
  handlePutPortalsBriefingContent,
} from "@/lib/portals/briefing/api-handlers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return handleGetPortalsBriefingContent(request);
}

export async function PUT(request: NextRequest) {
  const demoMutationBlock = await assertDemoMutationAllowedForRequest(request);
  if (demoMutationBlock) return demoMutationBlock;

  return handlePutPortalsBriefingContent(request);
}

/** Expose canonical cookie names for clients/tests. */
export const PORTALS_BRIEFING_COOKIE_NAMES = {
  gate: PORTALS_BRIEFING_GATE_COOKIE,
  view: PORTALS_BRIEFING_VIEW_COOKIE,
};
