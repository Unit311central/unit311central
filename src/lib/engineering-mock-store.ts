import {
  createSeedEngActivity,
  createSeedEngDebt,
  createSeedEngIncidents,
  createSeedEngineers,
  createSeedEngProjects,
  type EngActivity,
  type EngDebtItem,
  type EngEngineer,
  type EngIncident,
  type EngProject,
  type EngStatus,
} from "@/lib/engineering-data";

export type EngineeringMockState = {
  engineers: EngEngineer[];
  projects: EngProject[];
  activity: EngActivity[];
  incidents: EngIncident[];
  debt: EngDebtItem[];
  currentSprint: string;
  upcomingReleases: string[];
  infraStatus: string;
};

let state: EngineeringMockState = {
  engineers: createSeedEngineers(),
  projects: createSeedEngProjects(),
  activity: createSeedEngActivity(),
  incidents: createSeedEngIncidents(),
  debt: createSeedEngDebt(),
  currentSprint: "Sprint 24 · 14–25 Jul 2026",
  upcomingReleases: ["2.4.0 — 31 Jul", "2.4.1 — 14 Aug", "Portal GA — 28 Aug"],
  infraStatus: "Healthy",
};

const listeners = new Set<() => void>();
function emit() {
  for (const listener of listeners) listener();
}

export function subscribeEngineeringMockStore(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getEngineeringMockSnapshot() {
  return state;
}

export function assignEngineerProject(engineerId: string, projectName: string, allocationPct: number) {
  state = {
    ...state,
    engineers: state.engineers.map((row) =>
      row.id === engineerId
        ? {
            ...row,
            currentProject: projectName,
            allocationPct,
            status: (allocationPct >= 100
              ? "Overloaded"
              : allocationPct >= 50
                ? "Allocated"
                : "Available") as EngStatus,
            availability: `${Math.max(0, 100 - allocationPct)}%`,
          }
        : row,
    ),
    activity: [
      {
        id: `ea-${Date.now()}`,
        at: new Date().toISOString(),
        label: "Allocation",
        detail: `${engineerId} assigned to ${projectName} at ${allocationPct}%`,
      },
      ...state.activity,
    ].slice(0, 30),
  };
  emit();
}

export function updateEngineerAllocation(engineerId: string, allocationPct: number) {
  const engineer = state.engineers.find((row) => row.id === engineerId);
  if (!engineer) return;
  assignEngineerProject(engineerId, engineer.currentProject, allocationPct);
}
