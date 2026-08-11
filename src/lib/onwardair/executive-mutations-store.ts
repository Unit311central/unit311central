/**
 * OnwardAir EA write-back layer — merges demo fixtures with in-memory mutations.
 * Server-global; survives warm invocations on the same instance.
 */

import type { OaBoardAction, OaBoardActionStatus } from "@/lib/onwardair/board-data";
import { OA_HELD_BOARD_MEETINGS } from "@/lib/onwardair/board-data";
import type { OaEngRisk } from "@/lib/onwardair/engineering-data";
import { OA_ENG_RISKS } from "@/lib/onwardair/engineering-data";
import {
  FUNDRAISING_PIPELINE,
  type FundraisingPipelineDeal,
  type FundraisingPipelineStage,
} from "@/lib/onwardair/fundraising-data";

declare global {
  // Ambient `var` required for globalThis augmentation.
  var __onwardAirExecutiveMutations: OnwardAirExecutiveMutationsState | undefined;
}

export type OnwardAirExecutiveMutationsState = {
  pipelinePatches: Record<
    string,
    Partial<Pick<FundraisingPipelineDeal, "stage" | "lastTouch" | "notes">>
  >;
  boardActions: OaBoardAction[];
  engineeringRisks: OaEngRisk[];
  updatedAt: string;
};

function emptyState(): OnwardAirExecutiveMutationsState {
  return {
    pipelinePatches: {},
    boardActions: [],
    engineeringRisks: [],
    updatedAt: new Date().toISOString(),
  };
}

function getState(): OnwardAirExecutiveMutationsState {
  if (!globalThis.__onwardAirExecutiveMutations) {
    globalThis.__onwardAirExecutiveMutations = emptyState();
  }
  return globalThis.__onwardAirExecutiveMutations;
}

function touch(state: OnwardAirExecutiveMutationsState) {
  state.updatedAt = new Date().toISOString();
  return state;
}

export function getMergedFundraisingPipeline(): FundraisingPipelineDeal[] {
  const patches = getState().pipelinePatches;
  return FUNDRAISING_PIPELINE.map((deal) => ({ ...deal, ...patches[deal.id] }));
}

export function getMergedEngineeringRisks(): OaEngRisk[] {
  return [...OA_ENG_RISKS, ...getState().engineeringRisks];
}

export function listMergedOpenBoardActions(): OaBoardAction[] {
  const fromMeetings = OA_HELD_BOARD_MEETINGS.flatMap((m) => m.actions).filter(
    (a) => a.status !== "Completed" && a.status !== "Closed",
  );
  const fromEa = getState().boardActions.filter(
    (a) => a.status !== "Completed" && a.status !== "Closed",
  );
  return [...fromEa, ...fromMeetings];
}

const PIPELINE_STAGES: FundraisingPipelineStage[] = [
  "Intro",
  "Pitch sent",
  "Meeting",
  "Diligence",
  "Term sheet",
  "Passed",
];

function normalizePipelineStage(raw: string): FundraisingPipelineStage | null {
  const hit = PIPELINE_STAGES.find((s) => s.toLowerCase() === raw.trim().toLowerCase());
  return hit ?? null;
}

function resolvePipelineDeal(input: { dealId?: string; investor?: string; firm?: string }) {
  const pipeline = getMergedFundraisingPipeline();
  const dealId = input.dealId?.trim();
  if (dealId) {
    const byId = pipeline.find((d) => d.id === dealId);
    if (byId) return { ok: true as const, deal: byId };
    return { ok: false as const, error: `No pipeline deal found with id “${dealId}”.` };
  }

  const investor = input.investor?.trim().toLowerCase();
  const firm = input.firm?.trim().toLowerCase();
  if (!investor && !firm) {
    return { ok: false as const, error: "Provide dealId, investor, or firm to identify the deal." };
  }

  const matches = pipeline.filter((d) => {
    const invHit = investor ? d.investor.toLowerCase().includes(investor) : true;
    const firmHit = firm ? d.firm.toLowerCase().includes(firm) : true;
    return invHit && firmHit;
  });

  if (matches.length === 0) {
    return { ok: false as const, error: "No matching pipeline deal found." };
  }
  if (matches.length > 1) {
    return {
      ok: false as const,
      error: `Multiple deals match — specify dealId. Matches: ${matches
        .slice(0, 4)
        .map((d) => d.investor)
        .join(", ")}.`,
    };
  }
  return { ok: true as const, deal: matches[0]! };
}

export function updateFundraisingPipelineStage(input: {
  dealId?: string;
  investor?: string;
  firm?: string;
  stage: string;
  notes?: string;
}) {
  const stage = normalizePipelineStage(input.stage);
  if (!stage) {
    return { ok: false as const, error: `Unknown pipeline stage “${input.stage}”.` };
  }

  const resolved = resolvePipelineDeal(input);
  if (!resolved.ok) return resolved;

  const state = getState();
  const prior = resolved.deal;
  const patch = {
    stage,
    lastTouch: new Date().toISOString().slice(0, 10),
    ...(input.notes?.trim() ? { notes: input.notes.trim() } : {}),
  };
  state.pipelinePatches[prior.id] = {
    ...state.pipelinePatches[prior.id],
    ...patch,
  };
  touch(state);

  const after = { ...prior, ...state.pipelinePatches[prior.id] };
  return { ok: true as const, before: prior, after, dealId: prior.id };
}

export function createBoardActionViaEa(input: {
  title: string;
  owner: string;
  dueDate: string;
  status?: OaBoardActionStatus;
}) {
  const title = input.title.trim();
  const owner = input.owner.trim();
  const dueDate = input.dueDate.trim();
  if (!title || !owner || !dueDate) {
    return { ok: false as const, error: "Title, owner, and due date are required." };
  }

  const action: OaBoardAction = {
    id: `OA-EA-${Date.now().toString(36)}`,
    title,
    owner,
    dueDate,
    status: input.status ?? "Underway",
  };

  const state = getState();
  state.boardActions.unshift(action);
  touch(state);
  return { ok: true as const, action };
}

export function logEngineeringRiskViaEa(input: {
  title: string;
  program: string;
  severity?: OaEngRisk["severity"];
  likelihood?: OaEngRisk["likelihood"];
  owner?: string;
  dueDate?: string;
  mitigation?: string;
}) {
  const title = input.title.trim();
  const program = input.program.trim();
  if (!title || !program) {
    return { ok: false as const, error: "Risk title and program are required." };
  }

  const risk: OaEngRisk = {
    id: `OA-R-EA-${Date.now().toString(36)}`,
    title,
    program,
    severity: input.severity ?? "medium",
    likelihood: input.likelihood ?? "possible",
    owner: input.owner?.trim() || "Engineering",
    status: "open",
    dueDate: input.dueDate?.trim() || new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
    mitigation: input.mitigation?.trim() || "Mitigation plan pending EA follow-up.",
  };

  const state = getState();
  state.engineeringRisks.unshift(risk);
  touch(state);
  return { ok: true as const, risk };
}
