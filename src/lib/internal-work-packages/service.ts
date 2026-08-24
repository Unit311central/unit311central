import type {
  WorkPackageDetail,
  WorkPackageListItem,
  WorkPackageMember,
  WorkPackagePriority,
  WorkPackageStatus,
  WorkPackageTask,
  WorkPackageTaskStatus,
} from "@/lib/internal-work-packages/types";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { createTenancyServerClient } from "@/lib/supabase/tenancy-server";
import { requireCurrentWorkspace } from "@/lib/workspace-context";

export type WorkPackageActor = { userId?: string | null; displayName: string };
export type WorkPackageWorkspaceScope = { workspaceId?: string };

function db() {
  if (!isSupabaseConfigured()) throw new Error("Supabase is not configured.");
  return createTenancyServerClient();
}

async function workspaceId(scope?: WorkPackageWorkspaceScope) {
  if (scope?.workspaceId?.trim()) return scope.workspaceId.trim();
  return (await requireCurrentWorkspace()).id;
}

function mapMember(row: Record<string, unknown>): WorkPackageMember {
  return {
    id: String(row.id),
    userId: row.user_id ? String(row.user_id) : null,
    displayName: String(row.display_name ?? ""),
  };
}

function mapTask(row: Record<string, unknown>): WorkPackageTask {
  return {
    id: String(row.id),
    taskCode: String(row.task_code),
    category: String(row.category ?? ""),
    description: String(row.description ?? ""),
    assignedToUserId: row.assigned_to_user_id ? String(row.assigned_to_user_id) : null,
    assignedToName: String(row.assigned_to_name ?? ""),
    startDate: row.start_date ? String(row.start_date) : null,
    expectedCompletionDate: row.expected_completion_date ? String(row.expected_completion_date) : null,
    finished: Boolean(row.finished),
    finishedAt: row.finished_at ? String(row.finished_at) : null,
    status: String(row.status) as WorkPackageTaskStatus,
    priority: String(row.priority) as WorkPackagePriority,
    notes: String(row.notes ?? ""),
  };
}

function mapListItem(
  row: Record<string, unknown>,
  counts?: { teamCount: number; taskCount: number; completedTaskCount: number },
): WorkPackageListItem {
  return {
    id: String(row.id),
    packageCode: String(row.package_code),
    name: String(row.name),
    description: String(row.description ?? ""),
    status: String(row.status) as WorkPackageStatus,
    priority: String(row.priority) as WorkPackagePriority,
    ownerUserId: row.owner_user_id ? String(row.owner_user_id) : null,
    ownerName: String(row.owner_name ?? ""),
    createdByName: String(row.created_by_name ?? ""),
    startDate: row.start_date ? String(row.start_date) : null,
    expectedCompletionDate: row.expected_completion_date ? String(row.expected_completion_date) : null,
    actualCompletionDate: row.actual_completion_date ? String(row.actual_completion_date) : null,
    progressPct: Number(row.progress_pct ?? 0),
    teamCount: counts?.teamCount ?? 0,
    taskCount: counts?.taskCount ?? 0,
    completedTaskCount: counts?.completedTaskCount ?? 0,
    updatedAt: String(row.updated_at),
  };
}

async function nextPackageCode(ws: string) {
  const { data, error } = await db()
    .from("internal_work_packages")
    .select("package_code")
    .eq("workspace_id", ws)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);
  let max = 0;
  for (const row of data ?? []) {
    const match = String(row.package_code).match(/^WP-(\d+)$/i);
    if (match) max = Math.max(max, Number(match[1]));
  }
  return `WP-${String(max + 1).padStart(4, "0")}`;
}

async function nextTaskCode(ws: string, packageId: string, packageCode: string) {
  const { data, error } = await db()
    .from("internal_work_package_tasks")
    .select("task_code")
    .eq("workspace_id", ws)
    .eq("work_package_id", packageId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  let max = 0;
  const prefix = `${packageCode}-T`;
  for (const row of data ?? []) {
    const code = String(row.task_code);
    if (!code.startsWith(prefix)) continue;
    const match = code.match(/-T(\d+)$/i);
    if (match) max = Math.max(max, Number(match[1]));
  }
  return `${packageCode}-T${String(max + 1).padStart(2, "0")}`;
}

async function recalculateProgress(ws: string, packageId: string) {
  const { data: tasks, error } = await db()
    .from("internal_work_package_tasks")
    .select("finished")
    .eq("workspace_id", ws)
    .eq("work_package_id", packageId);
  if (error) throw new Error(error.message);
  const total = tasks?.length ?? 0;
  const completed = (tasks ?? []).filter((t) => Boolean(t.finished)).length;
  const progressPct = total === 0 ? 0 : Math.round((completed / total) * 1000) / 10;
  await db()
    .from("internal_work_packages")
    .update({
      progress_pct: progressPct,
      updated_at: new Date().toISOString(),
      ...(total > 0 && completed === total
        ? {
            status: "Complete",
            actual_completion_date: new Date().toISOString().slice(0, 10),
          }
        : {}),
    })
    .eq("workspace_id", ws)
    .eq("id", packageId);
  return { total, completed, progressPct };
}

export async function listWorkPackages(
  scope?: WorkPackageWorkspaceScope,
  filters?: {
    search?: string;
    status?: string;
    owner?: string;
    priority?: string;
    teamMember?: string;
  },
) {
  const ws = await workspaceId(scope);
  const { data, error } = await db()
    .from("internal_work_packages")
    .select("*")
    .eq("workspace_id", ws)
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);

  const packageIds = (data ?? []).map((row) => String(row.id));
  const memberCounts = new Map<string, number>();
  const taskCounts = new Map<string, { total: number; completed: number }>();

  if (packageIds.length) {
    const [{ data: members }, { data: tasks }] = await Promise.all([
      db()
        .from("internal_work_package_members")
        .select("work_package_id")
        .eq("workspace_id", ws)
        .in("work_package_id", packageIds),
      db()
        .from("internal_work_package_tasks")
        .select("work_package_id, finished")
        .eq("workspace_id", ws)
        .in("work_package_id", packageIds),
    ]);
    for (const row of members ?? []) {
      const id = String(row.work_package_id);
      memberCounts.set(id, (memberCounts.get(id) ?? 0) + 1);
    }
    for (const row of tasks ?? []) {
      const id = String(row.work_package_id);
      const current = taskCounts.get(id) ?? { total: 0, completed: 0 };
      current.total += 1;
      if (row.finished) current.completed += 1;
      taskCounts.set(id, current);
    }
  }

  let items = (data ?? []).map((row) => {
    const id = String(row.id);
    const counts = taskCounts.get(id);
    return mapListItem(row, {
      teamCount: memberCounts.get(id) ?? 0,
      taskCount: counts?.total ?? 0,
      completedTaskCount: counts?.completed ?? 0,
    });
  });

  const q = filters?.search?.trim().toLowerCase();
  if (q) {
    items = items.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.packageCode.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.ownerName.toLowerCase().includes(q),
    );
  }
  if (filters?.status && filters.status !== "All") {
    items = items.filter((item) => item.status === filters.status);
  }
  if (filters?.owner?.trim()) {
    const owner = filters.owner.trim().toLowerCase();
    items = items.filter((item) => item.ownerName.toLowerCase().includes(owner));
  }
  if (filters?.priority && filters.priority !== "All") {
    items = items.filter((item) => item.priority === filters.priority);
  }
  if (filters?.teamMember?.trim()) {
    const needle = filters.teamMember.trim().toLowerCase();
    const matchingIds = new Set<string>();
    if (packageIds.length) {
      const { data: members } = await db()
        .from("internal_work_package_members")
        .select("work_package_id, display_name")
        .eq("workspace_id", ws)
        .in("work_package_id", packageIds);
      for (const row of members ?? []) {
        if (String(row.display_name).toLowerCase().includes(needle)) {
          matchingIds.add(String(row.work_package_id));
        }
      }
    }
    items = items.filter((item) => matchingIds.has(item.id));
  }

  return items;
}

export async function getWorkPackageById(id: string, scope?: WorkPackageWorkspaceScope) {
  const ws = await workspaceId(scope);
  const { data, error } = await db()
    .from("internal_work_packages")
    .select("*")
    .eq("workspace_id", ws)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;

  const [{ data: members }, { data: tasks }] = await Promise.all([
    db()
      .from("internal_work_package_members")
      .select("*")
      .eq("workspace_id", ws)
      .eq("work_package_id", id)
      .order("created_at", { ascending: true }),
    db()
      .from("internal_work_package_tasks")
      .select("*")
      .eq("workspace_id", ws)
      .eq("work_package_id", id)
      .order("created_at", { ascending: true }),
  ]);

  const taskRows = tasks ?? [];
  const completed = taskRows.filter((t) => Boolean(t.finished)).length;
  const base = mapListItem(data, {
    teamCount: members?.length ?? 0,
    taskCount: taskRows.length,
    completedTaskCount: completed,
  });

  return {
    ...base,
    notes: String(data.notes ?? ""),
    members: (members ?? []).map(mapMember),
    tasks: taskRows.map(mapTask),
  } satisfies WorkPackageDetail;
}

export async function createWorkPackage(
  input: {
    name: string;
    description?: string;
    status?: WorkPackageStatus;
    priority?: WorkPackagePriority;
    ownerUserId?: string | null;
    ownerName?: string;
    startDate?: string | null;
    expectedCompletionDate?: string | null;
    notes?: string;
    memberUserIds?: Array<{ userId?: string | null; displayName: string }>;
  },
  actor: WorkPackageActor,
  scope?: WorkPackageWorkspaceScope,
) {
  const ws = await workspaceId(scope);
  const packageCode = await nextPackageCode(ws);
  const now = new Date().toISOString();
  const { data, error } = await db()
    .from("internal_work_packages")
    .insert({
      workspace_id: ws,
      package_code: packageCode,
      name: input.name.trim(),
      description: input.description?.trim() ?? "",
      status: input.status ?? "Not Started",
      priority: input.priority ?? "Normal",
      owner_user_id: input.ownerUserId ?? actor.userId ?? null,
      owner_name: input.ownerName?.trim() || actor.displayName,
      created_by_user_id: actor.userId ?? null,
      created_by_name: actor.displayName,
      start_date: input.startDate ?? null,
      expected_completion_date: input.expectedCompletionDate ?? null,
      notes: input.notes?.trim() ?? "",
      created_at: now,
      updated_at: now,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  const members = input.memberUserIds ?? [];
  if (members.length) {
    await db().from("internal_work_package_members").insert(
      members.map((member) => ({
        workspace_id: ws,
        work_package_id: data.id,
        user_id: member.userId ?? null,
        display_name: member.displayName.trim(),
      })),
    );
  }

  return getWorkPackageById(String(data.id), { workspaceId: ws });
}

export async function updateWorkPackage(
  id: string,
  patch: Partial<{
    name: string;
    description: string;
    status: WorkPackageStatus;
    priority: WorkPackagePriority;
    ownerUserId: string | null;
    ownerName: string;
    startDate: string | null;
    expectedCompletionDate: string | null;
    actualCompletionDate: string | null;
    notes: string;
  }>,
  scope?: WorkPackageWorkspaceScope,
) {
  const ws = await workspaceId(scope);
  const existing = await getWorkPackageById(id, { workspaceId: ws });
  if (!existing) throw new Error("Work package not found.");

  const { error } = await db()
    .from("internal_work_packages")
    .update({
      name: patch.name ?? existing.name,
      description: patch.description ?? existing.description,
      status: patch.status ?? existing.status,
      priority: patch.priority ?? existing.priority,
      owner_user_id: patch.ownerUserId !== undefined ? patch.ownerUserId : existing.ownerUserId,
      owner_name: patch.ownerName ?? existing.ownerName,
      start_date: patch.startDate !== undefined ? patch.startDate : existing.startDate,
      expected_completion_date:
        patch.expectedCompletionDate !== undefined
          ? patch.expectedCompletionDate
          : existing.expectedCompletionDate,
      actual_completion_date:
        patch.actualCompletionDate !== undefined
          ? patch.actualCompletionDate
          : existing.actualCompletionDate,
      notes: patch.notes ?? existing.notes,
      updated_at: new Date().toISOString(),
    })
    .eq("workspace_id", ws)
    .eq("id", id);
  if (error) throw new Error(error.message);
  return getWorkPackageById(id, { workspaceId: ws });
}

export async function deleteWorkPackage(id: string, scope?: WorkPackageWorkspaceScope) {
  const ws = await workspaceId(scope);
  const { error } = await db()
    .from("internal_work_packages")
    .delete()
    .eq("workspace_id", ws)
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function setWorkPackageMembers(
  id: string,
  members: Array<{ userId?: string | null; displayName: string }>,
  scope?: WorkPackageWorkspaceScope,
) {
  const ws = await workspaceId(scope);
  const existing = await getWorkPackageById(id, { workspaceId: ws });
  if (!existing) throw new Error("Work package not found.");
  await db().from("internal_work_package_members").delete().eq("workspace_id", ws).eq("work_package_id", id);
  if (members.length) {
    const { error } = await db().from("internal_work_package_members").insert(
      members.map((member) => ({
        workspace_id: ws,
        work_package_id: id,
        user_id: member.userId ?? null,
        display_name: member.displayName.trim(),
      })),
    );
    if (error) throw new Error(error.message);
  }
  await db()
    .from("internal_work_packages")
    .update({ updated_at: new Date().toISOString() })
    .eq("workspace_id", ws)
    .eq("id", id);
  return getWorkPackageById(id, { workspaceId: ws });
}

export async function createWorkPackageTask(
  packageId: string,
  input: {
    category?: string;
    description: string;
    assignedToUserId?: string | null;
    assignedToName?: string;
    startDate?: string | null;
    expectedCompletionDate?: string | null;
    status?: WorkPackageTaskStatus;
    priority?: WorkPackagePriority;
    notes?: string;
  },
  scope?: WorkPackageWorkspaceScope,
) {
  const ws = await workspaceId(scope);
  const pkg = await getWorkPackageById(packageId, { workspaceId: ws });
  if (!pkg) throw new Error("Work package not found.");
  const taskCode = await nextTaskCode(ws, packageId, pkg.packageCode);
  const { data, error } = await db()
    .from("internal_work_package_tasks")
    .insert({
      workspace_id: ws,
      work_package_id: packageId,
      task_code: taskCode,
      category: input.category?.trim() ?? "",
      description: input.description.trim(),
      assigned_to_user_id: input.assignedToUserId ?? null,
      assigned_to_name: input.assignedToName?.trim() ?? "",
      start_date: input.startDate ?? null,
      expected_completion_date: input.expectedCompletionDate ?? null,
      status: input.status ?? "Not Started",
      priority: input.priority ?? "Normal",
      notes: input.notes?.trim() ?? "",
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  await recalculateProgress(ws, packageId);
  return mapTask(data);
}

export async function updateWorkPackageTask(
  packageId: string,
  taskId: string,
  patch: Partial<{
    category: string;
    description: string;
    assignedToUserId: string | null;
    assignedToName: string;
    startDate: string | null;
    expectedCompletionDate: string | null;
    finished: boolean;
    status: WorkPackageTaskStatus;
    priority: WorkPackagePriority;
    notes: string;
  }>,
  scope?: WorkPackageWorkspaceScope,
) {
  const ws = await workspaceId(scope);
  const { data: existing, error: loadError } = await db()
    .from("internal_work_package_tasks")
    .select("*")
    .eq("workspace_id", ws)
    .eq("work_package_id", packageId)
    .eq("id", taskId)
    .maybeSingle();
  if (loadError) throw new Error(loadError.message);
  if (!existing) throw new Error("Task not found.");

  const finished =
    patch.finished !== undefined ? patch.finished : Boolean(existing.finished);
  const status =
    patch.status ??
    (finished ? "Complete" : (String(existing.status) as WorkPackageTaskStatus));

  const { data, error } = await db()
    .from("internal_work_package_tasks")
    .update({
      category: patch.category ?? String(existing.category ?? ""),
      description: patch.description ?? String(existing.description ?? ""),
      assigned_to_user_id:
        patch.assignedToUserId !== undefined
          ? patch.assignedToUserId
          : existing.assigned_to_user_id,
      assigned_to_name: patch.assignedToName ?? String(existing.assigned_to_name ?? ""),
      start_date: patch.startDate !== undefined ? patch.startDate : existing.start_date,
      expected_completion_date:
        patch.expectedCompletionDate !== undefined
          ? patch.expectedCompletionDate
          : existing.expected_completion_date,
      finished,
      finished_at: finished
        ? patch.finished === false
          ? null
          : String(existing.finished_at ?? new Date().toISOString())
        : null,
      status,
      priority: patch.priority ?? String(existing.priority),
      notes: patch.notes ?? String(existing.notes ?? ""),
      updated_at: new Date().toISOString(),
    })
    .eq("workspace_id", ws)
    .eq("id", taskId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  await recalculateProgress(ws, packageId);
  return mapTask(data);
}

export async function deleteWorkPackageTask(
  packageId: string,
  taskId: string,
  scope?: WorkPackageWorkspaceScope,
) {
  const ws = await workspaceId(scope);
  const { error } = await db()
    .from("internal_work_package_tasks")
    .delete()
    .eq("workspace_id", ws)
    .eq("work_package_id", packageId)
    .eq("id", taskId);
  if (error) throw new Error(error.message);
  await recalculateProgress(ws, packageId);
}
