import {
  bumpSopVersion,
  canRunEngSop,
  countSopSteps,
  createSeedEngineeringSops,
  flattenSopSteps,
  isEngSopDefinitionEditable,
  normalizeEngSopSections,
  type EngSop,
  type EngSopAudience,
  type EngSopRun,
  type EngSopRunSignOff,
  type EngSopRunStatus,
  type EngSopSection,
  type EngSopStatus,
  type EngSopStepOutcome,
  type EngSopStepRunState,
} from "@/lib/engineering-sop-data";

export type EngineeringSopState = {
  sops: EngSop[];
  runs: EngSopRun[];
};

let state: EngineeringSopState = createInitialState();

function createInitialState(): EngineeringSopState {
  return { sops: createSeedEngineeringSops(), runs: [] };
}

const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export function subscribeEngineeringSopStore(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getEngineeringSopSnapshot(): EngineeringSopState {
  return state;
}

/** Test-only reset — restores seed catalogue and clears runs. */
export function resetEngineeringSopStoreForTests() {
  state = createInitialState();
  emit();
}

export type CreateEngSopInput = {
  number: string;
  title: string;
  version: string;
  owner: string;
  approver: string;
  audience?: EngSopAudience;
  status?: EngSopStatus;
  effectiveDate?: string | null;
  reviewDate: string;
  summary?: string;
  tags?: string[];
  sections?: EngSopSection[];
  supersedesId?: string | null;
};

export type UpdateEngSopInput = Partial<
  Omit<EngSop, "id" | "createdAt"> & { sections?: EngSopSection[] }
>;

function touch(sop: EngSop): EngSop {
  return { ...sop, updatedAt: new Date().toISOString() };
}

function cloneSop(sop: EngSop): EngSop {
  return {
    ...sop,
    tags: [...sop.tags],
    sections: sop.sections.map((sec) => ({
      ...sec,
      steps: sec.steps.map((s) => ({ ...s })),
    })),
    workflow: { ...sop.workflow, pendingApprovals: [...sop.workflow.pendingApprovals] },
  };
}

function initStepStates(sop: EngSop): EngSopStepRunState[] {
  return flattenSopSteps(sop).map((row) => ({
    stepId: row.stepId,
    completedAt: null,
    completedBy: null,
    outcome: null,
    notes: "",
    evidenceRefs: [],
  }));
}

export function createEngSop(input: CreateEngSopInput): EngSop {
  const now = new Date().toISOString();
  const sop: EngSop = {
    id: `eng-sop-${Date.now()}`,
    number: input.number.trim(),
    title: input.title.trim(),
    version: input.version.trim() || "1.0",
    status: input.status ?? "Draft",
    owner: input.owner.trim(),
    approver: input.approver.trim(),
    audience: input.audience ?? "internal",
    effectiveDate: input.effectiveDate ?? null,
    reviewDate: input.reviewDate,
    summary: input.summary?.trim() ?? "",
    tags: input.tags ?? [],
    sections: normalizeEngSopSections(input.sections ?? []),
    workflow: { pendingApprovals: [], lastReviewedBy: null, aiAssistEnabled: true },
    supersedesId: input.supersedesId ?? null,
    createdAt: now,
    updatedAt: now,
  };
  state = { ...state, sops: [sop, ...state.sops] };
  emit();
  return sop;
}

export function updateEngSop(id: string, patch: UpdateEngSopInput): EngSop | null {
  const row = state.sops.find((s) => s.id === id);
  if (!row) return null;
  if (!isEngSopDefinitionEditable(row)) return null;

  let updated: EngSop | null = null;
  state = {
    ...state,
    sops: state.sops.map((current) => {
      if (current.id !== id) return current;
      updated = touch({
        ...current,
        ...patch,
        sections: patch.sections ? normalizeEngSopSections(patch.sections) : current.sections,
      });
      return updated;
    }),
  };
  emit();
  return updated;
}

export function createDraftFromApproved(approvedId: string): EngSop | null {
  const approved = state.sops.find((s) => s.id === approvedId && s.status === "Approved");
  if (!approved) return null;

  const existing = state.sops.find(
    (s) => s.supersedesId === approvedId && (s.status === "Draft" || s.status === "In Review"),
  );
  if (existing) return existing;

  const draft = createEngSop({
    number: approved.number,
    title: approved.title,
    version: bumpSopVersion(approved.version),
    owner: approved.owner,
    approver: approved.approver,
    audience: approved.audience,
    status: "Draft",
    effectiveDate: null,
    reviewDate: approved.reviewDate,
    summary: approved.summary,
    tags: [...approved.tags],
    sections: cloneSop(approved).sections,
    supersedesId: approvedId,
  });
  return draft;
}

export function deleteEngSop(id: string) {
  const row = state.sops.find((s) => s.id === id);
  if (!row || row.status === "Approved") return;
  state = { ...state, sops: state.sops.filter((r) => r.id !== id) };
  emit();
}

export function submitEngSopForReview(id: string) {
  return updateEngSop(id, { status: "In Review" });
}

export function approveEngSop(id: string, approvedBy?: string) {
  const row = state.sops.find((s) => s.id === id);
  if (!row || row.status === "Approved") return null;
  const effectiveDate = row.effectiveDate ?? new Date().toISOString().slice(0, 10);

  if (row.supersedesId) {
    state = {
      ...state,
      sops: state.sops.map((s) =>
        s.id === row.supersedesId && s.status === "Approved"
          ? touch({ ...s, status: "Obsolete" as EngSopStatus })
          : s,
      ),
    };
  }

  return updateEngSop(id, {
    status: "Approved",
    effectiveDate,
    workflow: {
      ...row.workflow,
      pendingApprovals: [],
      lastReviewedBy: approvedBy ?? row.approver,
    },
  });
}

export function archiveEngSop(id: string) {
  const row = state.sops.find((s) => s.id === id);
  if (!row) return null;
  if (row.status === "Approved") return null;
  return updateEngSop(id, { status: "Obsolete" });
}

export function getEngSopById(id: string): EngSop | undefined {
  return state.sops.find((row) => row.id === id);
}

export function startEngSopRun(sopId: string, startedBy: string): EngSopRun | null {
  const sop = state.sops.find((s) => s.id === sopId);
  if (!sop || !canRunEngSop(sop)) return null;
  if (countSopSteps(sop) === 0) return null;

  const run: EngSopRun = {
    runId: `eng-run-${Date.now()}`,
    sopId: sop.id,
    sopVersion: sop.version,
    startedBy,
    startedAt: new Date().toISOString(),
    status: "in_progress",
    stepStates: initStepStates(sop),
    signOff: null,
    completedAt: null,
  };
  state = { ...state, runs: [run, ...state.runs] };
  emit();
  return run;
}

export function getEngSopRunById(runId: string): EngSopRun | undefined {
  return state.runs.find((r) => r.runId === runId);
}

export function getLatestCompletedRun(sopId: string): EngSopRun | undefined {
  return state.runs.find(
    (r) => r.sopId === sopId && (r.status === "completed" || r.status === "failed"),
  );
}

function getCurrentStepId(run: EngSopRun, sop: EngSop): string | null {
  const flat = flattenSopSteps(sop);
  for (const row of flat) {
    const st = run.stepStates.find((s) => s.stepId === row.stepId);
    if (!st?.completedAt) return row.stepId;
  }
  return null;
}

export function completeEngSopRunStep(
  runId: string,
  stepId: string,
  input: {
    completedBy: string;
    outcome: EngSopStepOutcome;
    notes?: string;
    evidenceRefs?: string[];
  },
): { ok: true; run: EngSopRun } | { ok: false; reason: string } {
  const run = state.runs.find((r) => r.runId === runId);
  if (!run || run.status !== "in_progress") return { ok: false, reason: "Run not active." };

  const sop = state.sops.find((s) => s.id === run.sopId);
  if (!sop) return { ok: false, reason: "SOP not found." };

  const currentId = getCurrentStepId(run, sop);
  if (currentId !== stepId) return { ok: false, reason: "Complete steps in order." };

  const flatRow = flattenSopSteps(sop).find((r) => r.stepId === stepId);
  if (!flatRow) return { ok: false, reason: "Step not found." };

  if (flatRow.step.required !== false && !input.outcome) {
    return { ok: false, reason: "Outcome required." };
  }

  const evidenceRefs = (input.evidenceRefs ?? []).map((r) => r.trim()).filter(Boolean);
  if (flatRow.step.requiresEvidence && evidenceRefs.length === 0) {
    return { ok: false, reason: "Evidence reference required for this step." };
  }

  const now = new Date().toISOString();
  const nextStepStates = run.stepStates.map((st) =>
    st.stepId === stepId
      ? {
          ...st,
          completedAt: now,
          completedBy: input.completedBy,
          outcome: input.outcome,
          notes: input.notes?.trim() ?? "",
          evidenceRefs,
        }
      : st,
  );

  const updated: EngSopRun = { ...run, stepStates: nextStepStates };
  state = {
    ...state,
    runs: state.runs.map((r) => (r.runId === runId ? updated : r)),
  };
  emit();
  return { ok: true, run: updated };
}

export function signOffEngSopRun(
  runId: string,
  input: { signedBy: string; comment?: string },
): { ok: true; run: EngSopRun } | { ok: false; reason: string } {
  const run = state.runs.find((r) => r.runId === runId);
  if (!run || run.status !== "in_progress") return { ok: false, reason: "Run not active." };

  const sop = state.sops.find((s) => s.id === run.sopId);
  if (!sop) return { ok: false, reason: "SOP not found." };

  const flat = flattenSopSteps(sop);
  const incomplete = flat.filter((row) => {
    const st = run.stepStates.find((s) => s.stepId === row.stepId);
    return !st?.completedAt;
  });
  if (incomplete.length > 0) {
    return { ok: false, reason: `${incomplete.length} step(s) still incomplete.` };
  }

  const hasFail = run.stepStates.some((st) => st.outcome === "fail");
  const signOff: EngSopRunSignOff = {
    signedBy: input.signedBy,
    signedAt: new Date().toISOString(),
    comment: input.comment?.trim() ?? "",
  };
  const completed: EngSopRun = {
    ...run,
    status: hasFail ? "failed" : "completed",
    signOff,
    completedAt: signOff.signedAt,
  };
  state = {
    ...state,
    runs: state.runs.map((r) => (r.runId === runId ? completed : r)),
  };
  emit();
  return { ok: true, run: completed };
}

export function abandonEngSopRun(runId: string) {
  const run = state.runs.find((r) => r.runId === runId);
  if (!run || run.status !== "in_progress") return null;
  const updated: EngSopRun = {
    ...run,
    status: "abandoned",
    completedAt: new Date().toISOString(),
  };
  state = {
    ...state,
    runs: state.runs.map((r) => (r.runId === runId ? updated : r)),
  };
  emit();
  return updated;
}
