import {
  flattenSopSteps,
  normalizeEngSopSections,
  type EngSop,
  type EngSopRun,
  type EngSopSection,
  type EngSopWorkflowState,
} from "@/lib/engineering-sop-data";
import type {
  DbEngineeringSopRow,
  DbEngineeringSopRunRow,
  DbEngineeringSopRunStepRow,
  EngineeringSopListItem,
  EngineeringSopRunDetail,
} from "@/lib/engineering-sop/types";

function parseSections(value: unknown): EngSopSection[] {
  if (!Array.isArray(value)) return [];
  return normalizeEngSopSections(value as EngSopSection[]);
}

function parseWorkflow(value: unknown): EngSopWorkflowState {
  const row = (value ?? {}) as Partial<EngSopWorkflowState>;
  return {
    pendingApprovals: Array.isArray(row.pendingApprovals) ? [...row.pendingApprovals] : [],
    lastReviewedBy: row.lastReviewedBy ?? null,
    aiAssistEnabled: row.aiAssistEnabled ?? true,
  };
}

export function mapDbSop(row: DbEngineeringSopRow): EngSop {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    number: row.sop_number,
    title: row.title,
    version: row.version,
    status: row.status as EngSop["status"],
    category: row.category,
    owner: row.owner_name,
    approver: row.approver_name,
    audience: row.audience as EngSop["audience"],
    effectiveDate: row.effective_date,
    reviewDate: row.review_date ?? "",
    summary: row.description,
    tags: row.tags ?? [],
    sections: parseSections(row.sections),
    workflow: parseWorkflow(row.workflow),
    isTemplate: row.is_template,
    templateSourceId: row.template_source_id,
    supersedesId: row.supersedes_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapDbSopListItem(
  row: DbEngineeringSopRow,
  meta?: { runCount?: number; lastRunAt?: string | null },
): EngineeringSopListItem {
  return { ...mapDbSop(row), runCount: meta?.runCount ?? 0, lastRunAt: meta?.lastRunAt ?? null };
}

export function mapDbRunDetail(
  row: DbEngineeringSopRunRow,
  steps: DbEngineeringSopRunStepRow[],
  sop: DbEngineeringSopRow,
): EngineeringSopRunDetail {
  return {
    id: row.id,
    runId: row.id,
    sopId: row.sop_id,
    sopVersion: row.sop_version,
    startedBy: row.started_by,
    startedAt: row.started_at,
    status: row.status as EngSopRun["status"],
    stepStates: steps.map((step) => ({
      stepId: step.step_id,
      completedAt: step.completed_at,
      completedBy: step.completed_by,
      outcome: step.outcome,
      notes: step.notes,
      evidenceRefs: step.evidence_refs ?? [],
    })),
    signOff: row.sign_off,
    completedAt: row.completed_at,
    pausedAt: row.paused_at,
    lastActivityAt: row.last_activity_at,
    workspaceId: row.workspace_id,
    sopTitle: sop.title,
    sopNumber: sop.sop_number,
    steps: steps.map((step) => ({
      id: step.id,
      stepId: step.step_id,
      stepOrder: step.step_order,
      sectionTitle: step.section_title,
      title: step.title,
      instructions: step.instructions,
      assignedTo: step.assigned_to,
      dueAt: step.due_at,
      required: step.required,
      requiresEvidence: step.requires_evidence,
      status: step.status,
      outcome: step.outcome,
      notes: step.notes,
      evidenceRefs: step.evidence_refs ?? [],
      completedBy: step.completed_by,
      completedAt: step.completed_at,
      comments: Array.isArray(step.comments)
        ? (step.comments as EngineeringSopRunDetail["steps"][number]["comments"])
        : [],
    })),
  };
}

export function sopToDbInsert(
  workspaceId: string,
  sop: Partial<EngSop> & {
    number: string;
    title: string;
    owner: string;
    approver: string;
    reviewDate: string;
  },
  actorUserId?: string | null,
) {
  return {
    workspace_id: workspaceId,
    sop_number: sop.number.trim(),
    title: sop.title.trim(),
    version: sop.version?.trim() || "1.0",
    status: sop.status ?? "Draft",
    category: sop.category ?? null,
    description: sop.summary?.trim() ?? "",
    owner_name: sop.owner.trim(),
    approver_name: sop.approver.trim(),
    audience: sop.audience ?? "internal",
    effective_date: sop.effectiveDate,
    review_date: sop.reviewDate || null,
    is_template: sop.isTemplate ?? false,
    template_source_id: sop.templateSourceId ?? null,
    supersedes_id: sop.supersedesId ?? null,
    sections: normalizeEngSopSections(sop.sections ?? []),
    tags: sop.tags ?? [],
    workflow: sop.workflow ?? { pendingApprovals: [], lastReviewedBy: null, aiAssistEnabled: true },
    created_by_user_id: actorUserId ?? null,
  };
}

export function buildRunStepRows(
  workspaceId: string,
  runId: string,
  sop: EngSop,
  defaultAssignee?: string | null,
) {
  const flat = flattenSopSteps(sop);
  const dueBase = Date.now();
  return flat.map((row, index) => ({
    workspace_id: workspaceId,
    run_id: runId,
    step_id: row.stepId,
    step_order: row.globalOrder,
    section_title: row.section.title,
    title: row.step.title,
    instructions: row.step.body,
    assigned_to: defaultAssignee ?? sop.owner,
    due_at: new Date(dueBase + (index + 1) * 86400000).toISOString(),
    required: row.step.required !== false,
    requires_evidence: Boolean(row.step.requiresEvidence),
    status: "pending",
  }));
}
