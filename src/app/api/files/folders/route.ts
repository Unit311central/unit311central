import { NextRequest, NextResponse } from "next/server";

import { createFolder, listAllFolders } from "@/lib/internal-files-service";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    const folders = await listAllFolders();
    return NextResponse.json({ folders });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list folders";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    const body = (await request.json()) as {
      name?: string;
      parentId?: string | null;
      categoryId?: string | null;
    };

    if (!body.name?.trim()) {
      return NextResponse.json({ error: "Folder name is required" }, { status: 400 });
    }

    const folder = await createFolder(body.name, body.parentId ?? null, body.categoryId ?? null);
    return NextResponse.json({ folder });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create folder";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
