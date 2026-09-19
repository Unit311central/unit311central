import "server-only";

import { createSupabaseServiceRoleClient, isSupabaseServiceRoleConfigured } from "@/lib/supabase/server";
import type { SharkTestResultPayload } from "@/lib/wolf/shark/types";

export async function persistSharkTestResult(
  jobId: string,
  video: string,
  result: SharkTestResultPayload | null | undefined,
): Promise<void> {
  if (!result || !isSupabaseServiceRoleConfigured()) return;
  const supabase = createSupabaseServiceRoleClient();
  const expected =
    video === "base.mp4" ? 0 : video === "shark.mp4" ? 5 : result.expected_visible_sharks;

  const { error } = await supabase.from("shark_test_results").upsert({
    id: jobId,
    video_name: video,
    expected_visible_sharks: expected,
    frames_analysed: result.frames_analysed,
    wolf_unique_tracks: result.wolf_unique_tracks,
    processing_seconds: result.processing_seconds,
    result_json: result,
  });
  if (error) {
    console.warn("[shark] persist shark_test_results:", error.message);
  }
}

export async function listPersistedSharkResults(limit = 20) {
  if (!isSupabaseServiceRoleConfigured()) return [];
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("shark_test_results")
    .select("id, video_name, expected_visible_sharks, wolf_unique_tracks, processing_seconds, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return data ?? [];
}
