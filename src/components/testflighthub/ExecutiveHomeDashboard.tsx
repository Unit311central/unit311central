"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { WorkspaceDashboard } from "@/components/dashboard-framework";
import type { FinancialOverviewSnapshot } from "@/lib/accounting/types";
import type { ManagedClient } from "@/lib/client-management-data";
import {
  executiveHomeDashboardConfig,
  withExecutiveHomeLiveData,
} from "@/lib/executive-home-dashboard";
import type { InternalProject } from "@/lib/projects-data";

type HomeKpiBundle = {
  projects: InternalProject[];
  clients: ManagedClient[];
  financials: FinancialOverviewSnapshot | null;
};

/** Flagship Home experience — Executive Operating Centre with live KPI SSOT. */
export default function ExecutiveHomeDashboard() {
  const [bundle, setBundle] = useState<HomeKpiBundle | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/internal/command-centre", { cache: "no-store" });
      if (!response.ok) throw new Error("command-centre fetch failed");
      const data = (await response.json()) as Partial<HomeKpiBundle>;
      setBundle({
        projects: data.projects ?? [],
        clients: data.clients ?? [],
        financials: data.financials ?? null,
      });
    } catch {
      setBundle({ projects: [], clients: [], financials: null });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const config = useMemo(() => {
    if (!bundle) return executiveHomeDashboardConfig;
    return withExecutiveHomeLiveData(executiveHomeDashboardConfig, bundle);
  }, [bundle]);

  return (
    <WorkspaceDashboard
      config={config}
      audience={{ workspaceId: "home", role: "ceo" }}
      loading={loading && !bundle}
    />
  );
}
