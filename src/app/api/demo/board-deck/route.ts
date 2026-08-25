import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { NextRequest, NextResponse } from "next/server";

import {
  northstarBoardDeckPdfFileName,
  northstarBoardDeckSampleFileNames,
} from "@/lib/demo/northstar-board-pack-model";
import { isDemoApiRequest } from "@/lib/demo/demo-request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function loadStaticBoardDeckSample(meetingDate: string): Promise<Buffer | null> {
  for (const sampleName of northstarBoardDeckSampleFileNames(meetingDate)) {
    try {
      return await readFile(join(process.cwd(), "public", "samples", sampleName));
    } catch {
      /* try next sample name */
    }
  }
  return null;
}

export async function GET(request: NextRequest) {
  try {
    if (!(await isDemoApiRequest())) {
      return NextResponse.json({ error: "Demo host only." }, { status: 403 });
    }

    const meetingDate = request.nextUrl.searchParams.get("meetingDate")?.trim() || "2026-03-20";
    const disposition =
      request.nextUrl.searchParams.get("disposition") === "attachment" ? "attachment" : "inline";
    const filename = northstarBoardDeckPdfFileName(meetingDate);

    const staticBytes = await loadStaticBoardDeckSample(meetingDate);
    if (staticBytes) {
      return pdfResponse(staticBytes, filename, disposition, {
        packName: `Northstar Board Pack — ${meetingDate}`,
        meetingDate,
        build: "static-sample",
      });
    }

    const { generateNorthstarBoardDeck } = await import("@/lib/demo/northstar-board-deck-generator");
    const result = await generateNorthstarBoardDeck(meetingDate);
    return pdfResponse(result.pdfBytes, result.filename, disposition, {
      packName: result.data.packName,
      meetingDate: result.data.meetingDate,
      build: result.build,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate board deck." },
      { status: 500 },
    );
  }
}

function asciiHeaderValue(value: string): string {
  return value.replace(/\u2014/g, "-").replace(/[^\x00-\xFF]/g, "?");
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
      "Content-Disposition": `${disposition}; filename="${asciiHeaderValue(filename)}"`,
      "Cache-Control": "no-store, max-age=0",
      "X-Northstar-Pack-Name": asciiHeaderValue(meta.packName),
      "X-Northstar-Meeting-Date": asciiHeaderValue(meta.meetingDate),
      "X-Northstar-Deck-Build": asciiHeaderValue(meta.build),
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
