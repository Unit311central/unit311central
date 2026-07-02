import { NextRequest, NextResponse } from "next/server";

import { prepareFileUpload } from "@/lib/internal-files-service";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    const body = (await request.json()) as {
      name?: string;
      size?: number;
      folderId?: string | null;
    };

    if (!body.name?.trim()) {
      return NextResponse.json({ error: "File name is required" }, { status: 400 });
    }

    if (!body.size || body.size <= 0) {
      return NextResponse.json({ error: "File size is required" }, { status: 400 });
    }

    const upload = await prepareFileUpload({
      name: body.name,
      size: body.size,
      folderId: typeof body.folderId === "string" && body.folderId ? body.folderId : null,
    });

    return NextResponse.json(upload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to prepare upload";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
