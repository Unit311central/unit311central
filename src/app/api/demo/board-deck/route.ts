import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { NextRequest, NextResponse } from "next/server";

import { generateNorthstarBoardDeck } from "@/lib/demo/northstar-board-deck-generator";
import { northstarBoardDeckPdfFileName } from "@/lib/demo/northstar-board-pack-model";
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
    return pdfResponse(result.pdfBytes, result.filename, disposition, {
      packName: result.data.packName,
      meetingDate: result.data.meetingDate,
      build: result.build,
    });
  } catch (error) {
    const filename = northstarBoardDeckPdfFileName(meetingDate);
    const origin = request.nextUrl.origin;
    try {
      const staticRes = await fetch(`${origin}/samples/${filename}`, { cache: "no-store" });
      const contentType = staticRes.headers.get("content-type") ?? "";
      if (staticRes.ok && contentType.includes("pdf")) {
        const bytes = new Uint8Array(await staticRes.arrayBuffer());
        return pdfResponse(bytes, filename, disposition, {
          packName: `Northstar Board Pack — ${meetingDate}`,
          meetingDate,
          build: "static-fallback",
        });
      }
    } catch {
      /* try disk */
    }
    try {
      const bytes = await readFile(join(process.cwd(), "public", "samples", filename));
      return pdfResponse(bytes, filename, disposition, {
        packName: `Northstar Board Pack — ${meetingDate}`,
        meetingDate,
        build: "static-fallback",
      });
    } catch {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Failed to generate board deck." },
        { status: 500 },
      );
    }
  }
}

function pdfResponse(
  pdfBytes: Uint8Array | Buffer,
  filename: string,
  disposition: "inline" | "attachment",
  meta: { packName: string; meetingDate: string; build: string },
) {
  return new NextResponse(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${disposition}; filename="${filename}"`,
      "Cache-Control": "public, max-age=3600",
      "X-Northstar-Pack-Name": meta.packName,
      "X-Northstar-Meeting-Date": meta.meetingDate,
      "X-Northstar-Deck-Build": meta.build,
    },
  });
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
