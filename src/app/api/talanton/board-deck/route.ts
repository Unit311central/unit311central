import { assertDemoMutationAllowedForRequest } from "@/lib/demo/mutation-guard";
import { NextRequest, NextResponse } from "next/server";

import { getPlatformSession } from "@/lib/platform-session";
import { generateTalantonBoardDeck } from "@/lib/talanton/board-deck-generator";
import { isTalantonPortalsAllowedUsername } from "@/lib/talanton/portals-auth";
import { isTalantonImpactSlug } from "@/lib/talanton-surface";
import { requireCurrentWorkspace } from "@/lib/workspace-context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = {
  "Cache-Control": "private, no-cache, no-store, max-age=0, must-revalidate",
  Vary: "Cookie",
} as const;

/** HTTP response headers must be ByteString (Latin-1). Pack names use em dashes in PDF copy. */
function asciiHeaderValue(value: string): string {
  return value
    .replace(/\u2014/g, " - ")
    .replace(/\u2013/g, "-")
    .replace(/[^\u0020-\u007E]/g, "");
}

async function assertTalantonEaAccess(): Promise<NextResponse | null> {
  const session = await getPlatformSession();
  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401, headers: NO_STORE_HEADERS });
  }

  try {
    const workspace = await requireCurrentWorkspace();
    if (!isTalantonImpactSlug(workspace.slug)) {
      return NextResponse.json(
        { error: "Talanton Impact workspace required." },
        { status: 403, headers: NO_STORE_HEADERS },
      );
    }
    return null;
  } catch {
    if (isTalantonPortalsAllowedUsername(session.username)) {
      return null;
    }
    return NextResponse.json(
      { error: "Talanton Impact workspace required." },
      { status: 403, headers: NO_STORE_HEADERS },
    );
  }
}

export async function POST(request: NextRequest) {
  const demoMutationBlock = await assertDemoMutationAllowedForRequest(request);
  if (demoMutationBlock) return demoMutationBlock;

  const denied = await assertTalantonEaAccess();
  if (denied) return denied;

  let meetingDate: string | undefined;
  try {
    const body = (await request.json()) as { meetingDate?: string; when?: string };
    meetingDate = body.meetingDate ?? body.when;
  } catch {
    meetingDate = undefined;
  }

  try {
    const result = await generateTalantonBoardDeck(meetingDate);
    const disposition = request.nextUrl.searchParams.get("disposition") === "attachment" ? "attachment" : "inline";

    return new NextResponse(Buffer.from(result.pdfBytes), {
      status: 200,
      headers: {
        ...NO_STORE_HEADERS,
        "Content-Type": "application/pdf",
        "Content-Disposition": `${disposition}; filename="${result.filename}"`,
        "X-Talanton-Pack-Name": asciiHeaderValue(result.data.packName),
        "X-Talanton-Meeting-Date": result.data.meetingDate,
        "X-Talanton-Page-Count": String(result.pageCount),
        "X-Talanton-Deck-Build": result.build,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate board deck." },
      { status: 500, headers: NO_STORE_HEADERS },
    );
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}
