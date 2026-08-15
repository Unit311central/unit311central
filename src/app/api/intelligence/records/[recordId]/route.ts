import { NextRequest } from "next/server";

import { handleGetIntelligenceRecord } from "@/lib/intelligence/api-handlers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ recordId: string }> },
) {
  const { recordId } = await context.params;
  return handleGetIntelligenceRecord(request, recordId);
}
