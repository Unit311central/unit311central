import {
  createSeedEngineeringSops,
  normalizeEngSopSections,
  type EngSop,
  type EngSopSection,
  type EngSopStatus,
} from "@/lib/engineering-sop-data";

export type EngineeringSopState = {
  sops: EngSop[];
};

let state: EngineeringSopState = {
  sops: createSeedEngineeringSops(),
};

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

export type CreateEngSopInput = {
  number: string;
  title: string;
  version: string;
  owner: string;
  status?: EngSopStatus;
  effectiveDate?: string | null;
  reviewDate: string;
  summary?: string;
  tags?: string[];
  sections?: EngSopSection[];
};

export type UpdateEngSopInput = Partial<
  Omit<EngSop, "id" | "createdAt"> & { sections?: EngSopSection[] }
>;

function touch(sop: EngSop): EngSop {
  return { ...sop, updatedAt: new Date().toISOString() };
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
    effectiveDate: input.effectiveDate ?? null,
    reviewDate: input.reviewDate,
    summary: input.summary?.trim() ?? "",
    tags: input.tags ?? [],
    sections: normalizeEngSopSections(input.sections ?? []),
    workflow: { pendingApprovals: [], lastReviewedBy: null, aiAssistEnabled: true },
    createdAt: now,
    updatedAt: now,
  };
  state = { ...state, sops: [sop, ...state.sops] };
  emit();
  return sop;
}

export function updateEngSop(id: string, patch: UpdateEngSopInput): EngSop | null {
  let updated: EngSop | null = null;
  state = {
    ...state,
    sops: state.sops.map((row) => {
      if (row.id !== id) return row;
      updated = touch({
        ...row,
        ...patch,
        sections: patch.sections ? normalizeEngSopSections(patch.sections) : row.sections,
      });
      return updated;
    }),
  };
  emit();
  return updated;
}

export function deleteEngSop(id: string) {
  state = { ...state, sops: state.sops.filter((row) => row.id !== id) };
  emit();
}

export function submitEngSopForReview(id: string) {
  return updateEngSop(id, { status: "In Review" });
}

export function approveEngSop(id: string, approvedBy?: string) {
  const row = state.sops.find((s) => s.id === id);
  if (!row) return null;
  const effectiveDate = row.effectiveDate ?? new Date().toISOString().slice(0, 10);
  return updateEngSop(id, {
    status: "Approved",
    effectiveDate,
    workflow: {
      ...row.workflow,
      pendingApprovals: [],
      lastReviewedBy: approvedBy ?? row.owner,
    },
  });
}

export function archiveEngSop(id: string) {
  return updateEngSop(id, { status: "Obsolete" });
}

export function getEngSopById(id: string): EngSop | undefined {
  return state.sops.find((row) => row.id === id);
}
