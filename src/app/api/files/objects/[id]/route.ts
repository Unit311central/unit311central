import { NextRequest, NextResponse } from "next/server";

import { deleteFile, getFileDownloadUrl, updateFile } from "@/lib/internal-files-service";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    const { id } = await context.params;
    const download = await getFileDownloadUrl(id);
    return NextResponse.json(download);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get download URL";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    const { id } = await context.params;
    const body = (await request.json()) as {
      name?: string;
      folderId?: string | null;
      categoryId?: string | null;
    };

    const file = await updateFile(id, {
      name: body.name,
      folderId: body.folderId,
      categoryId: body.categoryId,
    });

    return NextResponse.json({ file });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update file";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    const { id } = await context.params;
    await deleteFile(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete file";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
