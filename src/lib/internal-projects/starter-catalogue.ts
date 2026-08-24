import { getNorthstarDemoProjects } from "@/lib/demo/northstar-projects-data";
import type { InternalProject } from "@/lib/projects-data";
import { createTenancyServerClient } from "@/lib/supabase/tenancy-server";

export type InternalProjectsStarterResult = {
  workspaceId: string;
  inserted: number;
  skipped: boolean;
};

/**
 * Idempotent workspace bootstrap for Project Management.
 * Seeds representative internal/external projects when a workspace has none yet.
 */
export async function ensureInternalProjectsStarterCatalogue(
  workspaceId: string,
): Promise<InternalProjectsStarterResult> {
  const db = createTenancyServerClient();
  const { count, error: countError } = await db
    .from("internal_projects")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspaceId);
  if (countError) throw new Error(countError.message);
  if ((count ?? 0) > 0) {
    return { workspaceId, inserted: 0, skipped: true };
  }

  const catalogue = getNorthstarDemoProjects();
  const payload = catalogue.map((project) => projectToInsert(workspaceId, project));
  const { error } = await db.from("internal_projects").insert(payload);
  if (error) throw new Error(error.message);
  return { workspaceId, inserted: payload.length, skipped: false };
}

function projectToInsert(workspaceId: string, project: InternalProject) {
  return {
    workspace_id: workspaceId,
    name: project.name,
    client_id: project.clientId,
    client_name: project.clientName,
    site: project.site ?? null,
    region: project.region ?? null,
    operator: project.operator ?? null,
    phase: project.phase,
    start_date: project.startDate ?? null,
    end_date: project.endDate ?? null,
    progress_pct: project.progressPct,
    notes: project.notes ?? null,
  };
}
