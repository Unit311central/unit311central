import { NextRequest, NextResponse } from "next/server";

import { generateAbhiBoardDeck } from "@/lib/abhi/board-deck-generator";
import {
  ABHI_EA_NO_STORE_HEADERS,
  assertAbhiEaAccess,
  redirectAbhiEaApiToTesting,
} from "@/lib/abhi/ea-testing-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function asciiHeaderValue(value: string): string {
  return value
    .replace(/\u2014/g, " - ")
    .replace(/\u2013/g, "-")
    .replace(/[^\u0020-\u007E]/g, "");
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
        ...ABHI_EA_NO_STORE_HEADERS,
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
      { status: 500, headers: ABHI_EA_NO_STORE_HEADERS },
    );
  }
}

export async function GET(request: NextRequest) {
  const redirect = redirectAbhiEaApiToTesting(request);
  if (redirect) return redirect;
  return POST(request);
}
