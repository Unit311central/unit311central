import type { ProjectTask } from "@/lib/project-detail-data";
import {
  getOnwardAirProjectTasks,
  isOnwardAirProjectTaskId,
} from "@/lib/onwardair/project-tasks";
import {
  requireProjectInWorkspace,
  resolveProjectsWorkspaceId,
  updateProject,
  type ProjectsWorkspaceScope,
} from "@/lib/internal-projects-service";
import {
  ensureInternalProjectTasksDescriptionColumn,
  ensureInternalProjectTasksTable,
  withInternalProjectTasksTable,
} from "@/lib/internal-db-migrations";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

type DbTask = {
  id: string;
  project_id: string;
  workspace_id: string;
  name: string;
  description?: string | null;
  start_date: string;
  due_date: string;
  progress: number | string;
  resource: string | null;
  milestone: boolean;
  critical: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

function requireTasksSupabase() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY.");
  }
  return createSupabaseServerClient();
}

export function mapProjectTask(row: DbTask): ProjectTask {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? "",
    startDate: row.start_date,
    dueDate: row.due_date,
    progress: Math.max(0, Math.min(100, Number(row.progress) || 0)),
    resource: row.resource ?? "",
    milestone: Boolean(row.milestone),
    critical: Boolean(row.critical),
  };
}

export function averageTaskProgress(tasks: ProjectTask[]): number {
  if (tasks.length === 0) return 0;
  const sum = tasks.reduce((total, task) => total + task.progress, 0);
  return Math.round((sum / tasks.length) * 100) / 100;
}

function portfolioFixtureTasks(projectId: string): ProjectTask[] | null {
  if (!isOnwardAirProjectTaskId(projectId)) return null;
  return getOnwardAirProjectTasks(projectId);
}

async function syncProjectProgressFromTasks(
  projectId: string,
  workspaceId: string,
  tasks: ProjectTask[],
) {
  const progressPct = averageTaskProgress(tasks);
  try {
    await updateProject(projectId, { progressPct }, { workspaceId });
  } catch {
    // Portfolio / local-only project ids are not in internal_projects — UI still gets progressPct.
  }
  return progressPct;
}

/** Persist OnwardAir fixture tasks so subsequent edits hit real rows. */
async function materializeFixtureTasksIfEmpty(
  projectId: string,
  workspaceId: string,
): Promise<boolean> {
  const fixtures = portfolioFixtureTasks(projectId);
  if (!fixtures?.length) return false;

  const supabase = requireTasksSupabase();
  const { count, error: countError } = await supabase
    .from("internal_project_tasks")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId)
    .eq("workspace_id", workspaceId);

  if (countError) throw new Error(countError.message);
  if ((count ?? 0) > 0) return false;

  await ensureInternalProjectTasksDescriptionColumn().catch(() => false);

  const rows = fixtures.map((task, index) => ({
    id: task.id,
    project_id: projectId,
    workspace_id: workspaceId,
    name: task.name,
    description: task.description || "",
    start_date: task.startDate,
    due_date: task.dueDate,
    progress: task.progress,
    resource: task.resource,
    milestone: task.milestone,
    critical: task.critical,
    sort_order: index,
  }));

  const { error } = await supabase.from("internal_project_tasks").insert(rows);
  if (error) throw new Error(error.message);
  return true;
}

export async function listProjectTasks(
  projectId: string,
  scope?: ProjectsWorkspaceScope,
): Promise<{ tasks: ProjectTask[]; progressPct: number }> {
  await ensureInternalProjectTasksTable();
  return withInternalProjectTasksTable(async () => {
    const workspaceId = await resolveProjectsWorkspaceId(scope);
    // Prefer workspace ownership when the project exists in internal_projects.
    try {
      await requireProjectInWorkspace(projectId, { workspaceId });
    } catch {
      // Allow tasks for portfolio / session project ids within this workspace.
    }
    const supabase = requireTasksSupabase();

    const { data, error } = await supabase
      .from("internal_project_tasks")
      .select("*")
      .eq("project_id", projectId)
      .eq("workspace_id", workspaceId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) throw new Error(error.message);
    let tasks = ((data ?? []) as DbTask[]).map(mapProjectTask);

    if (tasks.length === 0) {
      const fixtures = portfolioFixtureTasks(projectId);
      if (fixtures?.length) {
        tasks = fixtures;
      }
    }

    return { tasks, progressPct: averageTaskProgress(tasks) };
  });
}

export async function createProjectTask(
  projectId: string,
  input: Partial<ProjectTask> & { name: string },
  scope?: ProjectsWorkspaceScope,
): Promise<{ task: ProjectTask; tasks: ProjectTask[]; progressPct: number }> {
  await ensureInternalProjectTasksTable();
  await ensureInternalProjectTasksDescriptionColumn().catch(() => false);
  return withInternalProjectTasksTable(async () => {
    const workspaceId = await resolveProjectsWorkspaceId(scope);
    // Prefer workspace ownership when the project exists in internal_projects.
    try {
      await requireProjectInWorkspace(projectId, { workspaceId });
    } catch {
      // Allow tasks for portfolio / session project ids within this workspace.
    }
    const supabase = requireTasksSupabase();
    await materializeFixtureTasksIfEmpty(projectId, workspaceId);

    const { count } = await supabase
      .from("internal_project_tasks")
      .select("id", { count: "exact", head: true })
      .eq("project_id", projectId)
      .eq("workspace_id", workspaceId);

    const today = new Date().toISOString().slice(0, 10);
    const inTwoWeeks = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    const id = `task-${crypto.randomUUID().slice(0, 10)}`;

    const { data, error } = await supabase
      .from("internal_project_tasks")
      .insert({
        id,
        project_id: projectId,
        workspace_id: workspaceId,
        name: input.name.trim(),
        description: input.description?.trim() || "",
        start_date: input.startDate || today,
        due_date: input.dueDate || inTwoWeeks,
        progress: Math.max(0, Math.min(100, input.progress ?? 0)),
        resource: input.resource?.trim() || "",
        milestone: Boolean(input.milestone),
        critical: Boolean(input.critical),
        sort_order: count ?? 0,
      })
      .select("*")
      .single();

    if (error) throw new Error(error.message);

    const listed = await listProjectTasks(projectId, { workspaceId });
    const progressPct = await syncProjectProgressFromTasks(
      projectId,
      workspaceId,
      listed.tasks,
    );

    return {
      task: mapProjectTask(data as DbTask),
      tasks: listed.tasks,
      progressPct,
    };
  });
}

export async function updateProjectTask(
  projectId: string,
  taskId: string,
  patch: Partial<ProjectTask>,
  scope?: ProjectsWorkspaceScope,
): Promise<{ task: ProjectTask; tasks: ProjectTask[]; progressPct: number }> {
  await ensureInternalProjectTasksTable();
  if (patch.description !== undefined) {
    await ensureInternalProjectTasksDescriptionColumn().catch(() => false);
  }
  return withInternalProjectTasksTable(async () => {
    const workspaceId = await resolveProjectsWorkspaceId(scope);
    // Prefer workspace ownership when the project exists in internal_projects.
    try {
      await requireProjectInWorkspace(projectId, { workspaceId });
    } catch {
      // Allow tasks for portfolio / session project ids within this workspace.
    }
    const supabase = requireTasksSupabase();
    await materializeFixtureTasksIfEmpty(projectId, workspaceId);

    const payload: Record<string, string | number | boolean | null> = {
      updated_at: new Date().toISOString(),
    };
    if (patch.name !== undefined) payload.name = patch.name.trim();
    if (patch.description !== undefined) payload.description = patch.description.trim();
    if (patch.startDate !== undefined) payload.start_date = patch.startDate;
    if (patch.dueDate !== undefined) payload.due_date = patch.dueDate;
    if (patch.progress !== undefined) {
      payload.progress = Math.max(0, Math.min(100, patch.progress));
    }
    if (patch.resource !== undefined) payload.resource = patch.resource.trim();
    if (patch.milestone !== undefined) payload.milestone = Boolean(patch.milestone);
    if (patch.critical !== undefined) payload.critical = Boolean(patch.critical);

    const { data, error } = await supabase
      .from("internal_project_tasks")
      .update(payload)
      .eq("id", taskId)
      .eq("project_id", projectId)
      .eq("workspace_id", workspaceId)
      .select("*")
      .single();

    if (error) throw new Error(error.message);

    const listed = await listProjectTasks(projectId, { workspaceId });
    const progressPct = await syncProjectProgressFromTasks(
      projectId,
      workspaceId,
      listed.tasks,
    );

    return {
      task: mapProjectTask(data as DbTask),
      tasks: listed.tasks,
      progressPct,
    };
  });
}

export async function deleteProjectTask(
  projectId: string,
  taskId: string,
  scope?: ProjectsWorkspaceScope,
): Promise<{ tasks: ProjectTask[]; progressPct: number }> {
  await ensureInternalProjectTasksTable();
  return withInternalProjectTasksTable(async () => {
    const workspaceId = await resolveProjectsWorkspaceId(scope);
    // Prefer workspace ownership when the project exists in internal_projects.
    try {
      await requireProjectInWorkspace(projectId, { workspaceId });
    } catch {
      // Allow tasks for portfolio / session project ids within this workspace.
    }
    const supabase = requireTasksSupabase();
    await materializeFixtureTasksIfEmpty(projectId, workspaceId);

    const { error } = await supabase
      .from("internal_project_tasks")
      .delete()
      .eq("id", taskId)
      .eq("project_id", projectId)
      .eq("workspace_id", workspaceId);

    if (error) throw new Error(error.message);

    const listed = await listProjectTasks(projectId, { workspaceId });
    const progressPct = await syncProjectProgressFromTasks(
      projectId,
      workspaceId,
      listed.tasks,
    );

    return { tasks: listed.tasks, progressPct };
  });
}
