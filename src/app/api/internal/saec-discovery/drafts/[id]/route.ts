import { NextRequest, NextResponse } from "next/server";

import { deleteSaecDiscoveryDraftForInternal } from "@/lib/saec-discovery/drafts-service";
import { requireInternalSaecOperator } from "@/lib/saec-discovery/internal-api-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    await requireInternalSaecOperator(request);
    const { id } = await context.params;
    await deleteSaecDiscoveryDraftForInternal(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to delete SAEC draft.";
    const status =
      message === "Authentication required."
        ? 401
        : message === "Internal operators only." || message === "Not available on this host."
          ? 403
          : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
