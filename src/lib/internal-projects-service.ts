import {
  mapInternalProject,
  type InternalProject,
  type ProjectPhase,
} from "@/lib/projects-data";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { requireCurrentWorkspace } from "@/lib/workspace-context";

type DbProject = Parameters<typeof mapInternalProject>[0];

export type ProjectsWorkspaceScope = {
  /** Explicit override for system callers. Prefer omit to use session context. */
  workspaceId?: string | null;
};

function requireProjectsSupabase() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY.");
  }
  return createSupabaseServerClient();
}

/**
 * Resolve the tenant key for Projects module operations.
 * Uses requireCurrentWorkspace() unless an explicit workspaceId is provided.
 */
export async function resolveProjectsWorkspaceId(
  scope?: ProjectsWorkspaceScope,
): Promise<string> {
  const explicit = scope?.workspaceId?.trim();
  if (explicit) return explicit;
  const workspace = await requireCurrentWorkspace();
  return workspace.id;
}

function normalizeCompanyKey(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\b(limited|ltd|llc|inc|plc|co\.?|company)\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** PRM-001: keep internal_clients.active_projects aligned with linked projects. */
export async function syncClientActiveProjects(
  clientId: string | null | undefined,
  workspaceId: string,
): Promise<number> {
  const id = clientId?.trim();
  if (!id) return 0;

  const supabase = requireProjectsSupabase();
  const { count, error } = await supabase
    .from("internal_projects")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspaceId)
    .eq("client_id", id);

  if (error) throw new Error(error.message);

  const activeProjects = count ?? 0;
  const { error: updateError } = await supabase
    .from("internal_clients")
    .update({ active_projects: activeProjects })
    .eq("id", id)
    .eq("workspace_id", workspaceId);

  if (updateError) throw new Error(updateError.message);
  return activeProjects;
}

async function resolveClientLink(
  workspaceId: string,
  input: { clientId?: string; clientName: string },
): Promise<{ clientId: string | null; clientName: string }> {
  const supabase = requireProjectsSupabase();
  const requestedId = input.clientId?.trim() || "";
  const requestedName = input.clientName.trim();

  if (requestedId) {
    const { data } = await supabase
      .from("internal_clients")
      .select("id, company_name")
      .eq("workspace_id", workspaceId)
      .eq("id", requestedId)
      .maybeSingle();
    if (data?.id) {
      return {
        clientId: data.id as string,
        clientName: (data.company_name as string) || requestedName || "Unassigned",
      };
    }
  }

  if (!requestedName || requestedName.toLowerCase() === "unassigned") {
    return { clientId: null, clientName: requestedName || "Unassigned" };
  }

  const { data: clients, error } = await supabase
    .from("internal_clients")
    .select("id, company_name")
    .eq("workspace_id", workspaceId);

  if (error) throw new Error(error.message);

  const target = normalizeCompanyKey(requestedName);
  const match = (clients ?? []).find(
    (row) => normalizeCompanyKey(String(row.company_name ?? "")) === target,
  );

  if (match?.id) {
    return {
      clientId: match.id as string,
      clientName: (match.company_name as string) || requestedName,
    };
  }

  return { clientId: null, clientName: requestedName };
}

export async function listProjects(scope?: ProjectsWorkspaceScope): Promise<InternalProject[]> {
  const workspaceId = await resolveProjectsWorkspaceId(scope);
  const supabase = requireProjectsSupabase();
  const { data, error } = await supabase
    .from("internal_projects")
    .select(
      "id,name,client_id,client_name,site,region,operator,phase,start_date,end_date,progress_pct,notes,created_at,updated_at",
    )
    .eq("workspace_id", workspaceId)
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data as DbProject[]).map(mapInternalProject);
}

export async function getProject(
  id: string,
  scope?: ProjectsWorkspaceScope,
): Promise<InternalProject | null> {
  const workspaceId = await resolveProjectsWorkspaceId(scope);
  const supabase = requireProjectsSupabase();
  const { data, error } = await supabase
    .from("internal_projects")
    .select("*")
    .eq("id", id)
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? mapInternalProject(data as DbProject) : null;
}

/** Throws if the project is missing or belongs to another workspace. */
export async function requireProjectInWorkspace(
  id: string,
  scope?: ProjectsWorkspaceScope,
): Promise<InternalProject> {
  const project = await getProject(id, scope);
  if (!project) {
    throw new Error("Project not found.");
  }
  return project;
}

export async function createProject(
  input: {
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
    workspaceId?: string;
  },
  scope?: ProjectsWorkspaceScope,
): Promise<InternalProject> {
  const workspaceId = await resolveProjectsWorkspaceId({
    workspaceId: input.workspaceId ?? scope?.workspaceId,
  });
  const supabase = requireProjectsSupabase();
  const phase = input.phase ?? "upcoming";
  const progressPct = phase === "live" ? 0 : 0;
  const linked = await resolveClientLink(workspaceId, {
    clientId: input.clientId,
    clientName: input.clientName,
  });

  const { data, error } = await supabase
    .from("internal_projects")
    .insert({
      workspace_id: workspaceId,
      name: input.name.trim(),
      client_id: linked.clientId,
      client_name: linked.clientName,
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

  await syncClientActiveProjects(linked.clientId, workspaceId).catch(() => {
    // Project create must not fail if the derived counter write is blocked.
  });

  return mapInternalProject(data as DbProject);
}

export async function deleteProject(id: string, scope?: ProjectsWorkspaceScope) {
  const workspaceId = await resolveProjectsWorkspaceId(scope);
  const existing = await requireProjectInWorkspace(id, { workspaceId });
  const supabase = requireProjectsSupabase();
  const { error } = await supabase
    .from("internal_projects")
    .delete()
    .eq("id", id)
    .eq("workspace_id", workspaceId);
  if (error) throw new Error(error.message);

  await syncClientActiveProjects(existing.clientId, workspaceId).catch(() => {
    // Delete succeeded; counter refresh is best-effort.
  });
}
