/**
 * Northstar demo — editable org-chart reporting lines (localStorage).
 */

import type { HrEmployee } from "@/lib/hr-data";

type Listener = () => void;

export type NorthstarOrgChartState = {
  /** employeeId → managerEmployeeId (null = top-level) */
  managerByEmployeeId: Record<string, string | null>;
};

const STORAGE_KEY = "unit311-northstar-org-chart-managers-v1";
const listeners = new Set<Listener>();

let state: NorthstarOrgChartState = { managerByEmployeeId: {} };
let hydrated = false;

function persistState(next: NorthstarOrgChartState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

function ensureHydrated() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as NorthstarOrgChartState;
      if (parsed?.managerByEmployeeId) state = parsed;
    }
  } catch {
    /* ignore */
  }
}

function writeState(next: NorthstarOrgChartState) {
  ensureHydrated();
  state = next;
  persistState(next);
  for (const listener of listeners) listener();
}

export function subscribeNorthstarOrgChart(listener: Listener): () => void {
  ensureHydrated();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getNorthstarOrgChartSnapshot(): NorthstarOrgChartState {
  ensureHydrated();
  return state;
}

export function setNorthstarOrgChartManager(
  employeeId: string,
  managerEmployeeId: string | null,
) {
  ensureHydrated();
  writeState({
    managerByEmployeeId: {
      ...state.managerByEmployeeId,
      [employeeId]: managerEmployeeId,
    },
  });
}

export function resetNorthstarOrgChartManagers() {
  writeState({ managerByEmployeeId: {} });
}

export function applyNorthstarOrgChartManagers(employees: HrEmployee[]): HrEmployee[] {
  ensureHydrated();
  const overrides = state.managerByEmployeeId;
  if (!Object.keys(overrides).length) return employees;

  const byId = new Map(employees.map((row) => [row.id, row]));

  return employees.map((employee) => {
    if (!(employee.id in overrides)) return employee;
    const managerEmployeeId = overrides[employee.id] ?? null;
    const manager = managerEmployeeId ? byId.get(managerEmployeeId) : null;
    return {
      ...employee,
      managerEmployeeId,
      manager: manager?.fullName ?? (managerEmployeeId ? "Manager" : "Board"),
    };
  });
}
