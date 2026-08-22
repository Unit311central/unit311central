import type { EngSop, EngSopRun, EngSopSection } from "@/lib/engineering-sop-data";

export type DbEngineeringSopRow = {
  id: string;
  workspace_id: string;
  sop_number: string;
  title: string;
  version: string;
  status: string;
  category: string | null;
  description: string;
  owner_name: string;
  approver_name: string;
  audience: string;
  effective_date: string | null;
  review_date: string | null;
  is_template: boolean;
  template_source_id: string | null;
  supersedes_id: string | null;
  sections: EngSopSection[] | unknown;
  tags: string[] | null;
  workflow: Record<string, unknown> | null;
  created_by_user_id: string | null;
  created_at: string;
  updated_at: string;
};

export type DbEngineeringSopRunRow = {
  id: string;
  workspace_id: string;
  sop_id: string;
  sop_version: string;
  started_by: string;
  started_by_user_id: string | null;
  status: EngSopRun["status"] | string;
  started_at: string;
  paused_at: string | null;
  completed_at: string | null;
  sign_off: EngSopRun["signOff"] | null;
  last_activity_at: string;
};

export type DbEngineeringSopRunStepRow = {
  id: string;
  workspace_id: string;
  run_id: string;
  step_id: string;
  step_order: number;
  section_title: string;
  title: string;
  instructions: string;
  assigned_to: string | null;
  due_at: string | null;
  required: boolean;
  requires_evidence: boolean;
  status: string;
  outcome: "pass" | "fail" | "na" | null;
  notes: string;
  evidence_refs: string[] | null;
  completed_by: string | null;
  completed_at: string | null;
  comments: unknown;
  created_at: string;
  updated_at: string;
};

export type EngineeringSopListItem = EngSop & {
  runCount: number;
  lastRunAt: string | null;
};

export type EngineeringSopRunDetail = EngSopRun & {
  id: string;
  workspaceId: string;
  sopTitle: string;
  sopNumber: string;
  pausedAt: string | null;
  lastActivityAt: string;
  steps: Array<{
    id: string;
    stepId: string;
    stepOrder: number;
    sectionTitle: string;
    title: string;
    instructions: string;
    assignedTo: string | null;
    dueAt: string | null;
    required: boolean;
    requiresEvidence: boolean;
    status: string;
    outcome: string | null;
    notes: string;
    evidenceRefs: string[];
    completedBy: string | null;
    completedAt: string | null;
    comments: Array<{ id: string; author: string; body: string; createdAt: string }>;
  }>;
};

export type EngineeringSopDashboard = {
  totals: {
    sops: number;
    draft: number;
    inReview: number;
    approved: number;
    retired: number;
    templates: number;
    activeRuns: number;
    completedRuns: number;
    tasksAttention: number;
    overdueTasks: number;
    reviewsDue: number;
    overdueReviews: number;
  };
  recentActivity: Array<{
    id: string;
    eventType: string;
    actorName: string;
    comment: string | null;
    createdAt: string;
    sopTitle: string | null;
  }>;
  activeRuns: Array<{
    id: string;
    sopTitle: string;
    sopNumber: string;
    version: string;
    startedBy: string;
    startedAt: string;
    status: string;
    progressPct: number;
    outstandingTasks: number;
  }>;
  tasksAttention: Array<{
    id: string;
    title: string;
    assignedTo: string | null;
    dueAt: string | null;
    status: string;
    sopTitle: string;
    runId: string;
  }>;
  reviewsAwaiting: Array<{
    id: string;
    title: string;
    sopNumber: string;
    version: string;
    ownerName: string;
    reviewDate: string | null;
    status: string;
  }>;
  recentlyApproved: Array<{
    id: string;
    title: string;
    sopNumber: string;
    version: string;
    approvedAt: string;
  }>;
};

export type EngineeringSopTaskItem = {
  id: string;
  title: string;
  assignedTo: string | null;
  dueAt: string | null;
  status: string;
  sopTitle: string;
  runId: string;
};

export type EngineeringSopReport = {
  generatedAt: string;
  totals: {
    sops: number;
    approved: number;
    inReview: number;
    draft: number;
    retired: number;
    runs: number;
    completedRuns: number;
    failedRuns: number;
  };
  byCategory: Array<{ category: string; count: number }>;
  recentRuns: Array<{
    id: string;
    sopTitle: string;
    sopNumber: string;
    startedBy: string;
    startedAt: string;
    status: string;
    progressPct: number;
  }>;
};
