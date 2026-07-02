import {
  mapInternalProject,
  type InternalProject,
  type ProjectPhase,
} from "@/lib/projects-data";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

type DbProject = Parameters<typeof mapInternalProject>[0];

function requireProjectsSupabase() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY.");
  }
  return createSupabaseServerClient();
}

export async function listProjects(): Promise<InternalProject[]> {
  const supabase = requireProjectsSupabase();
  const { data, error } = await supabase
    .from("internal_projects")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data as DbProject[]).map(mapInternalProject);
}

export async function createProject(input: {
  name: string;
  clientId?: string;
  clientName: string;
  site?: string;
  region?: string;
  operator?: string;
  phase?: ProjectPhase;
  startDate?: string | null;
  endDate?: string | null;
  notes?: string;
}): Promise<InternalProject> {
  const supabase = requireProjectsSupabase();
  const phase = input.phase ?? "upcoming";
  const progressPct = phase === "live" ? 0 : 0;

  const { data, error } = await supabase
    .from("internal_projects")
    .insert({
      name: input.name.trim(),
      client_id: input.clientId?.trim() || null,
      client_name: input.clientName.trim(),
      site: input.site?.trim() || null,
      region: input.region?.trim() || null,
      operator: input.operator?.trim() || null,
      phase,
      start_date: input.startDate || null,
      end_date: input.endDate || null,
      progress_pct: progressPct,
      notes: input.notes?.trim() || null,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return mapInternalProject(data as DbProject);
}

export async function deleteProject(id: string) {
  const supabase = requireProjectsSupabase();
  const { error } = await supabase.from("internal_projects").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
