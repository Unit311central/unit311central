"use client";

import BusinessCentralDashboardView from "@/components/business-central/BusinessCentralDashboardView";
import { buildBusinessCentralDashboardEyebrow } from "@/lib/business-central-dashboard-variant";
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

  return (
    <BusinessCentralDashboardView
      eyebrow={eyebrow}
      description="Commercial snapshot across clients, pipeline, discovery, onboarding, partners, and grants."
      summary={EMPTY_BC_DASHBOARD_SUMMARY}
      grantsTile={{ value: "—", hint: "No grant programmes configured" }}
      currency="GBP"
    />
  );
}
