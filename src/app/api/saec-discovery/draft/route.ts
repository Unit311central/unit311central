import { NextRequest, NextResponse } from "next/server";

import { getPlatformSession } from "@/lib/platform-session";
import {
  clearSaecDiscoveryDraft,
  getSaecDiscoveryDraftForUser,
  upsertSaecDiscoveryDraft,
} from "@/lib/saec-discovery/draft-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const session = await getPlatformSession();
  if (!session?.sub) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const draft = await getSaecDiscoveryDraftForUser({ platformUserId: session.sub });
    return NextResponse.json(
      { draft },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load draft." },
      { status: 503 },
    );
  }
}

export async function PUT(request: NextRequest) {
  const session = await getPlatformSession();
  if (!session?.sub) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    if (!body.responses || typeof body.responses !== "object") {
      return NextResponse.json({ error: "responses is required." }, { status: 400 });
    }

    const draft = await upsertSaecDiscoveryDraft({
      platformUserId: session.sub,
      ownerEmail: session.username,
      responses: body.responses,
    });

    return NextResponse.json({
      ok: true,
      draft: draft
        ? {
            id: draft.id,
            lastSavedAt: draft.lastSavedAt,
            updatedAt: draft.updatedAt,
          }
        : null,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to save draft." },
      { status: 503 },
    );
  }
}

export async function DELETE() {
  const session = await getPlatformSession();
  if (!session?.sub) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    await clearSaecDiscoveryDraft(session.sub);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to clear draft." },
      { status: 503 },
    );
  }
}
