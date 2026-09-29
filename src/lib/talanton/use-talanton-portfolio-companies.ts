"use client";

import { useSyncExternalStore } from "react";

import type { PortfolioCompany } from "@/lib/talanton/portfolio-data";
import {
  getTalantonPortfolioCompaniesClientSnapshot,
  getTalantonPortfolioCompaniesServerSnapshot,
  subscribeTalantonPortfolioCompanies,
} from "@/lib/talanton/portfolio-companies-client-store";

export function useTalantonPortfolioCompanies(): {
  companies: PortfolioCompany[];
  status: "idle" | "loading" | "ready" | "error";
  error: string | null;
} {
  const snap = useSyncExternalStore(
    subscribeTalantonPortfolioCompanies,
    getTalantonPortfolioCompaniesClientSnapshot,
    getTalantonPortfolioCompaniesServerSnapshot,
  );
  return { companies: snap.companies, status: snap.status, error: snap.error };
}
