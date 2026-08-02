/**
 * ABHI Risk Register — local store for Corporate Information.
 * Seeded from the same board-pack risks (R-01…R-06).
 */

import type { AbhiRiskTrend } from "@/lib/abhi/board-pack-model";
import { abhiRiskTrendLabel } from "@/lib/abhi/board-pack-model";

type Listener = () => void;

export type AbhiRiskLevel = "H" | "M" | "L";
export type AbhiRiskTrendSymbol = AbhiRiskTrend;
export type AbhiRiskTrendLabel = "Increasing" | "Stable" | "Reducing";

export type AbhiRiskRegisterEntry = {
  id: string;
  description: string;
  owner: string;
  impact: AbhiRiskLevel;
  likelihood: AbhiRiskLevel;
  rating: number;
  trend: AbhiRiskTrendSymbol;
  mitigation: string;
  status: string;
  dateRaised: string;
  reviewDate: string;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AbhiRiskRegisterState = {
  risks: AbhiRiskRegisterEntry[];
};

const STORAGE_KEY = "unit311-abhi-risk-register-v1";
const listeners = new Set<Listener>();

const LEVEL_SCORE: Record<AbhiRiskLevel, number> = { H: 5, M: 3, L: 1 };

const TREND_FROM_LABEL: Record<AbhiRiskTrendLabel, AbhiRiskTrendSymbol> = {
  Increasing: "↑",
  Stable: "→",
  Reducing: "↓",
};

export function computeAbhiRiskRating(impact: AbhiRiskLevel, likelihood: AbhiRiskLevel): number {
  return LEVEL_SCORE[impact] * LEVEL_SCORE[likelihood];
}

export function abhiRiskRegisterTrendLabel(trend: AbhiRiskTrendSymbol): AbhiRiskTrendLabel {
  return abhiRiskTrendLabel(trend);
}

export function abhiRiskRegisterTrendFromLabel(label: AbhiRiskTrendLabel): AbhiRiskTrendSymbol {
  return TREND_FROM_LABEL[label];
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function nowIso() {
  return new Date().toISOString();
}

function seedRisks(): AbhiRiskRegisterEntry[] {
  const stamp = (date: string) => `${date}T10:00:00Z`;
  return [
    {
      id: "R-01",
      description:
        "Tier-one sponsorship renewals slip beyond Q3, widening YTD revenue gap",
      owner: "Jonathan Evans",
      impact: "H",
      likelihood: "M",
      rating: 15,
      trend: "↑",
      mitigation:
        "Executive outreach to MedCore and Helix; WHX co-brand packages offered by 20 Aug.",
      status: "Active",
      dateRaised: "2026-05-12",
      reviewDate: "2026-08-15",
      archived: false,
      createdAt: stamp("2026-05-12"),
      updatedAt: stamp("2026-05-12"),
    },
    {
      id: "R-02",
      description: "WHX Dubai pavilion build delay due to contractor capacity",
      owner: "Michelle Michelucci",
      impact: "H",
      likelihood: "M",
      rating: 12,
      trend: "→",
      mitigation: "Secondary fit-out supplier on standby; weekly DWTC programme calls.",
      status: "Mitigating",
      dateRaised: "2026-06-02",
      reviewDate: "2026-08-08",
      archived: false,
      createdAt: stamp("2026-06-02"),
      updatedAt: stamp("2026-06-02"),
    },
    {
      id: "R-03",
      description: "MHRA SaMD reclassification creates compliance burden for member SMEs",
      owner: "Phil Brown",
      impact: "M",
      likelihood: "H",
      rating: 12,
      trend: "↑",
      mitigation:
        "Member toolkit and webinar series; regulatory helpline hours extended in Sep.",
      status: "New",
      dateRaised: "2026-07-21",
      reviewDate: "2026-08-20",
      archived: false,
      createdAt: stamp("2026-07-21"),
      updatedAt: stamp("2026-07-21"),
    },
    {
      id: "R-04",
      description: "NHS adoption pathway changes reduce member market access assumptions",
      owner: "Judith Mellis",
      impact: "H",
      likelihood: "L",
      rating: 9,
      trend: "→",
      mitigation: "Working group scenario planning; quarterly NHS stakeholder map refresh.",
      status: "Monitoring",
      dateRaised: "2026-03-18",
      reviewDate: "2026-09-01",
      archived: false,
      createdAt: stamp("2026-03-18"),
      updatedAt: stamp("2026-03-18"),
    },
    {
      id: "R-05",
      description: "Key person dependency in International Events team during WHX peak",
      owner: "Jane Lewis",
      impact: "M",
      likelihood: "M",
      rating: 9,
      trend: "↓",
      mitigation:
        "Events Coordinator hire closing 24 Aug; cross-training plan for UK pavilion ops.",
      status: "Mitigating",
      dateRaised: "2026-04-09",
      reviewDate: "2026-08-24",
      archived: false,
      createdAt: stamp("2026-04-09"),
      updatedAt: stamp("2026-04-09"),
    },
    {
      id: "R-06",
      description: "Membership churn among early-stage SMEs ahead of Dec renewal window",
      owner: "Peter Ellingworth",
      impact: "M",
      likelihood: "M",
      rating: 6,
      trend: "→",
      mitigation:
        "Retention playbook with staged fee options; CEO call programme for at-risk accounts.",
      status: "Monitoring",
      dateRaised: "2026-06-30",
      reviewDate: "2026-09-15",
      archived: false,
      createdAt: stamp("2026-06-30"),
      updatedAt: stamp("2026-06-30"),
    },
  ];
}

function defaultState(): AbhiRiskRegisterState {
  return { risks: seedRisks() };
}

function normalizeLevel(value: unknown, fallback: AbhiRiskLevel): AbhiRiskLevel {
  if (value === "H" || value === "M" || value === "L") return value;
  return fallback;
}

function normalizeTrend(value: unknown): AbhiRiskTrendSymbol {
  if (value === "↑" || value === "→" || value === "↓") return value;
  if (value === "Increasing") return "↑";
  if (value === "Reducing") return "↓";
  return "→";
}

function normalizeEntry(row: Partial<AbhiRiskRegisterEntry>): AbhiRiskRegisterEntry | null {
  if (!row || typeof row !== "object" || !row.id) return null;
  const impact = normalizeLevel(row.impact, "M");
  const likelihood = normalizeLevel(row.likelihood, "M");
  const rating =
    typeof row.rating === "number" && Number.isFinite(row.rating)
      ? row.rating
      : computeAbhiRiskRating(impact, likelihood);
  return {
    id: String(row.id),
    description: String(row.description ?? ""),
    owner: String(row.owner ?? ""),
    impact,
    likelihood,
    rating,
    trend: normalizeTrend(row.trend),
    mitigation: String(row.mitigation ?? ""),
    status: String(row.status ?? "Active"),
    dateRaised: String(row.dateRaised ?? todayIso()).slice(0, 10),
    reviewDate: String(row.reviewDate ?? todayIso()).slice(0, 10),
    archived: Boolean(row.archived) || row.status === "Archived",
    createdAt: String(row.createdAt ?? nowIso()),
    updatedAt: String(row.updatedAt ?? nowIso()),
  };
}

function normalizeState(raw: unknown): AbhiRiskRegisterState | null {
  if (!raw || typeof raw !== "object") return null;
  const parsed = raw as AbhiRiskRegisterState;
  if (!Array.isArray(parsed.risks)) return null;
  const risks = parsed.risks
    .map((row) => normalizeEntry(row))
    .filter((row): row is AbhiRiskRegisterEntry => Boolean(row));
  return { risks };
}

function readPersistedState(): AbhiRiskRegisterState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return normalizeState(JSON.parse(raw));
  } catch {
    return null;
  }
}

function persistState(next: AbhiRiskRegisterState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore quota / private mode */
  }
}

let state: AbhiRiskRegisterState = defaultState();
let hydrated = false;

const serverSnapshot: AbhiRiskRegisterState = defaultState();

function ensureHydrated() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  const persisted = readPersistedState();
  if (persisted) {
    state = persisted;
  } else {
    persistState(state);
  }
}

function writeState(next: AbhiRiskRegisterState) {
  ensureHydrated();
  state = next;
  persistState(next);
  listeners.forEach((listener) => listener());
}

export function getAbhiRiskRegisterState(): AbhiRiskRegisterState {
  ensureHydrated();
  return state;
}

export function getAbhiRiskRegisterServerSnapshot(): AbhiRiskRegisterState {
  return serverSnapshot;
}

export function subscribeAbhiRiskRegister(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function nextRiskId(existing: AbhiRiskRegisterEntry[]): string {
  let max = 0;
  for (const row of existing) {
    const match = /^R-(\d+)$/i.exec(row.id.trim());
    if (match) max = Math.max(max, Number(match[1]));
  }
  return `R-${String(max + 1).padStart(2, "0")}`;
}

export type UpsertAbhiRiskInput = Partial<AbhiRiskRegisterEntry> & {
  description: string;
};

export function upsertAbhiRisk(input: UpsertAbhiRiskInput): AbhiRiskRegisterEntry {
  const current = getAbhiRiskRegisterState();
  const now = nowIso();
  const existing = input.id
    ? current.risks.find((row) => row.id === input.id)
    : undefined;

  const impact = normalizeLevel(input.impact ?? existing?.impact, "M");
  const likelihood = normalizeLevel(input.likelihood ?? existing?.likelihood, "M");
  const rating =
    typeof input.rating === "number" && Number.isFinite(input.rating)
      ? input.rating
      : existing?.rating ?? computeAbhiRiskRating(impact, likelihood);

  const next: AbhiRiskRegisterEntry = {
    id: existing?.id ?? input.id ?? nextRiskId(current.risks),
    description: input.description.trim(),
    owner: (input.owner ?? existing?.owner ?? "").trim(),
    impact,
    likelihood,
    rating,
    trend: normalizeTrend(input.trend ?? existing?.trend ?? "→"),
    mitigation: (input.mitigation ?? existing?.mitigation ?? "").trim(),
    status: (input.status ?? existing?.status ?? "Active").trim() || "Active",
    dateRaised: (input.dateRaised ?? existing?.dateRaised ?? todayIso()).slice(0, 10),
    reviewDate: (input.reviewDate ?? existing?.reviewDate ?? todayIso()).slice(0, 10),
    archived:
      typeof input.archived === "boolean"
        ? input.archived
        : (existing?.archived ?? false),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  const risks = existing
    ? current.risks.map((row) => (row.id === existing.id ? next : row))
    : [next, ...current.risks];

  writeState({ risks });
  return next;
}

export function deleteAbhiRisk(id: string) {
  const current = getAbhiRiskRegisterState();
  writeState({ risks: current.risks.filter((row) => row.id !== id) });
}

export function archiveAbhiRisk(id: string, archived = true) {
  const current = getAbhiRiskRegisterState();
  const now = nowIso();
  writeState({
    risks: current.risks.map((row) =>
      row.id === id
        ? {
            ...row,
            archived,
            status: archived ? "Archived" : row.status === "Archived" ? "Active" : row.status,
            updatedAt: now,
          }
        : row,
    ),
  });
}

/** Non-archived risks sorted by rating descending (for board pack and summaries). */
export function listActiveAbhiRisks(): AbhiRiskRegisterEntry[] {
  return getAbhiRiskRegisterState()
    .risks.filter((row) => !row.archived)
    .slice()
    .sort((a, b) => b.rating - a.rating || a.id.localeCompare(b.id));
}
