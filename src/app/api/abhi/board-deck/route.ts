import { NextRequest, NextResponse } from "next/server";

import { isAbhiPortalsAllowedUsername } from "@/lib/abhi/portals-auth";
import { generateAbhiBoardDeck } from "@/lib/abhi/board-deck-generator";
import { isAbhiSlug } from "@/lib/abhi-surface";
import { getPlatformSession } from "@/lib/platform-session";
import { requireCurrentWorkspace } from "@/lib/workspace-context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = {
  "Cache-Control": "private, no-cache, no-store, max-age=0, must-revalidate",
  Vary: "Cookie",
} as const;

function asciiHeaderValue(value: string): string {
  return value
    .replace(/\u2014/g, " - ")
    .replace(/\u2013/g, "-")
    .replace(/[^\u0020-\u007E]/g, "");
}

async function assertAbhiEaAccess(): Promise<NextResponse | null> {
  const session = await getPlatformSession();
  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401, headers: NO_STORE_HEADERS });
  }

  try {
    const workspace = await requireCurrentWorkspace();
    if (!isAbhiSlug(workspace.slug)) {
      return NextResponse.json(
        { error: "ABHI workspace required." },
        { status: 403, headers: NO_STORE_HEADERS },
      );
    }
    return null;
  } catch {
    if (isAbhiPortalsAllowedUsername(session.username)) {
      return null;
    }
    return NextResponse.json(
      { error: "ABHI workspace required." },
      { status: 403, headers: NO_STORE_HEADERS },
    );
  }
}

export async function POST(request: NextRequest) {
  const denied = await assertAbhiEaAccess();
  if (denied) return denied;

  let meetingDate: string | undefined;
  try {
    const body = (await request.json()) as { meetingDate?: string; when?: string };
    meetingDate = body.meetingDate ?? body.when;
  } catch {
    meetingDate = undefined;
  }

  try {
    const result = await generateAbhiBoardDeck(meetingDate);
    const disposition = request.nextUrl.searchParams.get("disposition") === "attachment" ? "attachment" : "inline";

    return new NextResponse(Buffer.from(result.pdfBytes), {
      status: 200,
      headers: {
        ...NO_STORE_HEADERS,
        "Content-Type": "application/pdf",
        "Content-Disposition": `${disposition}; filename="${result.filename}"`,
        "X-Abhi-Pack-Name": asciiHeaderValue(result.data.packName),
        "X-Abhi-Meeting-Date": result.data.meetingDate,
        "X-Abhi-Page-Count": String(result.pageCount),
        "X-Abhi-Deck-Build": result.build,
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
