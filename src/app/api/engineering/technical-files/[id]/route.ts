import { NextRequest, NextResponse } from "next/server";

import {
  technicalFileActor,
  technicalFileErrorResponse,
} from "@/lib/engineering-technical-files/api-helpers";
import type { TechnicalFileCategory, TechnicalFileStatus } from "@/lib/engineering-technical-files/file-types";
import {
  archiveTechnicalFile,
  getTechnicalFileById,
  updateTechnicalFileMetadata,
} from "@/lib/engineering-technical-files/service";
import { requirePlatformSession } from "@/lib/platform-session";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }
  try {
    await requirePlatformSession();
    const { id } = await context.params;
    const file = await getTechnicalFileById(id);
    if (!file) return NextResponse.json({ error: "Technical file not found." }, { status: 404 });
    return NextResponse.json({ file });
  } catch (error) {
    return technicalFileErrorResponse(error, "Failed to load technical file.");
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }
  try {
    const session = await requirePlatformSession();
    const { id } = await context.params;
    const body = (await request.json()) as Record<string, unknown>;
    const file = await updateTechnicalFileMetadata(
      id,
      {
        title: typeof body.title === "string" ? body.title : undefined,
        description: typeof body.description === "string" ? body.description : undefined,
        category: typeof body.category === "string" ? (body.category as TechnicalFileCategory) : undefined,
        status: typeof body.status === "string" ? (body.status as TechnicalFileStatus) : undefined,
        masterId:
          body.masterId === null ? null : typeof body.masterId === "string" ? body.masterId : undefined,
        programRef: typeof body.programRef === "string" ? body.programRef : undefined,
        productRef: typeof body.productRef === "string" ? body.productRef : undefined,
        partNumber: typeof body.partNumber === "string" ? body.partNumber : undefined,
        drawingNumber: typeof body.drawingNumber === "string" ? body.drawingNumber : undefined,
        tags: Array.isArray(body.tags) ? body.tags.map(String) : undefined,
        notes: typeof body.notes === "string" ? body.notes : undefined,
        relatedFileIds: Array.isArray(body.relatedFileIds) ? body.relatedFileIds.map(String) : undefined,
        sopId: body.sopId === null ? null : typeof body.sopId === "string" ? body.sopId : undefined,
      },
      technicalFileActor(session),
    );
    return NextResponse.json({ file });
  } catch (error) {
    return technicalFileErrorResponse(error, "Failed to update technical file.");
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }
  try {
    const session = await requirePlatformSession();
    const { id } = await context.params;
    const file = await archiveTechnicalFile(id, technicalFileActor(session));
    return NextResponse.json({ file });
  } catch (error) {
    return technicalFileErrorResponse(error, "Failed to archive technical file.");
  }
}
