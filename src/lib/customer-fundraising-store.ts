/**
 * Workspace-owned fundraising records for generic customer tenants.
 */

import { readBrowserCustomerWorkspaceSlug } from "@/lib/customer-workspace-surface";
import { resolveSlugReportingCurrency } from "@/lib/financial-reporting-currency";

export type CustomerFundraisingInvestor = {
  id: string;
  name: string;
  type: string;
  stage: string;
  amount: number;
  currency: string;
  notes: string;
};

export type CustomerFundraisingPipelineDeal = {
  id: string;
  name: string;
  stage: string;
  amount: number;
  currency: string;
  expectedClose: string;
  notes: string;
};

export type CustomerFundraisingPitchDeck = {
  id: string;
  title: string;
  version: string;
  url: string;
  notes: string;
};

export type CustomerFundraisingDataRoom = {
  id: string;
  name: string;
  url: string;
  investor: string;
  notes: string;
};

export type CustomerFundraisingMeeting = {
  id: string;
  title: string;
  scheduledFor: string;
  investor: string;
  notes: string;
};

export type CustomerFundraisingState = {
  investors: CustomerFundraisingInvestor[];
  pipeline: CustomerFundraisingPipelineDeal[];
  pitchDecks: CustomerFundraisingPitchDeck[];
  dataRooms: CustomerFundraisingDataRoom[];
  meetings: CustomerFundraisingMeeting[];
};

type Listener = () => void;

const STORAGE_VERSION = "v1";
const buckets = new Map<string, CustomerFundraisingState>();
const listeners = new Set<Listener>();

function storageKey(slug: string) {
  return `unit311-customer-fundraising-${STORAGE_VERSION}:${slug}`;
}

function emptyState(): CustomerFundraisingState {
  return { investors: [], pipeline: [], pitchDecks: [], dataRooms: [], meetings: [] };
}

function clone(state: CustomerFundraisingState): CustomerFundraisingState {
  return {
    investors: state.investors.map((row) => ({ ...row })),
    pipeline: state.pipeline.map((row) => ({ ...row })),
    pitchDecks: state.pitchDecks.map((row) => ({ ...row })),
    dataRooms: state.dataRooms.map((row) => ({ ...row })),
    meetings: state.meetings.map((row) => ({ ...row })),
  };
}

function resolveSlug(slug?: string | null) {
  return slug?.trim() || readBrowserCustomerWorkspaceSlug() || "default";
}

function defaultCurrency(slug?: string | null) {
  return resolveSlugReportingCurrency(slug ?? readBrowserCustomerWorkspaceSlug() ?? undefined);
}

function readPersisted(slug: string): CustomerFundraisingState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(storageKey(slug));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CustomerFundraisingState;
    if (!Array.isArray(parsed.investors) || !Array.isArray(parsed.pipeline)) return null;
    return {
      investors: parsed.investors,
      pipeline: parsed.pipeline,
      pitchDecks: Array.isArray(parsed.pitchDecks) ? parsed.pitchDecks : [],
      dataRooms: Array.isArray(parsed.dataRooms) ? parsed.dataRooms : [],
      meetings: Array.isArray(parsed.meetings) ? parsed.meetings : [],
    };
  } catch {
    return null;
  }
}

function persist(slug: string, state: CustomerFundraisingState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey(slug), JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

function getState(slug?: string | null): CustomerFundraisingState {
  const key = resolveSlug(slug);
  const cached = buckets.get(key);
  if (cached) return cached;
  const initial = clone(readPersisted(key) ?? emptyState());
  buckets.set(key, initial);
  return initial;
}

function writeState(slug: string | null | undefined, next: CustomerFundraisingState) {
  const key = resolveSlug(slug);
  const cloned = clone(next);
  buckets.set(key, cloned);
  persist(key, cloned);
  for (const listener of listeners) listener();
}

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function subscribeCustomerFundraising(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getCustomerFundraisingSnapshot(slug?: string | null) {
  return clone(getState(slug));
}

export function upsertCustomerFundraisingInvestor(
  input: Omit<CustomerFundraisingInvestor, "id" | "currency"> & { id?: string; currency?: string },
  slug?: string | null,
) {
  const state = getState(slug);
  const id = input.id ?? uid("inv");
  const row: CustomerFundraisingInvestor = {
    id,
    name: input.name,
    type: input.type,
    stage: input.stage,
    amount: input.amount,
      currency: input.currency ?? defaultCurrency(slug),
    notes: input.notes,
  };
  const investors = state.investors.some((item) => item.id === id)
    ? state.investors.map((item) => (item.id === id ? row : item))
    : [...state.investors, row];
  writeState(slug, { ...state, investors });
  return row;
}

export function deleteCustomerFundraisingInvestor(id: string, slug?: string | null) {
  const state = getState(slug);
  writeState(slug, { ...state, investors: state.investors.filter((row) => row.id !== id) });
}

export function upsertCustomerFundraisingPipelineDeal(
  input: Omit<CustomerFundraisingPipelineDeal, "id" | "currency"> & { id?: string; currency?: string },
  slug?: string | null,
) {
  const state = getState(slug);
  const id = input.id ?? uid("deal");
  const row: CustomerFundraisingPipelineDeal = {
    id,
    name: input.name,
    stage: input.stage,
    amount: input.amount,
      currency: input.currency ?? defaultCurrency(slug),
    expectedClose: input.expectedClose,
    notes: input.notes,
  };
  const pipeline = state.pipeline.some((item) => item.id === id)
    ? state.pipeline.map((item) => (item.id === id ? row : item))
    : [...state.pipeline, row];
  writeState(slug, { ...state, pipeline });
  return row;
}

export function deleteCustomerFundraisingPipelineDeal(id: string, slug?: string | null) {
  const state = getState(slug);
  writeState(slug, { ...state, pipeline: state.pipeline.filter((row) => row.id !== id) });
}

export function upsertCustomerFundraisingPitchDeck(
  input: Omit<CustomerFundraisingPitchDeck, "id"> & { id?: string },
  slug?: string | null,
) {
  const state = getState(slug);
  const id = input.id ?? uid("deck");
  const row: CustomerFundraisingPitchDeck = {
    id,
    title: input.title,
    version: input.version,
    url: input.url,
    notes: input.notes,
  };
  const pitchDecks = state.pitchDecks.some((item) => item.id === id)
    ? state.pitchDecks.map((item) => (item.id === id ? row : item))
    : [...state.pitchDecks, row];
  writeState(slug, { ...state, pitchDecks });
  return row;
}

export function deleteCustomerFundraisingPitchDeck(id: string, slug?: string | null) {
  const state = getState(slug);
  writeState(slug, { ...state, pitchDecks: state.pitchDecks.filter((row) => row.id !== id) });
}

export function upsertCustomerFundraisingDataRoom(
  input: Omit<CustomerFundraisingDataRoom, "id"> & { id?: string },
  slug?: string | null,
) {
  const state = getState(slug);
  const id = input.id ?? uid("room");
  const row: CustomerFundraisingDataRoom = {
    id,
    name: input.name,
    url: input.url,
    investor: input.investor,
    notes: input.notes,
  };
  const dataRooms = state.dataRooms.some((item) => item.id === id)
    ? state.dataRooms.map((item) => (item.id === id ? row : item))
    : [...state.dataRooms, row];
  writeState(slug, { ...state, dataRooms });
  return row;
}

export function deleteCustomerFundraisingDataRoom(id: string, slug?: string | null) {
  const state = getState(slug);
  writeState(slug, { ...state, dataRooms: state.dataRooms.filter((row) => row.id !== id) });
}

export function upsertCustomerFundraisingMeeting(
  input: Omit<CustomerFundraisingMeeting, "id"> & { id?: string },
  slug?: string | null,
) {
  const state = getState(slug);
  const id = input.id ?? uid("meet");
  const row: CustomerFundraisingMeeting = { id, ...input };
  const meetings = state.meetings.some((item) => item.id === id)
    ? state.meetings.map((item) => (item.id === id ? row : item))
    : [...state.meetings, row];
  writeState(slug, { ...state, meetings });
  return row;
}

export function deleteCustomerFundraisingMeeting(id: string, slug?: string | null) {
  const state = getState(slug);
  writeState(slug, { ...state, meetings: state.meetings.filter((row) => row.id !== id) });
}
