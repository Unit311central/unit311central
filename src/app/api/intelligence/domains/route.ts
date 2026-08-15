import { NextRequest } from "next/server";

import { handleListIntelligenceDomains } from "@/lib/intelligence/api-handlers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return handleListIntelligenceDomains(request);
}
