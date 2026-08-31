/**
 * Workspace-owned finance planning records for generic customer tenants.
 */

import { readBrowserCustomerWorkspaceSlug } from "@/lib/customer-workspace-surface";
import { resolveSlugReportingCurrency } from "@/lib/financial-reporting-currency";

export type CustomerFinanceKpi = {
  id: string;
  label: string;
  value: number;
  currency: string;
  notes: string;
};

export type CustomerFinanceBudgetTarget = {
  id: string;
  month: string;
  amount: number;
  currency: string;
  notes: string;
};

export type CustomerFinanceForecastTarget = {
  id: string;
  label: string;
  monthlyBurn: number;
  currency: string;
  notes: string;
};

export type CustomerFinancePlanningState = {
  kpis: CustomerFinanceKpi[];
  budgetTargets: CustomerFinanceBudgetTarget[];
  forecastTargets: CustomerFinanceForecastTarget[];
};

type Listener = () => void;

const STORAGE_VERSION = "v1";
const buckets = new Map<string, CustomerFinancePlanningState>();
const listeners = new Set<Listener>();

function storageKey(slug: string) {
  return `unit311-customer-finance-planning-${STORAGE_VERSION}:${slug}`;
}

function emptyState(): CustomerFinancePlanningState {
  return { kpis: [], budgetTargets: [], forecastTargets: [] };
}

function clone(state: CustomerFinancePlanningState): CustomerFinancePlanningState {
  return {
    kpis: state.kpis.map((row) => ({ ...row })),
    budgetTargets: state.budgetTargets.map((row) => ({ ...row })),
    forecastTargets: state.forecastTargets.map((row) => ({ ...row })),
  };
}

function resolveSlug(slug?: string | null) {
  return slug?.trim() || readBrowserCustomerWorkspaceSlug() || "default";
}

function defaultCurrency(slug?: string | null) {
  return resolveSlugReportingCurrency(slug ?? readBrowserCustomerWorkspaceSlug() ?? undefined);
}

function readPersisted(slug: string): CustomerFinancePlanningState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(storageKey(slug));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CustomerFinancePlanningState;
    if (
      !Array.isArray(parsed.kpis) ||
      !Array.isArray(parsed.budgetTargets) ||
      !Array.isArray(parsed.forecastTargets)
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function persist(slug: string, state: CustomerFinancePlanningState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey(slug), JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

function getState(slug?: string | null): CustomerFinancePlanningState {
  const key = resolveSlug(slug);
  const cached = buckets.get(key);
  if (cached) return cached;
  const initial = clone(readPersisted(key) ?? emptyState());
  buckets.set(key, initial);
  return initial;
}

function writeState(slug: string | null | undefined, next: CustomerFinancePlanningState) {
  const key = resolveSlug(slug);
  const cloned = clone(next);
  buckets.set(key, cloned);
  persist(key, cloned);
  for (const listener of listeners) listener();
}

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function subscribeCustomerFinancePlanning(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getCustomerFinancePlanningSnapshot(slug?: string | null) {
  return clone(getState(slug));
}

export function upsertCustomerFinanceKpi(
  input: Omit<CustomerFinanceKpi, "id" | "currency"> & { id?: string; currency?: string },
  slug?: string | null,
) {
  const state = getState(slug);
  const currency = input.currency ?? defaultCurrency(slug);
  const row: CustomerFinanceKpi = {
    id: input.id ?? uid("kpi"),
    label: input.label.trim(),
    value: Number(input.value) || 0,
    currency,
    notes: input.notes ?? "",
  };
  const next = state.kpis.some((item) => item.id === row.id)
    ? state.kpis.map((item) => (item.id === row.id ? row : item))
    : [row, ...state.kpis];
  writeState(slug, { ...state, kpis: next });
  return row;
}

export function deleteCustomerFinanceKpi(id: string, slug?: string | null) {
  const state = getState(slug);
  writeState(slug, { ...state, kpis: state.kpis.filter((row) => row.id !== id) });
}

export function upsertCustomerFinanceBudgetTarget(
  input: Omit<CustomerFinanceBudgetTarget, "id" | "currency"> & { id?: string; currency?: string },
  slug?: string | null,
) {
  const state = getState(slug);
  const currency = input.currency ?? defaultCurrency(slug);
  const row: CustomerFinanceBudgetTarget = {
    id: input.id ?? uid("budget"),
    month: input.month.trim(),
    amount: Number(input.amount) || 0,
    currency,
    notes: input.notes ?? "",
  };
  const next = state.budgetTargets.some((item) => item.id === row.id)
    ? state.budgetTargets.map((item) => (item.id === row.id ? row : item))
    : [row, ...state.budgetTargets];
  writeState(slug, { ...state, budgetTargets: next });
  return row;
}

export function deleteCustomerFinanceBudgetTarget(id: string, slug?: string | null) {
  const state = getState(slug);
  writeState(slug, {
    ...state,
    budgetTargets: state.budgetTargets.filter((row) => row.id !== id),
  });
}

export function upsertCustomerFinanceForecastTarget(
  input: Omit<CustomerFinanceForecastTarget, "id" | "currency"> & { id?: string; currency?: string },
  slug?: string | null,
) {
  const state = getState(slug);
  const currency = input.currency ?? defaultCurrency(slug);
  const row: CustomerFinanceForecastTarget = {
    id: input.id ?? uid("forecast"),
    label: input.label.trim(),
    monthlyBurn: Number(input.monthlyBurn) || 0,
    currency,
    notes: input.notes ?? "",
  };
  const next = state.forecastTargets.some((item) => item.id === row.id)
    ? state.forecastTargets.map((item) => (item.id === row.id ? row : item))
    : [row, ...state.forecastTargets];
  writeState(slug, { ...state, forecastTargets: next });
  return row;
}

export function deleteCustomerFinanceForecastTarget(id: string, slug?: string | null) {
  const state = getState(slug);
  writeState(slug, {
    ...state,
    forecastTargets: state.forecastTargets.filter((row) => row.id !== id),
  });
}
