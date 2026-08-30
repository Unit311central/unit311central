import { NextRequest, NextResponse } from "next/server";

import {
  getSaecDiscoverySubmissionStatus,
  submitSaecDiscoveryQuestionnaire,
} from "@/lib/saec-discovery/submissions-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const status = await getSaecDiscoverySubmissionStatus();
    return NextResponse.json(status, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load submission status." },
      { status: 503 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    if (!body.responses || typeof body.responses !== "object") {
      return NextResponse.json({ error: "responses is required." }, { status: 400 });
    }

    const submission = await submitSaecDiscoveryQuestionnaire({
      responses: body.responses,
      submittedByEmail:
        typeof body.submittedByEmail === "string" ? body.submittedByEmail : null,
    });

    return NextResponse.json({
      ok: true,
      submission: {
        id: submission.id,
        submittedAt: submission.submittedAt,
        updatedAt: submission.updatedAt,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to submit SAEC Discovery." },
      { status: 503 },
    );
  }
}
