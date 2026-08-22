import { createTenancyServerClient } from "@/lib/supabase/tenancy-server";
import type { QaTaskScope, QaTaskStatus } from "@/lib/qa-workspace/constants";
import { inferScopeFromLegacyTask } from "@/lib/qa-workspace/scope";
import type {
  QaWorkspaceTask,
  QaWorkspaceTaskFilters,
  QaWorkspaceTaskInput,
} from "@/lib/qa-workspace/types";

type QaTaskRow = {
  id: string;
  workspace_id: string;
  scope?: string | null;
  status: string;
  completed: boolean;
  module_label: string;
  module_id: string | null;
  page_label: string;
  page_view_id: string | null;
  route_path: string | null;
  element_label: string;
  element_type: string | null;
  element_id: string | null;
  description: string;
  created_by: string | null;
  created_by_email: string | null;
  created_at: string;
  updated_at: string;
};

function mapRow(row: QaTaskRow): QaWorkspaceTask {
  const scope = inferScopeFromLegacyTask({
    scope: row.scope,
    elementLabel: row.element_label,
    elementType: row.element_type,
  });

  return {
    id: row.id,
    workspaceId: row.workspace_id,
    scope,
    status: row.status === "completed" ? "completed" : "open",
    completed: Boolean(row.completed),
    moduleLabel: row.module_label,
    moduleId: row.module_id,
    pageLabel: row.page_label,
    pageViewId: row.page_view_id,
    routePath: row.route_path,
    elementLabel: row.element_label,
    elementType: row.element_type,
    elementId: row.element_id,
    description: row.description,
    createdBy: row.created_by,
    createdByEmail: row.created_by_email,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function normalizeStatus(input: { completed?: boolean; status?: QaTaskStatus }): {
  completed: boolean;
  status: QaTaskStatus;
} {
  if (input.status === "completed" || input.completed === true) {
    return { completed: true, status: "completed" };
  }
  if (input.status === "open" || input.completed === false) {
    return { completed: false, status: "open" };
  }
  return { completed: false, status: "open" };
}

export async function listQaWorkspaceTasks(
  workspaceId: string,
  filters: QaWorkspaceTaskFilters = {},
): Promise<QaWorkspaceTask[]> {
  const supabase = createTenancyServerClient();
  let query = supabase
    .from("qa_workspace_tasks")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (filters.scope && filters.scope !== "all") query = query.eq("scope", filters.scope);
  if (filters.moduleLabel) query = query.eq("module_label", filters.moduleLabel);
  if (filters.pageLabel) query = query.eq("page_label", filters.pageLabel);
  if (filters.elementType) query = query.eq("element_type", filters.elementType);
  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message || "Failed to load QA tasks.");
  return (data ?? []).map((row) => mapRow(row as QaTaskRow));
}

export async function createQaWorkspaceTask(
  workspaceId: string,
  input: QaWorkspaceTaskInput,
  actor?: { userId?: string | null; email?: string | null },
): Promise<QaWorkspaceTask> {
  const supabase = createTenancyServerClient();
  const status = normalizeStatus(input);
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("qa_workspace_tasks")
    .insert({
      workspace_id: workspaceId,
      scope: input.scope,
      status: status.status,
      completed: status.completed,
      module_label: input.moduleLabel.trim(),
      module_id: input.moduleId?.trim() || null,
      page_label: input.pageLabel.trim(),
      page_view_id: input.pageViewId?.trim() || null,
      route_path: input.routePath?.trim() || null,
      element_label: input.elementLabel.trim(),
      element_type: input.elementType?.trim() || null,
      element_id: input.elementId?.trim() || null,
      description: input.description.trim(),
      created_by: actor?.userId ?? null,
      created_by_email: actor?.email?.trim().toLowerCase() ?? null,
      created_at: now,
      updated_at: now,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message || "Failed to create QA task.");
  return mapRow(data as QaTaskRow);
}

export async function updateQaWorkspaceTask(
  workspaceId: string,
  taskId: string,
  patch: Partial<QaWorkspaceTaskInput>,
): Promise<QaWorkspaceTask> {
  const supabase = createTenancyServerClient();
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (patch.scope !== undefined) update.scope = patch.scope;
  if (patch.moduleLabel !== undefined) update.module_label = patch.moduleLabel.trim();
  if (patch.moduleId !== undefined) update.module_id = patch.moduleId?.trim() || null;
  if (patch.pageLabel !== undefined) update.page_label = patch.pageLabel.trim();
  if (patch.pageViewId !== undefined) update.page_view_id = patch.pageViewId?.trim() || null;
  if (patch.routePath !== undefined) update.route_path = patch.routePath?.trim() || null;
  if (patch.elementLabel !== undefined) update.element_label = patch.elementLabel.trim();
  if (patch.elementType !== undefined) update.element_type = patch.elementType?.trim() || null;
  if (patch.elementId !== undefined) update.element_id = patch.elementId?.trim() || null;
  if (patch.description !== undefined) update.description = patch.description.trim();

  if (patch.status !== undefined || patch.completed !== undefined) {
    const status = normalizeStatus(patch);
    update.status = status.status;
    update.completed = status.completed;
  }

  const { data, error } = await supabase
    .from("qa_workspace_tasks")
    .update(update)
    .eq("workspace_id", workspaceId)
    .eq("id", taskId)
    .select("*")
    .maybeSingle();

  if (error) throw new Error(error.message || "Failed to update QA task.");
  if (!data) throw new Error("QA task not found.");
  return mapRow(data as QaTaskRow);
}

export async function deleteQaWorkspaceTask(workspaceId: string, taskId: string): Promise<void> {
  const supabase = createTenancyServerClient();
  const { error } = await supabase
    .from("qa_workspace_tasks")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("id", taskId);
  if (error) throw new Error(error.message || "Failed to delete QA task.");
}

export async function getQaWorkspaceTask(
  workspaceId: string,
  taskId: string,
): Promise<QaWorkspaceTask | null> {
  const supabase = createTenancyServerClient();
  const { data, error } = await supabase
    .from("qa_workspace_tasks")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("id", taskId)
    .maybeSingle();
  if (error) throw new Error(error.message || "Failed to load QA task.");
  return data ? mapRow(data as QaTaskRow) : null;
}
