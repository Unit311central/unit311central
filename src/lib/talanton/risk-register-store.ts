/**
 * Talanton Board / Corporate Risk Register — editable local store.
 */

import { TI_BOARD_RISKS } from "@/lib/talanton/board-portal-data";

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
  /** ISO date — when the risk was added to the register. */
  dateAdded: string;
  reviewDate: string;
  /** Optional link to a board pack (meeting deck). */
  boardPackId: string;
  boardPackLabel: string;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
};

export type TiRiskRegisterState = {
  risks: TiRiskRegisterEntry[];
};

const STORAGE_KEY = "unit311-talanton-risk-register-v1";
const listeners = new Set<Listener>();

const LEVEL_SCORE: Record<TiRiskLevel, number> = { H: 5, M: 3, L: 1 };

export function computeTiRiskRating(impact: TiRiskLevel, likelihood: TiRiskLevel): number {
  return LEVEL_SCORE[impact] * LEVEL_SCORE[likelihood];
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function nowIso() {
  return new Date().toISOString();
}

function seedRisks(): TiRiskRegisterEntry[] {
  const stamp = (date: string) => `${date}T10:00:00Z`;
  return TI_BOARD_RISKS.map((risk, index) => ({
    id: risk.id,
    description: risk.description,
    owner: risk.owner,
    impact: risk.impact,
    likelihood: risk.likelihood,
    rating: risk.rating,
    mitigation: risk.mitigation,
    status: risk.status,
    dateAdded: index < 2 ? "2026-05-14" : index < 3 ? "2026-06-01" : "2026-07-10",
    reviewDate: "2026-08-20",
    boardPackId: index === 0 ? "ti-bp-may" : index === 1 ? "ti-bp-may" : "",
    boardPackLabel:
      index === 0
        ? "Talanton Impact Board Pack — May 2026"
        : index === 1
          ? "Talanton Impact Board Pack — May 2026"
          : "",
    archived: false,
    createdAt: stamp(index < 2 ? "2026-05-14" : "2026-06-01"),
    updatedAt: stamp(index < 2 ? "2026-05-14" : "2026-06-01"),
  }));
}

function defaultState(): TiRiskRegisterState {
  return { risks: seedRisks() };
}

function normalizeEntry(row: Partial<TiRiskRegisterEntry>): TiRiskRegisterEntry | null {
  const id = String(row.id ?? "").trim();
  const description = String(row.description ?? "").trim();
  if (!id || !description) return null;
  const impact = (row.impact ?? "M") as TiRiskLevel;
  const likelihood = (row.likelihood ?? "M") as TiRiskLevel;
  const dateAdded = String(row.dateAdded ?? todayIso()).slice(0, 10);
  return {
    id,
    description,
    owner: String(row.owner ?? "").trim() || "Unassigned",
    impact,
    likelihood,
    rating: row.rating ?? computeTiRiskRating(impact, likelihood),
    mitigation: String(row.mitigation ?? "").trim(),
    status: String(row.status ?? "Open").trim() || "Open",
    dateAdded,
    reviewDate: String(row.reviewDate ?? dateAdded).slice(0, 10),
    boardPackId: String(row.boardPackId ?? "").trim(),
    boardPackLabel: String(row.boardPackLabel ?? "").trim(),
    archived: Boolean(row.archived),
    createdAt: String(row.createdAt ?? nowIso()),
    updatedAt: String(row.updatedAt ?? nowIso()),
  };
}

function normalizeState(raw: unknown): TiRiskRegisterState | null {
  if (!raw || typeof raw !== "object") return null;
  const parsed = raw as TiRiskRegisterState;
  if (!Array.isArray(parsed.risks)) return null;
  const risks = parsed.risks
    .map((row) => normalizeEntry(row))
    .filter((row): row is TiRiskRegisterEntry => Boolean(row));
  return risks.length > 0 ? { risks } : null;
}

function readPersistedState(): TiRiskRegisterState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return normalizeState(JSON.parse(raw));
  } catch {
    return null;
  }
}

function persistState(next: TiRiskRegisterState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

let state: TiRiskRegisterState = defaultState();
let hydrated = false;

const serverSnapshot: TiRiskRegisterState = defaultState();

function ensureHydrated() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  const persisted = readPersistedState();
  if (persisted) state = persisted;
}

function emit() {
  listeners.forEach((listener) => listener());
}

function writeState(next: TiRiskRegisterState) {
  state = next;
  persistState(next);
  emit();
}

export function getTiRiskRegisterState(): TiRiskRegisterState {
  ensureHydrated();
  return state;
}

export function getTiRiskRegisterServerSnapshot(): TiRiskRegisterState {
  return serverSnapshot;
}

export function subscribeTiRiskRegister(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function nextRiskId(existing: TiRiskRegisterEntry[]): string {
  const nums = existing
    .map((r) => /^TI-R(\d+)$/i.exec(r.id)?.[1])
    .filter(Boolean)
    .map((n) => Number(n));
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `TI-R${String(next).padStart(2, "0")}`;
}

export type UpsertTiRiskInput = Partial<TiRiskRegisterEntry> & {
  description: string;
};

export function upsertTiRisk(input: UpsertTiRiskInput): TiRiskRegisterEntry {
  const current = getTiRiskRegisterState();
  const now = nowIso();
  const impact = (input.impact ?? "M") as TiRiskLevel;
  const likelihood = (input.likelihood ?? "M") as TiRiskLevel;
  const existing = input.id
    ? current.risks.find((r) => r.id === input.id)
    : undefined;
  const id = input.id?.trim() || nextRiskId(current.risks);
  const dateAdded = input.dateAdded ?? existing?.dateAdded ?? todayIso();

  const next: TiRiskRegisterEntry = {
    id,
    description: input.description.trim(),
    owner: String(input.owner ?? existing?.owner ?? "").trim() || "Unassigned",
    impact,
    likelihood,
    rating: input.rating ?? computeTiRiskRating(impact, likelihood),
    mitigation: String(input.mitigation ?? existing?.mitigation ?? "").trim(),
    status: String(input.status ?? existing?.status ?? "Open").trim() || "Open",
    dateAdded,
    reviewDate: String(input.reviewDate ?? existing?.reviewDate ?? dateAdded).slice(0, 10),
    boardPackId: String(input.boardPackId ?? existing?.boardPackId ?? "").trim(),
    boardPackLabel: String(input.boardPackLabel ?? existing?.boardPackLabel ?? "").trim(),
    archived: input.archived ?? existing?.archived ?? false,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  const risks = existing
    ? current.risks.map((r) => (r.id === id ? next : r))
    : [next, ...current.risks];
  writeState({ risks });
  return next;
}

export function deleteTiRisk(id: string) {
  const current = getTiRiskRegisterState();
  writeState({ risks: current.risks.filter((r) => r.id !== id) });
}

export function archiveTiRisk(id: string) {
  const current = getTiRiskRegisterState();
  writeState({
    risks: current.risks.map((r) =>
      r.id === id ? { ...r, archived: true, status: "Archived", updatedAt: nowIso() } : r,
    ),
  });
}

export function restoreTiRisk(id: string) {
  const current = getTiRiskRegisterState();
  writeState({
    risks: current.risks.map((r) =>
      r.id === id ? { ...r, archived: false, status: "Open", updatedAt: nowIso() } : r,
    ),
  });
}

export function listActiveTiRisks(): TiRiskRegisterEntry[] {
  return getTiRiskRegisterState()
    .risks.filter((r) => !r.archived)
    .sort((a, b) => b.dateAdded.localeCompare(a.dateAdded));
}
