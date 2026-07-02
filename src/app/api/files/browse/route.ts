import { NextRequest, NextResponse } from "next/server";

import { browseFolder } from "@/lib/internal-files-service";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY." },
      { status: 503 },
    );
  }

  try {
    const folderId = request.nextUrl.searchParams.get("folderId");
    const query = request.nextUrl.searchParams.get("q") ?? undefined;
    const categoryId = request.nextUrl.searchParams.get("categoryId");

    const result = await browseFolder({
      folderId: folderId || null,
      query,
      categoryId: categoryId || null,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to browse files";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
