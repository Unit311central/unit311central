"use client";

import type { PortfolioCompany } from "@/lib/talanton/portfolio-data";
import { TALANTON_PORTFOLIO_COMPANIES } from "@/lib/talanton/portfolio-data";
import { setTalantonPortfolioCompaniesClientSnapshot } from "@/lib/talanton/portfolio-companies-runtime";

type Listener = () => void;

type Snapshot = {
  companies: PortfolioCompany[];
  status: "idle" | "loading" | "ready" | "error";
  error: string | null;
};

let snapshot: Snapshot = {
  companies: TALANTON_PORTFOLIO_COMPANIES,
  status: "idle",
  error: null,
};

const listeners = new Set<Listener>();
let loadPromise: Promise<void> | null = null;

function emit() {
  setTalantonPortfolioCompaniesClientSnapshot(snapshot.companies);
  for (const listener of listeners) listener();
}

function setSnapshot(next: Snapshot) {
  const unchanged =
    snapshot.status === next.status &&
    snapshot.error === next.error &&
    snapshot.companies === next.companies;
  if (unchanged) return;
  snapshot = next;
  emit();
}

async function runLoad(): Promise<void> {
  setSnapshot({ ...snapshot, status: "loading", error: null });
  try {
    const res = await fetch("/api/portfolio-companies", { credentials: "include" });
    const data = (await res.json()) as { companies?: PortfolioCompany[]; error?: string };
    if (!res.ok) throw new Error(data.error || "Failed to load portfolio companies.");
    const companies = data.companies?.length ? data.companies : TALANTON_PORTFOLIO_COMPANIES;
    setSnapshot({ companies, status: "ready", error: null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load portfolio companies.";
    setSnapshot({
      companies: TALANTON_PORTFOLIO_COMPANIES,
      status: "error",
      error: message,
    });
  }
}

export function refreshTalantonPortfolioCompanies(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (loadPromise) return loadPromise;
  loadPromise = runLoad().finally(() => {
    loadPromise = null;
  });
  return loadPromise;
}

export function subscribeTalantonPortfolioCompanies(listener: Listener): () => void {
  listeners.add(listener);
  void refreshTalantonPortfolioCompanies();
  return () => listeners.delete(listener);
}

export function getTalantonPortfolioCompaniesClientSnapshot(): Snapshot {
  return snapshot;
}

export function getTalantonPortfolioCompaniesServerSnapshot(): Snapshot {
  return {
    companies: TALANTON_PORTFOLIO_COMPANIES,
    status: "idle",
    error: null,
  };
}
