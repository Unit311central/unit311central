/**
 * Editable board governance records for generic customer workspaces.
 */

import { readBrowserCustomerWorkspaceSlug } from "@/lib/customer-workspace-surface";

export type CustomerBoardMeeting = {
  id: string;
  title: string;
  scheduledFor: string;
  location: string;
  notes: string;
};

export type CustomerBoardAction = {
  id: string;
  title: string;
  owner: string;
  dueDate: string;
  status: "open" | "underway" | "complete" | "blocked";
};

export type CustomerBoardRisk = {
  id: string;
  title: string;
  owner: string;
  impact: "L" | "M" | "H";
  status: "active" | "mitigating" | "monitoring" | "closed";
};

export type CustomerBoardGovernanceState = {
  meetings: CustomerBoardMeeting[];
  actions: CustomerBoardAction[];
  risks: CustomerBoardRisk[];
};

type Listener = () => void;

const STORAGE_VERSION = "v1";
const buckets = new Map<string, CustomerBoardGovernanceState>();
const listeners = new Set<Listener>();

function storageKey(slug: string) {
  return `unit311-customer-board-governance-${STORAGE_VERSION}:${slug}`;
}

function emptyState(): CustomerBoardGovernanceState {
  return { meetings: [], actions: [], risks: [] };
}

function clone(state: CustomerBoardGovernanceState): CustomerBoardGovernanceState {
  return {
    meetings: state.meetings.map((row) => ({ ...row })),
    actions: state.actions.map((row) => ({ ...row })),
    risks: state.risks.map((row) => ({ ...row })),
  };
}

function resolveSlug(slug?: string | null) {
  return slug?.trim() || readBrowserCustomerWorkspaceSlug() || "default";
}

function readPersisted(slug: string): CustomerBoardGovernanceState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(storageKey(slug));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CustomerBoardGovernanceState;
    if (!Array.isArray(parsed.meetings) || !Array.isArray(parsed.actions) || !Array.isArray(parsed.risks)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function persist(slug: string, state: CustomerBoardGovernanceState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey(slug), JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

function getState(slug?: string | null): CustomerBoardGovernanceState {
  const key = resolveSlug(slug);
  const cached = buckets.get(key);
  if (cached) return cached;
  const initial = clone(readPersisted(key) ?? emptyState());
  buckets.set(key, initial);
  return initial;
}

function writeState(slug: string | null | undefined, next: CustomerBoardGovernanceState) {
  const key = resolveSlug(slug);
  const cloned = clone(next);
  buckets.set(key, cloned);
  persist(key, cloned);
  for (const listener of listeners) listener();
}

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function subscribeCustomerBoardGovernance(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getCustomerBoardGovernanceSnapshot(slug?: string | null) {
  return clone(getState(slug));
}

export function upsertCustomerBoardMeeting(
  input: Omit<CustomerBoardMeeting, "id"> & { id?: string },
  slug?: string | null,
) {
  const state = getState(slug);
  const id = input.id ?? uid("bm");
  const row: CustomerBoardMeeting = { id, title: input.title, scheduledFor: input.scheduledFor, location: input.location, notes: input.notes };
  const meetings = state.meetings.some((item) => item.id === id)
    ? state.meetings.map((item) => (item.id === id ? row : item))
    : [...state.meetings, row];
  writeState(slug, { ...state, meetings });
  return row;
}

export function deleteCustomerBoardMeeting(id: string, slug?: string | null) {
  const state = getState(slug);
  writeState(slug, { ...state, meetings: state.meetings.filter((row) => row.id !== id) });
}

export function upsertCustomerBoardAction(
  input: Omit<CustomerBoardAction, "id"> & { id?: string },
  slug?: string | null,
) {
  const state = getState(slug);
  const id = input.id ?? uid("ba");
  const row: CustomerBoardAction = { id, ...input };
  const actions = state.actions.some((item) => item.id === id)
    ? state.actions.map((item) => (item.id === id ? row : item))
    : [...state.actions, row];
  writeState(slug, { ...state, actions });
  return row;
}

export function deleteCustomerBoardAction(id: string, slug?: string | null) {
  const state = getState(slug);
  writeState(slug, { ...state, actions: state.actions.filter((row) => row.id !== id) });
}

export function upsertCustomerBoardRisk(
  input: Omit<CustomerBoardRisk, "id"> & { id?: string },
  slug?: string | null,
) {
  const state = getState(slug);
  const id = input.id ?? uid("br");
  const row: CustomerBoardRisk = { id, ...input };
  const risks = state.risks.some((item) => item.id === id)
    ? state.risks.map((item) => (item.id === id ? row : item))
    : [...state.risks, row];
  writeState(slug, { ...state, risks });
  return row;
}

export function deleteCustomerBoardRisk(id: string, slug?: string | null) {
  const state = getState(slug);
  writeState(slug, { ...state, risks: state.risks.filter((row) => row.id !== id) });
}
