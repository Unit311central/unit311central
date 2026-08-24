import { NextRequest, NextResponse } from "next/server";

import {
  technicalFileActor,
  technicalFileErrorResponse,
} from "@/lib/engineering-technical-files/api-helpers";
import {
  createTechnicalFileWithVersion,
  listTechnicalFiles,
} from "@/lib/engineering-technical-files/service";
import type { TechnicalFileCategory, TechnicalFileStatus } from "@/lib/engineering-technical-files/file-types";
import { requirePlatformSession } from "@/lib/platform-session";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }
  try {
    await requirePlatformSession();
    const params = request.nextUrl.searchParams;
    const files = await listTechnicalFiles(undefined, {
      search: params.get("search") ?? undefined,
      category: params.get("category") ?? undefined,
      status: params.get("status") ?? undefined,
      masterId: params.get("masterId") ?? undefined,
      programRef: params.get("programRef") ?? undefined,
    });
    return NextResponse.json({ files });
  } catch (error) {
    return technicalFileErrorResponse(error, "Failed to load technical files.");
  }
}

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }
  try {
    const session = await requirePlatformSession();
    const body = (await request.json()) as Record<string, unknown>;
    const file = await createTechnicalFileWithVersion(
      {
        fileName: String(body.fileName ?? ""),
        storagePath: String(body.storagePath ?? ""),
        versionId: String(body.versionId ?? ""),
        sizeBytes: Number(body.sizeBytes ?? 0),
        mimeType: typeof body.mimeType === "string" ? body.mimeType : null,
        title: typeof body.title === "string" ? body.title : undefined,
        description: typeof body.description === "string" ? body.description : undefined,
        category: typeof body.category === "string" ? (body.category as TechnicalFileCategory) : undefined,
        status: typeof body.status === "string" ? (body.status as TechnicalFileStatus) : undefined,
        masterId: typeof body.masterId === "string" ? body.masterId : null,
        programRef: typeof body.programRef === "string" ? body.programRef : null,
        productRef: typeof body.productRef === "string" ? body.productRef : null,
        partNumber: typeof body.partNumber === "string" ? body.partNumber : null,
        drawingNumber: typeof body.drawingNumber === "string" ? body.drawingNumber : null,
        revision: typeof body.revision === "string" ? body.revision : undefined,
        tags: Array.isArray(body.tags) ? body.tags.map(String) : undefined,
        notes: typeof body.notes === "string" ? body.notes : undefined,
        changeNotes: typeof body.changeNotes === "string" ? body.changeNotes : undefined,
        relatedFileIds: Array.isArray(body.relatedFileIds) ? body.relatedFileIds.map(String) : undefined,
        sopId: typeof body.sopId === "string" ? body.sopId : null,
      },
      technicalFileActor(session),
    );
    return NextResponse.json({ file }, { status: 201 });
  } catch (error) {
    return technicalFileErrorResponse(error, "Failed to create technical file.");
  }
}
