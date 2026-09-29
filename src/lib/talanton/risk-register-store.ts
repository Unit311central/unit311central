/**
 * Talanton Board / Corporate Risk Register — Supabase-backed client cache.
 */

import {
  deleteGovernanceRiskApi,
  fetchGovernanceRisks,
  migrateLocalGovernanceOnce,
  patchGovernanceRisk,
  postGovernanceRisk,
} from "@/lib/talanton/governance-api-client";

type Listener = () => void;

export type TiRiskLevel = "H" | "M" | "L";

export type TiRiskRegisterEntry = {
  id: string;
  description: string;
  owner: string;
  impact: TiRiskLevel;
  likelihood: TiRiskLevel;
  rating: number;
  mitigation: string;
  status: string;
  dateAdded: string;
  reviewDate: string;
  boardPackId: string;
  boardPackLabel: string;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
};

export type TiRiskRegisterState = {
  risks: TiRiskRegisterEntry[];
  status: "idle" | "loading" | "ready" | "error";
  error: string | null;
};

const LEVEL_SCORE: Record<TiRiskLevel, number> = { H: 5, M: 3, L: 1 };

export function computeTiRiskRating(impact: TiRiskLevel, likelihood: TiRiskLevel): number {
  return LEVEL_SCORE[impact] * LEVEL_SCORE[likelihood];
}

const listeners = new Set<Listener>();

let state: TiRiskRegisterState = {
  risks: [],
  status: "idle",
  error: null,
};

const serverSnapshot: TiRiskRegisterState = {
  risks: [],
  status: "idle",
  error: null,
};

let loadPromise: Promise<void> | null = null;

function emit() {
  state = { ...state, risks: [...state.risks] };
  listeners.forEach((listener) => listener());
}

function setState(partial: Partial<TiRiskRegisterState>) {
  state = { ...state, ...partial };
  emit();
}

export async function refreshTiRiskRegisterFromServer(): Promise<void> {
  setState({ status: "loading", error: null });
  try {
    await migrateLocalGovernanceOnce();
    const risks = await fetchGovernanceRisks();
    setState({ risks, status: "ready", error: null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load risk register.";
    console.error("[risk-register-store refresh]", message);
    setState({ risks: [], status: "error", error: message });
  }
}

function ensureLoaded() {
  if (typeof window === "undefined") return Promise.resolve();
  if (state.status === "ready" || state.status === "error") return Promise.resolve();
  if (!loadPromise) {
    loadPromise = refreshTiRiskRegisterFromServer().finally(() => {
      loadPromise = null;
    });
  }
  return loadPromise;
}

export function getTiRiskRegisterState(): TiRiskRegisterState {
  void ensureLoaded();
  return state;
}

export function getTiRiskRegisterServerSnapshot(): TiRiskRegisterState {
  if (process.env.TALANTON_EA_SUITE === "1" && serverSnapshot.risks.length === 0) {
    const { seedRisksFromFixtures } =
      require("@/lib/talanton/governance-seed-data") as typeof import("@/lib/talanton/governance-seed-data");
    return {
      risks: seedRisksFromFixtures(),
      status: "ready",
      error: null,
    };
  }
  return serverSnapshot;
}

export function subscribeTiRiskRegister(listener: Listener) {
  listeners.add(listener);
  void ensureLoaded();
  return () => listeners.delete(listener);
}

export type UpsertTiRiskInput = Partial<TiRiskRegisterEntry> & {
  description: string;
};

export async function upsertTiRisk(input: UpsertTiRiskInput): Promise<TiRiskRegisterEntry> {
  const impact = (input.impact ?? "M") as TiRiskLevel;
  const likelihood = (input.likelihood ?? "M") as TiRiskLevel;
  const payload = {
    ...input,
    impact,
    likelihood,
    rating: input.rating ?? computeTiRiskRating(impact, likelihood),
  };
  const saved = input.id
    ? await patchGovernanceRisk(input.id, payload)
    : await postGovernanceRisk(payload);
  const existing = state.risks.some((r) => r.id === saved.id);
  const risks = existing
    ? state.risks.map((r) => (r.id === saved.id ? saved : r))
    : [saved, ...state.risks];
  setState({ risks, status: "ready", error: null });
  return saved;
}

export async function deleteTiRisk(id: string): Promise<void> {
  await deleteGovernanceRiskApi(id);
  setState({
    risks: state.risks.filter((r) => r.id !== id),
    status: "ready",
    error: null,
  });
}

export async function archiveTiRisk(id: string): Promise<void> {
  const existing = state.risks.find((r) => r.id === id);
  if (!existing) throw new Error("Risk not found.");
  await upsertTiRisk({
    ...existing,
    archived: true,
    status: "Archived",
  });
}

export async function restoreTiRisk(id: string): Promise<void> {
  const existing = state.risks.find((r) => r.id === id);
  if (!existing) throw new Error("Risk not found.");
  await upsertTiRisk({
    ...existing,
    archived: false,
    status: "Open",
  });
}

export function listActiveTiRisks(): TiRiskRegisterEntry[] {
  return getTiRiskRegisterState()
    .risks.filter((r) => !r.archived)
    .sort((a, b) => b.dateAdded.localeCompare(a.dateAdded));
}
