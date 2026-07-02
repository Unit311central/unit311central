import {
  createBlankWhiteboardProjectInput,
  mapWhiteboardProject,
  mapWhiteboardProjectSummary,
  type WhiteboardProject,
  type WhiteboardProjectSummary,
  type WhiteboardScene,
} from "@/lib/whiteboard-data";
import type { PlatformSession } from "@/lib/platform-auth";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

type DbWhiteboardProject = Parameters<typeof mapWhiteboardProject>[0];

function requireWhiteboardSupabase() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY.");
  }
  return createSupabaseServerClient();
}

export async function listWhiteboardProjects(): Promise<WhiteboardProjectSummary[]> {
  const supabase = requireWhiteboardSupabase();
  const { data, error } = await supabase
    .from("whiteboard_projects")
    .select("id, name, owner_user_id, owner_name, created_at, updated_at")
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data as DbWhiteboardProject[]).map(mapWhiteboardProjectSummary);
}

export async function getWhiteboardProject(id: string): Promise<WhiteboardProject | null> {
  const supabase = requireWhiteboardSupabase();
  const { data, error } = await supabase.from("whiteboard_projects").select("*").eq("id", id).maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  return mapWhiteboardProject(data as DbWhiteboardProject);
}

export async function createWhiteboardProject(
  session: PlatformSession,
  input?: Partial<{ name: string; scene: WhiteboardScene }>,
): Promise<WhiteboardProject> {
  const supabase = requireWhiteboardSupabase();
  const blank = createBlankWhiteboardProjectInput(input?.name);

  const { data, error } = await supabase
    .from("whiteboard_projects")
    .insert({
      name: (input?.name ?? blank.name).trim() || "New project",
      owner_user_id: session.sub,
      owner_name: session.displayName,
      scene: input?.scene ?? blank.scene,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return mapWhiteboardProject(data as DbWhiteboardProject);
}

export async function updateWhiteboardProject(
  id: string,
  patch: Partial<{ name: string; ownerName: string; scene: WhiteboardScene }>,
): Promise<WhiteboardProject> {
  const supabase = requireWhiteboardSupabase();
  const payload: Record<string, string | WhiteboardScene> = {
    updated_at: new Date().toISOString(),
  };

  if (patch.name !== undefined) payload.name = patch.name.trim() || "New project";
  if (patch.ownerName !== undefined) payload.owner_name = patch.ownerName.trim() || "Unknown";
  if (patch.scene !== undefined) payload.scene = patch.scene;

  const { data, error } = await supabase
    .from("whiteboard_projects")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return mapWhiteboardProject(data as DbWhiteboardProject);
}

export async function deleteWhiteboardProject(id: string) {
  const supabase = requireWhiteboardSupabase();
  const { error } = await supabase.from("whiteboard_projects").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
