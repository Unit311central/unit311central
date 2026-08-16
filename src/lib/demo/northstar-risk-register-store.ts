/**
 * Northstar Demo — editable risk register (ABHI-style + mitigation status).
 */

type Listener = () => void;

export type NorthstarRiskLevel = "H" | "M" | "L";
export type NorthstarRiskTrend = "↑" | "→" | "↓";
export type NorthstarMitigationStatus =
  | "Open"
  | "Ongoing"
  | "Overdue for mitigation"
  | "Monitoring"
  | "Closed";

export type NorthstarRiskRegisterEntry = {
  id: string;
  description: string;
  owner: string;
  impact: NorthstarRiskLevel;
  likelihood: NorthstarRiskLevel;
  rating: number;
  trend: NorthstarRiskTrend;
  mitigation: string;
  status: NorthstarMitigationStatus;
  dateRaised: string;
  reviewDate: string;
  /** Linked board pack id for board deck cross-reference. */
  boardPackId?: string;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
};

export type NorthstarRiskRegisterState = {
  risks: NorthstarRiskRegisterEntry[];
};

const STORAGE_KEY = "unit311-northstar-risk-register-v1";
const listeners = new Set<Listener>();
const LEVEL_SCORE: Record<NorthstarRiskLevel, number> = { H: 5, M: 3, L: 1 };

export function computeNorthstarRiskRating(
  impact: NorthstarRiskLevel,
  likelihood: NorthstarRiskLevel,
): number {
  return LEVEL_SCORE[impact] * LEVEL_SCORE[likelihood];
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function nowIso() {
  return new Date().toISOString();
}

function isMitigationOverdue(row: NorthstarRiskRegisterEntry): boolean {
  if (row.status === "Closed") return false;
  if (!row.reviewDate) return false;
  return row.reviewDate < todayIso();
}

function seedRisks(): NorthstarRiskRegisterEntry[] {
  const stamp = (date: string) => `${date}T10:00:00Z`;
  const rows: Array<Omit<NorthstarRiskRegisterEntry, "createdAt" | "updatedAt">> = [
    {
      id: "R-01",
      description: "Supplier concentration — Voltex Automation",
      owner: "James Okonkwo",
      impact: "H",
      likelihood: "M",
      rating: 15,
      trend: "→",
      mitigation: "Qualify Siemens Industrial as secondary source; safety stock policy",
      status: "Ongoing",
      dateRaised: "2025-11-14",
      reviewDate: "2026-08-15",
      boardPackId: "ns-deck-q2-2026",
      archived: false,
    },
    {
      id: "R-02",
      description: "Atlas programme delay / reputational impact",
      owner: "Marcus Reed",
      impact: "H",
      likelihood: "M",
      rating: 15,
      trend: "↓",
      mitigation: "Weekly steering with Sheffield Precision; phased go-live plan",
      status: "Ongoing",
      dateRaised: "2025-11-14",
      reviewDate: "2026-09-18",
      boardPackId: "ns-deck-q1-2026",
      archived: false,
    },
    {
      id: "R-03",
      description: "US expansion burn vs margin",
      owner: "Priya Shah",
      impact: "M",
      likelihood: "H",
      rating: 15,
      trend: "↑",
      mitigation: "Monthly US P&L review; hiring gated on pipeline conversion",
      status: "Monitoring",
      dateRaised: "2026-01-16",
      reviewDate: "2026-09-18",
      archived: false,
    },
    {
      id: "R-04",
      description: "Key-person dependency — CTO",
      owner: "Elena Hart",
      impact: "M",
      likelihood: "M",
      rating: 9,
      trend: "→",
      mitigation: "Deputy engineering lead programme; documentation sprint",
      status: "Open",
      dateRaised: "2026-01-16",
      reviewDate: "2026-12-11",
      archived: false,
    },
    {
      id: "R-05",
      description: "Sheffield revenue concentration (~22% ARR)",
      owner: "Elena Hart",
      impact: "M",
      likelihood: "M",
      rating: 9,
      trend: "→",
      mitigation: "Diversify enterprise pipeline; US/EU expansion",
      status: "Monitoring",
      dateRaised: "2025-09-18",
      reviewDate: "2026-09-18",
      archived: false,
    },
    {
      id: "R-06",
      description: "Cyber / IoT device security incident",
      owner: "James Okonkwo",
      impact: "H",
      likelihood: "L",
      rating: 5,
      trend: "→",
      mitigation: "ISO 27001 internal audit; pen test Q2",
      status: "Ongoing",
      dateRaised: "2026-01-16",
      reviewDate: "2026-07-01",
      archived: false,
    },
    {
      id: "R-07",
      description: "Cash collection — AR >60 days",
      owner: "Priya Shah",
      impact: "M",
      likelihood: "M",
      rating: 9,
      trend: "↓",
      mitigation: "Collections sprint; credit terms review",
      status: "Overdue for mitigation",
      dateRaised: "2026-03-20",
      reviewDate: "2026-06-30",
      boardPackId: "ns-deck-q2-2026",
      archived: false,
    },
    {
      id: "R-08",
      description: "Competitor pricing pressure — SensorForge",
      owner: "Sales",
      impact: "M",
      likelihood: "M",
      rating: 9,
      trend: "↑",
      mitigation: "Value-based selling; competitive intelligence monitoring",
      status: "Open",
      dateRaised: "2026-03-20",
      reviewDate: "2026-09-18",
      archived: false,
    },
    {
      id: "R-09",
      description: "Talent retention in Bristol R&D",
      owner: "HR",
      impact: "M",
      likelihood: "L",
      rating: 3,
      trend: "→",
      mitigation: "Comp bench review; graduate programme",
      status: "Monitoring",
      dateRaised: "2025-11-14",
      reviewDate: "2026-12-11",
      archived: false,
    },
    {
      id: "R-10",
      description: "Insurance renewal — D&O premium increase",
      owner: "Priya Shah",
      impact: "L",
      likelihood: "M",
      rating: 3,
      trend: "↑",
      mitigation: "Broker RFP; board approval at Q3 meeting",
      status: "Open",
      dateRaised: "2026-06-19",
      reviewDate: "2026-09-18",
      boardPackId: "ns-deck-q3-2026-draft",
      archived: false,
    },
  ];

  return rows.map((row) => ({
    ...row,
    status: isMitigationOverdue({ ...row, createdAt: "", updatedAt: "" })
      ? "Overdue for mitigation"
      : row.status,
    createdAt: stamp(row.dateRaised),
    updatedAt: stamp(row.dateRaised),
  }));
}

let state: NorthstarRiskRegisterState = { risks: seedRisks() };
const serverSnapshot: NorthstarRiskRegisterState = { risks: seedRisks() };
let hydrated = false;

function readPersistedState(): NorthstarRiskRegisterState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as NorthstarRiskRegisterState;
    if (!parsed || !Array.isArray(parsed.risks)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function persistState(next: NorthstarRiskRegisterState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

function ensureHydrated() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  const persisted = readPersistedState();
  if (persisted) state = persisted;
  else persistState(state);
}

function writeState(next: NorthstarRiskRegisterState) {
  ensureHydrated();
  state = next;
  persistState(next);
  listeners.forEach((listener) => listener());
}

export function getNorthstarRiskRegisterState(): NorthstarRiskRegisterState {
  ensureHydrated();
  return state;
}

export function getNorthstarRiskRegisterServerSnapshot(): NorthstarRiskRegisterState {
  return serverSnapshot;
}

export function subscribeNorthstarRiskRegister(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function nextRiskId(existing: NorthstarRiskRegisterEntry[]): string {
  let max = 0;
  for (const row of existing) {
    const match = /^R-(\d+)$/i.exec(row.id.trim());
    if (match) max = Math.max(max, Number(match[1]));
  }
  return `R-${String(max + 1).padStart(2, "0")}`;
}

export type UpsertNorthstarRiskInput = Partial<NorthstarRiskRegisterEntry> & {
  description: string;
};

export function upsertNorthstarRisk(input: UpsertNorthstarRiskInput): NorthstarRiskRegisterEntry {
  const current = getNorthstarRiskRegisterState();
  const now = nowIso();
  const existing = input.id ? current.risks.find((row) => row.id === input.id) : undefined;
  const impact = (input.impact ?? existing?.impact ?? "M") as NorthstarRiskLevel;
  const likelihood = (input.likelihood ?? existing?.likelihood ?? "M") as NorthstarRiskLevel;
  const rating =
    typeof input.rating === "number" && Number.isFinite(input.rating)
      ? input.rating
      : computeNorthstarRiskRating(impact, likelihood);

  const next: NorthstarRiskRegisterEntry = {
    id: existing?.id ?? input.id ?? nextRiskId(current.risks),
    description: input.description.trim(),
    owner: (input.owner ?? existing?.owner ?? "").trim(),
    impact,
    likelihood,
    rating,
    trend: (input.trend ?? existing?.trend ?? "→") as NorthstarRiskTrend,
    mitigation: (input.mitigation ?? existing?.mitigation ?? "").trim(),
    status: (input.status ?? existing?.status ?? "Open") as NorthstarMitigationStatus,
    dateRaised: (input.dateRaised ?? existing?.dateRaised ?? todayIso()).slice(0, 10),
    reviewDate: (input.reviewDate ?? existing?.reviewDate ?? todayIso()).slice(0, 10),
    boardPackId: input.boardPackId ?? existing?.boardPackId,
    archived: typeof input.archived === "boolean" ? input.archived : (existing?.archived ?? false),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  if (isMitigationOverdue(next) && next.status !== "Closed") {
    next.status = "Overdue for mitigation";
  }

  const risks = existing
    ? current.risks.map((row) => (row.id === existing.id ? next : row))
    : [next, ...current.risks];

  writeState({ risks });
  return next;
}

export function deleteNorthstarRisk(id: string) {
  const current = getNorthstarRiskRegisterState();
  writeState({ risks: current.risks.filter((row) => row.id !== id) });
}

export function archiveNorthstarRisk(id: string, archived = true) {
  const current = getNorthstarRiskRegisterState();
  const now = nowIso();
  writeState({
    risks: current.risks.map((row) =>
      row.id === id ? { ...row, archived, status: archived ? "Closed" : row.status, updatedAt: now } : row,
    ),
  });
}

export function listActiveNorthstarRisks(): NorthstarRiskRegisterEntry[] {
  return getNorthstarRiskRegisterState()
    .risks.filter((row) => !row.archived)
    .slice()
    .sort((a, b) => b.rating - a.rating || a.id.localeCompare(b.id));
}

/** Heatmap cell counts keyed by impact-likelihood. */
export function buildNorthstarRiskHeatmap(
  risks: NorthstarRiskRegisterEntry[] = listActiveNorthstarRisks(),
): Record<string, NorthstarRiskRegisterEntry[]> {
  const grid: Record<string, NorthstarRiskRegisterEntry[]> = {};
  for (const impact of ["H", "M", "L"] as const) {
    for (const likelihood of ["H", "M", "L"] as const) {
      grid[`${impact}-${likelihood}`] = [];
    }
  }
  for (const risk of risks) {
    const key = `${risk.impact}-${risk.likelihood}`;
    grid[key]?.push(risk);
  }
  return grid;
}
