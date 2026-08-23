import {
  canRunEngSop,
  countSopSteps,
  flattenSopSteps,
  isEngSopDefinitionEditable,
  normalizeEngSopSections,
  bumpSopVersion,
  type EngSop,
  type EngSopSection,
  type EngSopStatus,
} from "@/lib/engineering-sop-data";
import {
  buildRunStepRows,
  mapDbRunDetail,
  mapDbSop,
  mapDbSopListItem,
  sopToDbInsert,
} from "@/lib/engineering-sop/mappers";
import type { EngineeringSopDashboard, EngineeringSopReport, EngineeringSopTaskItem } from "@/lib/engineering-sop/types";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { createTenancyServerClient } from "@/lib/supabase/tenancy-server";
import { requireCurrentWorkspace } from "@/lib/workspace-context";

export type EngineeringSopActor = { userId?: string | null; displayName: string };
export type EngineeringSopWorkspaceScope = { workspaceId?: string };

function isUuid(value: string | null | undefined): value is string {
  if (!value) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function db() {
  if (!isSupabaseConfigured()) throw new Error("Supabase is not configured.");
  return createTenancyServerClient();
}

async function workspaceId(scope?: EngineeringSopWorkspaceScope) {
  if (scope?.workspaceId?.trim()) return scope.workspaceId.trim();
  return (await requireCurrentWorkspace()).id;
}

async function recordEvent(input: {
  workspaceId: string;
  sopId?: string | null;
  runId?: string | null;
  eventType: string;
  actor: EngineeringSopActor;
  comment?: string | null;
}) {
  await db().from("engineering_sop_events").insert({
    workspace_id: input.workspaceId,
    sop_id: input.sopId ?? null,
    run_id: input.runId ?? null,
    event_type: input.eventType,
    actor_name: input.actor.displayName,
    actor_user_id: input.actor.userId ?? null,
    comment: input.comment ?? null,
    payload: {},
  });
}

export async function listEngineeringSops(
  scope?: EngineeringSopWorkspaceScope,
  filters?: { search?: string; status?: string; templatesOnly?: boolean; excludeTemplates?: boolean },
) {
  const ws = await workspaceId(scope);
  let query = db().from("engineering_sops").select("*").eq("workspace_id", ws).order("updated_at", { ascending: false });
  if (filters?.templatesOnly) query = query.eq("is_template", true);
  if (filters?.excludeTemplates) query = query.eq("is_template", false);
  if (filters?.status && filters.status !== "All") query = query.eq("status", filters.status);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  let items = (data ?? []).map((row) => mapDbSopListItem(row));
  const q = filters?.search?.trim().toLowerCase();
  if (q) {
    items = items.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.number.toLowerCase().includes(q) ||
        s.owner.toLowerCase().includes(q),
    );
  }
  return items;
}

export async function getEngineeringSopById(id: string, scope?: EngineeringSopWorkspaceScope) {
  const ws = await workspaceId(scope);
  const { data, error } = await db()
    .from("engineering_sops")
    .select("*")
    .eq("workspace_id", ws)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapDbSop(data) : null;
}

export async function createEngineeringSop(
  input: {
    number: string;
    title: string;
    owner: string;
    approver: string;
    reviewDate: string;
    version?: string;
    category?: string | null;
    summary?: string;
    isTemplate?: boolean;
    sections?: EngSopSection[];
    supersedesId?: string | null;
  },
  actor: EngineeringSopActor,
  scope?: EngineeringSopWorkspaceScope,
) {
  const ws = await workspaceId(scope);
  const insert = sopToDbInsert(ws, input, isUuid(actor.userId) ? actor.userId : null);
  const payload = {
    ...insert,
    version: input.version?.trim() || insert.version,
    supersedes_id: input.supersedesId ?? null,
  };
  const { data, error } = await db().from("engineering_sops").insert(payload).select("*").single();
  if (error) throw new Error(error.message);
  await recordEvent({ workspaceId: ws, sopId: data.id, eventType: "sop_created", actor });
  return mapDbSop(data);
}

export async function updateEngineeringSop(
  id: string,
  patch: Partial<{ title: string; owner: string; approver: string; reviewDate: string; summary: string; sections: EngSopSection[]; status: EngSopStatus }>,
  actor: EngineeringSopActor,
  scope?: EngineeringSopWorkspaceScope,
) {
  const ws = await workspaceId(scope);
  const existing = await getEngineeringSopById(id, { workspaceId: ws });
  if (!existing) throw new Error("SOP not found.");
  if (!isEngSopDefinitionEditable(existing)) throw new Error("Approved SOPs cannot be edited in place.");
  const { data, error } = await db()
    .from("engineering_sops")
    .update({
      title: patch.title ?? existing.title,
      owner_name: patch.owner ?? existing.owner,
      approver_name: patch.approver ?? existing.approver,
      review_date: patch.reviewDate ?? existing.reviewDate,
      description: patch.summary ?? existing.summary,
      sections: patch.sections ? normalizeEngSopSections(patch.sections) : existing.sections,
      status: patch.status ?? existing.status,
      updated_at: new Date().toISOString(),
    })
    .eq("workspace_id", ws)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  await recordEvent({ workspaceId: ws, sopId: id, eventType: "sop_updated", actor });
  return mapDbSop(data);
}

export async function submitEngineeringSopForReview(id: string, actor: EngineeringSopActor, scope?: EngineeringSopWorkspaceScope) {
  return updateEngineeringSop(id, { status: "In Review" }, actor, scope);
}

export async function approveEngineeringSop(id: string, actor: EngineeringSopActor, scope?: EngineeringSopWorkspaceScope) {
  const ws = await workspaceId(scope);
  const existing = await getEngineeringSopById(id, { workspaceId: ws });
  if (!existing) throw new Error("SOP not found.");
  if (existing.supersedesId) {
    await db().from("engineering_sops").update({ status: "Retired" }).eq("workspace_id", ws).eq("id", existing.supersedesId);
  }
  const { data, error } = await db()
    .from("engineering_sops")
    .update({
      status: "Approved",
      effective_date: existing.effectiveDate ?? new Date().toISOString().slice(0, 10),
      updated_at: new Date().toISOString(),
    })
    .eq("workspace_id", ws)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  await recordEvent({ workspaceId: ws, sopId: id, eventType: "sop_approved", actor });
  return mapDbSop(data);
}

export async function rejectEngineeringSop(id: string, actor: EngineeringSopActor, comment?: string, scope?: EngineeringSopWorkspaceScope) {
  const sop = await updateEngineeringSop(id, { status: "Draft" }, actor, scope);
  const ws = await workspaceId(scope);
  await recordEvent({ workspaceId: ws, sopId: id, eventType: "sop_rejected", actor, comment: comment ?? null });
  return sop;
}

export async function retireEngineeringSop(id: string, actor: EngineeringSopActor, scope?: EngineeringSopWorkspaceScope) {
  const ws = await workspaceId(scope);
  const existing = await getEngineeringSopById(id, { workspaceId: ws });
  if (!existing) throw new Error("SOP not found.");
  const { data, error } = await db()
    .from("engineering_sops")
    .update({ status: "Retired", updated_at: new Date().toISOString() })
    .eq("workspace_id", ws)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  await recordEvent({ workspaceId: ws, sopId: id, eventType: "sop_retired", actor });
  return mapDbSop(data);
}

export async function startEngineeringSopRun(sopId: string, actor: EngineeringSopActor, scope?: EngineeringSopWorkspaceScope) {
  const ws = await workspaceId(scope);
  const sop = await getEngineeringSopById(sopId, { workspaceId: ws });
  if (!sop) throw new Error("SOP not found.");
  if (!canRunEngSop(sop)) throw new Error("Only approved SOPs can be run.");
  if (countSopSteps(sop) === 0) throw new Error("SOP has no steps to execute.");

  const { data: runRow, error: runError } = await db()
    .from("engineering_sop_runs")
    .insert({
      workspace_id: ws,
      sop_id: sop.id,
      sop_version: sop.version,
      started_by: actor.displayName,
      started_by_user_id: isUuid(actor.userId) ? actor.userId : null,
      status: "in_progress",
    })
    .select("*")
    .single();
  if (runError) throw new Error(runError.message);

  const stepRows = buildRunStepRows(ws, runRow.id, sop, actor.displayName);
  const { error: stepError } = await db().from("engineering_sop_run_steps").insert(stepRows);
  if (stepError) {
    await db().from("engineering_sop_runs").delete().eq("id", runRow.id);
    throw new Error(stepError.message);
  }
  await recordEvent({ workspaceId: ws, sopId: sop.id, runId: runRow.id, eventType: "run_started", actor });
  return getEngineeringSopRunById(runRow.id, { workspaceId: ws });
}

export async function getEngineeringSopRunById(runId: string, scope?: EngineeringSopWorkspaceScope) {
  const ws = await workspaceId(scope);
  const { data: runRow, error } = await db()
    .from("engineering_sop_runs")
    .select("*")
    .eq("workspace_id", ws)
    .eq("id", runId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!runRow) return null;
  const [{ data: steps, error: stepError }, { data: sopRow, error: sopError }] = await Promise.all([
    db().from("engineering_sop_run_steps").select("*").eq("workspace_id", ws).eq("run_id", runId).order("step_order"),
    db().from("engineering_sops").select("*").eq("workspace_id", ws).eq("id", runRow.sop_id).maybeSingle(),
  ]);
  if (stepError || sopError || !sopRow) throw new Error(stepError?.message ?? sopError?.message ?? "SOP missing");
  return mapDbRunDetail(runRow, steps ?? [], sopRow);
}

export async function listEngineeringSopRuns(scope?: EngineeringSopWorkspaceScope, activeOnly = true) {
  const ws = await workspaceId(scope);
  let query = db().from("engineering_sop_runs").select("*").eq("workspace_id", ws).order("started_at", { ascending: false });
  if (activeOnly) query = query.in("status", ["in_progress", "paused"]);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  const runs = data ?? [];
  if (!runs.length) return [];

  const sopIds = [...new Set(runs.map((r) => r.sop_id))];
  const { data: sops, error: sopError } = await db()
    .from("engineering_sops")
    .select("id, title, sop_number, version")
    .eq("workspace_id", ws)
    .in("id", sopIds);
  if (sopError) throw new Error(sopError.message);
  const sopMap = new Map((sops ?? []).map((s) => [s.id, s]));

  const runIds = runs.map((r) => r.id);
  const { data: steps, error: stepError } = await db()
    .from("engineering_sop_run_steps")
    .select("run_id, status")
    .eq("workspace_id", ws)
    .in("run_id", runIds);
  if (stepError) throw new Error(stepError.message);
  const stepMap = new Map<string, { total: number; done: number }>();
  for (const step of steps ?? []) {
    const row = stepMap.get(step.run_id) ?? { total: 0, done: 0 };
    row.total += 1;
    if (step.status === "completed") row.done += 1;
    stepMap.set(step.run_id, row);
  }

  return runs.map((run) => {
    const sop = sopMap.get(run.sop_id);
    const progress = stepMap.get(run.id) ?? { total: 0, done: 0 };
    const progressPct = progress.total ? Math.round((progress.done / progress.total) * 100) : 0;
    return {
      id: run.id,
      sopId: run.sop_id,
      sopTitle: sop?.title ?? "Unknown SOP",
      sopNumber: sop?.sop_number ?? "—",
      version: run.sop_version,
      startedBy: run.started_by,
      startedAt: run.started_at,
      status: run.status,
      progressPct,
      outstandingTasks: progress.total - progress.done,
      pausedAt: run.paused_at,
      lastActivityAt: run.last_activity_at,
      completedAt: run.completed_at,
    };
  });
}

export async function completeEngineeringSopRunStep(
  runId: string,
  stepId: string,
  input: { actor: EngineeringSopActor; outcome: "pass" | "fail" | "na"; notes?: string; evidenceRefs?: string[] },
  scope?: EngineeringSopWorkspaceScope,
) {
  const ws = await workspaceId(scope);
  const run = await getEngineeringSopRunById(runId, { workspaceId: ws });
  if (!run || (run.status !== "in_progress" && run.status !== "paused")) throw new Error("Run not active.");
  const sop = await getEngineeringSopById(run.sopId, { workspaceId: ws });
  if (!sop) throw new Error("SOP not found.");
  const current = flattenSopSteps(sop).find((row) => {
    const st = run.stepStates.find((s) => s.stepId === row.stepId);
    return !st?.completedAt;
  });
  if (!current || current.stepId !== stepId) throw new Error("Complete steps in order.");
  const stepRow = run.steps.find((s) => s.stepId === stepId);
  if (stepRow?.requiresEvidence && !(input.evidenceRefs?.length ?? 0)) {
    throw new Error("Evidence reference required for this step.");
  }
  const now = new Date().toISOString();
  const { error } = await db()
    .from("engineering_sop_run_steps")
    .update({
      status: "completed",
      outcome: input.outcome,
      notes: input.notes?.trim() ?? "",
      evidence_refs: (input.evidenceRefs ?? []).map((r) => r.trim()).filter(Boolean),
      completed_by: input.actor.displayName,
      completed_at: now,
      updated_at: now,
    })
    .eq("workspace_id", ws)
    .eq("run_id", runId)
    .eq("step_id", stepId);
  if (error) throw new Error(error.message);
  await db().from("engineering_sop_runs").update({ last_activity_at: now }).eq("id", runId);
  await recordEvent({ workspaceId: ws, sopId: run.sopId, runId, eventType: "run_step_completed", actor: input.actor });
  return getEngineeringSopRunById(runId, { workspaceId: ws });
}

export async function completeEngineeringSopRun(runId: string, actor: EngineeringSopActor, scope?: EngineeringSopWorkspaceScope) {
  const ws = await workspaceId(scope);
  const run = await getEngineeringSopRunById(runId, { workspaceId: ws });
  if (!run) throw new Error("Run not found.");
  if (run.steps.some((s) => s.status !== "completed")) throw new Error("Outstanding steps remain.");
  const hasFail = run.steps.some((s) => s.outcome === "fail");
  const now = new Date().toISOString();
  const { error } = await db()
    .from("engineering_sop_runs")
    .update({
      status: hasFail ? "failed" : "completed",
      sign_off: { signedBy: actor.displayName, signedAt: now, comment: "" },
      completed_at: now,
      last_activity_at: now,
    })
    .eq("workspace_id", ws)
    .eq("id", runId);
  if (error) throw new Error(error.message);
  return getEngineeringSopRunById(runId, { workspaceId: ws });
}

export async function getEngineeringSopDashboard(scope?: EngineeringSopWorkspaceScope): Promise<EngineeringSopDashboard> {
  const sops = await listEngineeringSops(scope, { excludeTemplates: true });
  const templates = await listEngineeringSops(scope, { templatesOnly: true });
  const allRuns = await listEngineeringSopRuns(scope, false);
  const activeRuns = allRuns.filter((r) => r.status === "in_progress" || r.status === "paused");
  const tasks = await listEngineeringSopTasks(scope);
  const today = new Date().toISOString().slice(0, 10);
  const now = Date.now();

  const { data: events, error: eventError } = await db()
    .from("engineering_sop_events")
    .select("id, event_type, actor_name, comment, created_at, sop_id")
    .eq("workspace_id", await workspaceId(scope))
    .order("created_at", { ascending: false })
    .limit(12);
  if (eventError) throw new Error(eventError.message);

  const sopTitleMap = new Map(sops.map((s) => [s.id, s.title]));
  const recentActivity = (events ?? []).map((e) => ({
    id: e.id,
    eventType: e.event_type,
    actorName: e.actor_name,
    comment: e.comment,
    createdAt: e.created_at,
    sopTitle: e.sop_id ? (sopTitleMap.get(e.sop_id) ?? null) : null,
  }));

  return {
    totals: {
      sops: sops.length,
      draft: sops.filter((s) => s.status === "Draft").length,
      inReview: sops.filter((s) => s.status === "In Review").length,
      approved: sops.filter((s) => s.status === "Approved").length,
      retired: sops.filter((s) => s.status === "Retired" || s.status === "Obsolete").length,
      templates: templates.length,
      activeRuns: activeRuns.length,
      completedRuns: allRuns.filter((r) => r.status === "completed" || r.status === "failed").length,
      tasksAttention: tasks.filter((t) => t.status !== "completed").length,
      overdueTasks: tasks.filter((t) => t.dueAt && new Date(t.dueAt).getTime() < now && t.status !== "completed").length,
      reviewsDue: sops.filter((s) => s.status === "Approved" && s.reviewDate && s.reviewDate <= today).length,
      overdueReviews: sops.filter((s) => s.status === "Approved" && s.reviewDate && s.reviewDate < today).length,
    },
    recentActivity,
    activeRuns: activeRuns.slice(0, 8).map((r) => ({
      id: r.id,
      sopTitle: r.sopTitle,
      sopNumber: r.sopNumber,
      version: r.version,
      startedBy: r.startedBy,
      startedAt: r.startedAt,
      status: r.status,
      progressPct: r.progressPct,
      outstandingTasks: r.outstandingTasks,
    })),
    tasksAttention: tasks.filter((t) => t.status !== "completed").slice(0, 8),
    reviewsAwaiting: sops
      .filter((s) => s.status === "In Review")
      .map((s) => ({
        id: s.id,
        title: s.title,
        sopNumber: s.number,
        version: s.version,
        ownerName: s.owner,
        reviewDate: s.reviewDate,
        status: s.status,
      })),
    recentlyApproved: sops
      .filter((s) => s.status === "Approved")
      .slice(0, 6)
      .map((s) => ({
        id: s.id,
        title: s.title,
        sopNumber: s.number,
        version: s.version,
        approvedAt: s.updatedAt,
      })),
  };
}

export async function listEngineeringSopTasks(scope?: EngineeringSopWorkspaceScope): Promise<EngineeringSopTaskItem[]> {
  const ws = await workspaceId(scope);
  const activeRuns = await listEngineeringSopRuns(scope, true);
  if (!activeRuns.length) return [];

  const runMap = new Map(activeRuns.map((r) => [r.id, r]));
  const { data: steps, error } = await db()
    .from("engineering_sop_run_steps")
    .select("*")
    .eq("workspace_id", ws)
    .in(
      "run_id",
      activeRuns.map((r) => r.id),
    )
    .neq("status", "completed")
    .order("due_at", { ascending: true });
  if (error) throw new Error(error.message);

  return (steps ?? []).map((step) => {
    const run = runMap.get(step.run_id);
    return {
      id: step.id,
      title: step.title,
      assignedTo: step.assigned_to,
      dueAt: step.due_at,
      status: step.status,
      sopTitle: run?.sopTitle ?? "Unknown SOP",
      runId: step.run_id,
    };
  });
}

export async function pauseEngineeringSopRun(runId: string, actor: EngineeringSopActor, scope?: EngineeringSopWorkspaceScope) {
  const ws = await workspaceId(scope);
  const now = new Date().toISOString();
  const { error } = await db()
    .from("engineering_sop_runs")
    .update({ status: "paused", paused_at: now, last_activity_at: now })
    .eq("workspace_id", ws)
    .eq("id", runId)
    .eq("status", "in_progress");
  if (error) throw new Error(error.message);
  const run = await getEngineeringSopRunById(runId, { workspaceId: ws });
  if (run) await recordEvent({ workspaceId: ws, sopId: run.sopId, runId, eventType: "run_paused", actor });
  return run;
}

export async function resumeEngineeringSopRun(runId: string, actor: EngineeringSopActor, scope?: EngineeringSopWorkspaceScope) {
  const ws = await workspaceId(scope);
  const now = new Date().toISOString();
  const { error } = await db()
    .from("engineering_sop_runs")
    .update({ status: "in_progress", paused_at: null, last_activity_at: now })
    .eq("workspace_id", ws)
    .eq("id", runId)
    .eq("status", "paused");
  if (error) throw new Error(error.message);
  const run = await getEngineeringSopRunById(runId, { workspaceId: ws });
  if (run) await recordEvent({ workspaceId: ws, sopId: run.sopId, runId, eventType: "run_resumed", actor });
  return run;
}

export async function deleteEngineeringSop(id: string, actor: EngineeringSopActor, scope?: EngineeringSopWorkspaceScope) {
  const ws = await workspaceId(scope);
  const existing = await getEngineeringSopById(id, { workspaceId: ws });
  if (!existing) throw new Error("SOP not found.");
  if (!isEngSopDefinitionEditable(existing)) throw new Error("Only draft or in-review SOPs can be deleted.");
  const { error } = await db().from("engineering_sops").delete().eq("workspace_id", ws).eq("id", id);
  if (error) throw new Error(error.message);
  await recordEvent({ workspaceId: ws, sopId: id, eventType: "sop_deleted", actor });
}

export async function createEngineeringSopFromTemplate(
  templateId: string,
  input: { title?: string; number?: string; owner?: string },
  actor: EngineeringSopActor,
  scope?: EngineeringSopWorkspaceScope,
) {
  const ws = await workspaceId(scope);
  const template = await getEngineeringSopById(templateId, { workspaceId: ws });
  if (!template?.isTemplate) throw new Error("Template not found.");
  return createEngineeringSop(
    {
      number: input.number?.trim() || `${template.number}-COPY`,
      title: input.title?.trim() || `${template.title} (Copy)`,
      owner: input.owner?.trim() || template.owner,
      approver: template.approver,
      reviewDate: template.reviewDate,
      category: template.category,
      summary: template.summary,
      sections: template.sections,
      supersedesId: null,
    },
    actor,
    { workspaceId: ws },
  );
}

export async function createEngineeringSopVersion(id: string, actor: EngineeringSopActor, scope?: EngineeringSopWorkspaceScope) {
  const ws = await workspaceId(scope);
  const existing = await getEngineeringSopById(id, { workspaceId: ws });
  if (!existing || existing.status !== "Approved") throw new Error("Only approved SOPs can be versioned.");
  return createEngineeringSop(
    {
      number: existing.number,
      title: existing.title,
      owner: existing.owner,
      approver: existing.approver,
      reviewDate: existing.reviewDate,
      category: existing.category,
      summary: existing.summary,
      sections: existing.sections,
      supersedesId: existing.id,
      version: bumpSopVersion(existing.version),
    },
    actor,
    { workspaceId: ws },
  );
}

export async function getEngineeringSopReport(scope?: EngineeringSopWorkspaceScope): Promise<EngineeringSopReport> {
  const sops = await listEngineeringSops(scope, { excludeTemplates: true });
  const runs = await listEngineeringSopRuns(scope, false);
  const byCategory = new Map<string, number>();
  for (const sop of sops) {
    const key = sop.category?.trim() || "Uncategorized";
    byCategory.set(key, (byCategory.get(key) ?? 0) + 1);
  }
  return {
    generatedAt: new Date().toISOString(),
    totals: {
      sops: sops.length,
      approved: sops.filter((s) => s.status === "Approved").length,
      inReview: sops.filter((s) => s.status === "In Review").length,
      draft: sops.filter((s) => s.status === "Draft").length,
      retired: sops.filter((s) => s.status === "Retired" || s.status === "Obsolete").length,
      runs: runs.length,
      completedRuns: runs.filter((r) => r.status === "completed").length,
      failedRuns: runs.filter((r) => r.status === "failed").length,
    },
    byCategory: [...byCategory.entries()].map(([category, count]) => ({ category, count })),
    recentRuns: runs.slice(0, 20).map((r) => ({
      id: r.id,
      sopTitle: r.sopTitle,
      sopNumber: r.sopNumber,
      startedBy: r.startedBy,
      startedAt: r.startedAt,
      status: r.status,
      progressPct: r.progressPct,
    })),
  };
}
