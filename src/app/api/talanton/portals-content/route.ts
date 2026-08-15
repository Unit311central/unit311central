import { NextRequest } from "next/server";

import {
  handleGetPortalsBriefingContent,
  handlePutPortalsBriefingContent,
} from "@/lib/portals/briefing/api-handlers";
import { TALANTON_IMPACT_SLUG } from "@/lib/talanton-surface";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** @deprecated Prefer /api/portals/briefing-content — kept for backward compatibility. */
export async function GET(request: NextRequest) {
  return handleGetPortalsBriefingContent(request, TALANTON_IMPACT_SLUG);
}

/** @deprecated Prefer /api/portals/briefing-content — kept for backward compatibility. */
export async function PUT(request: NextRequest) {
  return handlePutPortalsBriefingContent(request, TALANTON_IMPACT_SLUG);
}
