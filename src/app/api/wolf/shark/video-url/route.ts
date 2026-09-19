import { NextResponse } from "next/server";

import { SHARK_BUCKET, SHARK_TEST_VIDEOS } from "@/lib/wolf/shark/constants";
import { createSupabaseServiceRoleClient, isSupabaseServiceRoleConfigured } from "@/lib/supabase/server";
import { requireWolfCentralWorkspace } from "@/lib/wolf/wolf-central-auth";

export const dynamic = "force-dynamic";

const ALLOWED = new Set(SHARK_TEST_VIDEOS.map((v) => v.id));

export async function GET(request: Request) {
  try {
    await requireWolfCentralWorkspace();
    const video = new URL(request.url).searchParams.get("video")?.trim();
    if (!video || !ALLOWED.has(video as "base.mp4" | "shark.mp4")) {
      return NextResponse.json({ error: "Invalid video" }, { status: 400 });
    }
    if (!isSupabaseServiceRoleConfigured()) {
      return NextResponse.json({ error: "Storage not configured" }, { status: 503 });
    }
    const supabase = createSupabaseServiceRoleClient();
    const { data, error } = await supabase.storage
      .from(SHARK_BUCKET)
      .createSignedUrl(video, 60 * 60);
    if (error || !data?.signedUrl) {
      return NextResponse.json({ error: error?.message ?? "Could not sign URL" }, { status: 500 });
    }
    return NextResponse.json({ url: data.signedUrl, video });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
