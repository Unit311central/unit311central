import { NextRequest, NextResponse } from "next/server";

import { uploadFile } from "@/lib/internal-files-service";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const folderId = formData.get("folderId");
    const categoryId = formData.get("categoryId");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    const saved = await uploadFile({
      file,
      folderId: typeof folderId === "string" && folderId ? folderId : null,
      categoryId: typeof categoryId === "string" && categoryId ? categoryId : null,
    });

    return NextResponse.json({ file: saved });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to upload file";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
