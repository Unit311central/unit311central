import { NextRequest, NextResponse } from "next/server";

import { getPlatformSession } from "@/lib/platform-session";
import {
  clearSaecDiscoveryDraftForOwner,
  getSaecDiscoveryDraftForOwner,
  upsertSaecDiscoveryDraft,
} from "@/lib/saec-discovery/drafts-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function requireDraftOwner(session: Awaited<ReturnType<typeof getPlatformSession>>) {
  if (!session?.sub?.trim()) {
    return null;
  }
  return session;
}

export async function GET() {
  try {
    const session = await getPlatformSession();
    const owner = requireDraftOwner(session);
    if (!owner) {
      return NextResponse.json({ draft: null }, { headers: { "Cache-Control": "private, no-store" } });
    }

    const draft = await getSaecDiscoveryDraftForOwner({ ownerUserId: owner.sub });
    return NextResponse.json({ draft }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load SAEC Discovery draft." },
      { status: 503 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getPlatformSession();
    const owner = requireDraftOwner(session);
    if (!owner) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    if (!body.responses || typeof body.responses !== "object") {
      return NextResponse.json({ error: "responses is required." }, { status: 400 });
    }

    const draft = await upsertSaecDiscoveryDraft({
      ownerUserId: owner.sub,
      ownerEmail: owner.username,
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
      { error: error instanceof Error ? error.message : "Unable to save SAEC Discovery draft." },
      { status: 503 },
    );
  }
}

export async function DELETE() {
  try {
    const session = await getPlatformSession();
    const owner = requireDraftOwner(session);
    if (!owner) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    await clearSaecDiscoveryDraftForOwner({ ownerUserId: owner.sub });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to clear SAEC Discovery draft." },
      { status: 503 },
    );
  }
}
