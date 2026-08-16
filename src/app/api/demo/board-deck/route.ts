import { NextRequest, NextResponse } from "next/server";

import { generateNorthstarBoardDeck } from "@/lib/demo/northstar-board-deck-generator";
import { isDemoApiRequest } from "@/lib/demo/demo-request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!(await isDemoApiRequest())) {
    return NextResponse.json({ error: "Demo host only." }, { status: 403 });
  }

  const meetingDate = request.nextUrl.searchParams.get("meetingDate")?.trim() || "2026-03-20";
  const disposition =
    request.nextUrl.searchParams.get("disposition") === "attachment" ? "attachment" : "inline";

  try {
    const result = await generateNorthstarBoardDeck(meetingDate);
    return new NextResponse(Buffer.from(result.pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${disposition}; filename="${result.filename}"`,
        "Cache-Control": "public, max-age=3600",
        "X-Northstar-Pack-Name": result.data.packName,
        "X-Northstar-Meeting-Date": result.data.meetingDate,
        "X-Northstar-Deck-Build": result.build,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate board deck." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  let meetingDate: string | undefined;
  try {
    const body = (await request.json()) as { meetingDate?: string };
    meetingDate = body.meetingDate;
  } catch {
    meetingDate = undefined;
  }
  const url = new URL(request.url);
  if (meetingDate) url.searchParams.set("meetingDate", meetingDate);
  return GET(new NextRequest(url, request));
}
