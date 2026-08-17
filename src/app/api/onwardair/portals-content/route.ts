import { assertDemoMutationAllowedForRequest } from "@/lib/demo/mutation-guard";
import { NextRequest } from "next/server";

import {
  handleGetPortalsBriefingContent,
  handlePutPortalsBriefingContent,
} from "@/lib/portals/briefing/api-handlers";
import { ONWARDAIR_SLUG } from "@/lib/onwardair-surface";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** @deprecated Prefer /api/portals/briefing-content — kept for backward compatibility. */
export async function GET(request: NextRequest) {
  return handleGetPortalsBriefingContent(request, ONWARDAIR_SLUG);
}

/** @deprecated Prefer /api/portals/briefing-content — kept for backward compatibility. */
export async function PUT(request: NextRequest) {
  const demoMutationBlock = await assertDemoMutationAllowedForRequest(request);
  if (demoMutationBlock) return demoMutationBlock;

  return handlePutPortalsBriefingContent(request, ONWARDAIR_SLUG);
}
