export type ProjectPhase = "live" | "upcoming";

export type InternalProject = {
  id: string;
  name: string;
  clientId: string | null;
  clientName: string;
  site: string | null;
  region: string | null;
  operator: string | null;
  phase: ProjectPhase;
  startDate: string | null;
  endDate: string | null;
  progressPct: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

type DbProject = {
  id: string;
  name: string;
  client_id: string | null;
  client_name: string;
  site: string | null;
  region: string | null;
  operator: string | null;
  phase: string;
  start_date: string | null;
  end_date: string | null;
  progress_pct: number | string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export const PROJECT_PHASE_OPTIONS: { value: ProjectPhase; label: string }[] = [
  { value: "live", label: "Live" },
  { value: "upcoming", label: "Upcoming" },
];

export function mapInternalProject(row: DbProject): InternalProject {
  const phase = row.phase === "live" ? "live" : "upcoming";
  return {
    id: row.id,
    name: row.name,
    clientId: row.client_id,
    clientName: row.client_name,
    site: row.site,
    region: row.region,
    operator: row.operator,
    phase,
    startDate: row.start_date,
    endDate: row.end_date,
    progressPct: Number(row.progress_pct) || 0,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function projectPhaseLabel(phase: ProjectPhase) {
  return phase === "live" ? "Live" : "Upcoming";
}

export function projectPhaseClass(phase: ProjectPhase) {
  return phase === "live"
    ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-300"
    : "border-sky-400/40 bg-sky-500/15 text-sky-300";
}

export function formatProjectDate(date: string | null) {
  if (!date) return "TBC";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00`));
}

export function createBlankProjectInput() {
  return {
    name: "",
    clientId: "",
    clientName: "",
    site: "",
    region: "",
    operator: "",
    phase: "upcoming" as ProjectPhase,
    startDate: "",
    endDate: "",
    notes: "",
  };
}
