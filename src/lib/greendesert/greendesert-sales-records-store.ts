/**
 * Editable sales forecast scenarios and saved reports for Green Desert workspace.
 */

import { GREENDESERT_SLUG } from "@/lib/greendesert-surface";
import { readBrowserCustomerWorkspaceSlug } from "@/lib/customer-workspace-surface";

export type GreenDesertSalesForecastEntry = {
  id: string;
  label: string;
  periodStart: string;
  periodEnd: string;
  amount: number;
  currency: string;
  notes: string;
};

export type GreenDesertSalesReportEntry = {
  id: string;
  title: string;
  description: string;
  reportType: string;
  notes: string;
  updatedAt: string;
};

export type GreenDesertSalesRecordsState = {
  forecasts: GreenDesertSalesForecastEntry[];
  reports: GreenDesertSalesReportEntry[];
};

type Listener = () => void;

const STORAGE_VERSION = "v1";
const buckets = new Map<string, GreenDesertSalesRecordsState>();
const listeners = new Set<Listener>();

function storageKey(slug: string) {
  return `unit311-greendesert-sales-records-${STORAGE_VERSION}:${slug}`;
}

function emptyState(): GreenDesertSalesRecordsState {
  return { forecasts: [], reports: [] };
}

function clone(state: GreenDesertSalesRecordsState): GreenDesertSalesRecordsState {
  return {
    forecasts: state.forecasts.map((row) => ({ ...row })),
    reports: state.reports.map((row) => ({ ...row })),
  };
}

function resolveSlug(slug?: string | null) {
  const resolved = slug?.trim() || readBrowserCustomerWorkspaceSlug() || GREENDESERT_SLUG;
  return resolved.toLowerCase() === GREENDESERT_SLUG ? GREENDESERT_SLUG : resolved;
}

function readPersisted(slug: string): GreenDesertSalesRecordsState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(storageKey(slug));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GreenDesertSalesRecordsState;
    if (!Array.isArray(parsed.forecasts) || !Array.isArray(parsed.reports)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function persist(slug: string, state: GreenDesertSalesRecordsState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey(slug), JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

function getState(slug?: string | null): GreenDesertSalesRecordsState {
  const key = resolveSlug(slug);
  const cached = buckets.get(key);
  if (cached) return cached;
  const initial = clone(readPersisted(key) ?? emptyState());
  buckets.set(key, initial);
  return initial;
}

function writeState(slug: string | null | undefined, next: GreenDesertSalesRecordsState) {
  const key = resolveSlug(slug);
  const cloned = clone(next);
  buckets.set(key, cloned);
  persist(key, cloned);
  for (const listener of listeners) listener();
}

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function subscribeGreenDesertSalesRecords(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getGreenDesertSalesRecordsSnapshot(slug?: string | null) {
  return clone(getState(slug));
}

export function upsertGreenDesertSalesForecast(
  input: Omit<GreenDesertSalesForecastEntry, "id"> & { id?: string },
  slug?: string | null,
) {
  const state = getState(slug);
  const id = input.id ?? uid("gd-forecast");
  const row: GreenDesertSalesForecastEntry = { id, ...input };
  const forecasts = state.forecasts.some((item) => item.id === id)
    ? state.forecasts.map((item) => (item.id === id ? row : item))
    : [...state.forecasts, row];
  writeState(slug, { ...state, forecasts });
  return row;
}

export function deleteGreenDesertSalesForecast(id: string, slug?: string | null) {
  const state = getState(slug);
  writeState(slug, { ...state, forecasts: state.forecasts.filter((row) => row.id !== id) });
}

export function upsertGreenDesertSalesReport(
  input: Omit<GreenDesertSalesReportEntry, "id" | "updatedAt"> & { id?: string; updatedAt?: string },
  slug?: string | null,
) {
  const state = getState(slug);
  const id = input.id ?? uid("gd-report");
  const row: GreenDesertSalesReportEntry = {
    id,
    title: input.title,
    description: input.description,
    reportType: input.reportType,
    notes: input.notes,
    updatedAt: input.updatedAt ?? new Date().toISOString(),
  };
  const reports = state.reports.some((item) => item.id === id)
    ? state.reports.map((item) => (item.id === id ? row : item))
    : [...state.reports, row];
  writeState(slug, { ...state, reports });
  return row;
}

export function deleteGreenDesertSalesReport(id: string, slug?: string | null) {
  const state = getState(slug);
  writeState(slug, { ...state, reports: state.reports.filter((row) => row.id !== id) });
}
