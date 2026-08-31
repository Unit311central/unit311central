import { NextRequest, NextResponse } from "next/server";

import { requireInternalSaecOperator } from "@/lib/saec-discovery/internal-api-auth";
import {
  deleteSaecDiscoverySubmissionForInternal,
  updateSaecDiscoverySubmissionForInternal,
} from "@/lib/saec-discovery/submissions-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    await requireInternalSaecOperator(request);
    const { id } = await context.params;
    const body = (await request.json()) as Record<string, unknown>;
    if (!body.responses || typeof body.responses !== "object") {
      return NextResponse.json({ error: "responses is required." }, { status: 400 });
    }

    const submission = await updateSaecDiscoverySubmissionForInternal({
      id,
      responses: body.responses,
    });
    return NextResponse.json({ ok: true, submission });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update SAEC submission.";
    const status =
      message === "Authentication required."
        ? 401
        : message === "Internal operators only." || message === "Not available on this host."
          ? 403
          : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    await requireInternalSaecOperator(request);
    const { id } = await context.params;
    await deleteSaecDiscoverySubmissionForInternal(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to delete SAEC submission.";
    const status =
      message === "Authentication required."
        ? 401
        : message === "Internal operators only." || message === "Not available on this host."
          ? 403
          : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
