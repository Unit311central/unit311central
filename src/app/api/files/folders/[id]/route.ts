import { NextRequest, NextResponse } from "next/server";

import { deleteFolder, updateFolder } from "@/lib/internal-files-service";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    const { id } = await context.params;
    const body = (await request.json()) as {
      name?: string;
      parentId?: string | null;
      categoryId?: string | null;
    };

    const folder = await updateFolder(id, {
      name: body.name,
      parentId: body.parentId,
      categoryId: body.categoryId,
    });

    return NextResponse.json({ folder });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update folder";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    const { id } = await context.params;
    await deleteFolder(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete folder";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
