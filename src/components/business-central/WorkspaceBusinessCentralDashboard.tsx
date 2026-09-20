"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import BusinessCentralDashboardView from "@/components/business-central/BusinessCentralDashboardView";
import { buildBusinessCentralDashboardEyebrow } from "@/lib/business-central-dashboard-variant";
import { buildWorkspaceBcDashboardSummaryFromClients } from "@/lib/business-central/workspace-dashboard-summary";
import type { ManagedClient } from "@/lib/client-management-data";
import type { OaBcDashboardSummary } from "@/lib/onwardair/business-central-data";
import { resolveBrowserWorkspaceDisplayName } from "@/lib/workspace-brand";

const EMPTY_BC_DASHBOARD_SUMMARY: OaBcDashboardSummary = {
  clientsCount: 0,
  activeClients: 0,
  arrUsd: 0,
  pipelineValueUsd: 0,
  pipelineByStage: [],
  discoveryCount: 0,
  onboardingCount: 0,
  partnersCount: 0,
  partnerRegions: [],
  commissionPipelineUsd: 0,
};

function resolveWorkspaceSlugFromHost(): string | null {
  if (typeof window === "undefined") return null;
  const host = window.location.hostname.toLowerCase();
  const match = host.match(/^([a-z0-9-]+)\.unit311central\.com$/i);
  if (match?.[1] && !["www", "app", "login"].includes(match[1])) return match[1];
  if (host.endsWith(".localhost") && host !== "localhost") return host.split(".")[0] || null;
  return null;
}

export default function WorkspaceBusinessCentralDashboard() {
  const workspaceSlug = resolveWorkspaceSlugFromHost();
  const workspaceName = resolveBrowserWorkspaceDisplayName();
  const eyebrow = buildBusinessCentralDashboardEyebrow({
    variant: "workspace",
    workspaceSlug,
    workspaceName,
  });

  const [summary, setSummary] = useState<OaBcDashboardSummary>(EMPTY_BC_DASHBOARD_SUMMARY);
  const [loading, setLoading] = useState(true);

  const loadSummary = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/clients", { cache: "no-store" });
      const data = (await response.json()) as { clients?: ManagedClient[] };
      if (response.ok && data.clients) {
        setSummary(buildWorkspaceBcDashboardSummaryFromClients(data.clients));
      } else {
        setSummary(EMPTY_BC_DASHBOARD_SUMMARY);
      }
    } catch {
      setSummary(EMPTY_BC_DASHBOARD_SUMMARY);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-8 text-sm text-white/50">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading Business Central snapshot…
      </div>
    );
  }

  return (
    <BusinessCentralDashboardView
      eyebrow={eyebrow}
      description="Commercial snapshot across clients, pipeline, discovery, onboarding, partners, and grants."
      summary={summary}
      grantsTile={{ value: "—", hint: "No grant programmes configured" }}
    />
  );
}
