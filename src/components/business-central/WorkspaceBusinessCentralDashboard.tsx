"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import BusinessCentralDashboardView from "@/components/business-central/BusinessCentralDashboardView";
import { buildBusinessCentralDashboardEyebrow } from "@/lib/business-central-dashboard-variant";
import { buildWorkspaceBcDashboardSummaryFromClients } from "@/lib/business-central/workspace-dashboard-summary";
import { getAbhiBcDashboardSummary } from "@/lib/abhi/business-central-data";
import { isBrowserAbhiSurface } from "@/lib/abhi-surface";
import type { OaBcDashboardSummary } from "@/lib/onwardair/business-central-data";
import { resolveSlugReportingCurrency } from "@/lib/financial-reporting-currency";
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
  const currency = resolveSlugReportingCurrency(workspaceSlug);
  const isAbhi = isBrowserAbhiSurface();
  const [summary, setSummary] = useState<OaBcDashboardSummary>(
    isAbhi ? getAbhiBcDashboardSummary() : EMPTY_BC_DASHBOARD_SUMMARY,
  );
  const [loading, setLoading] = useState(!isAbhi);

  useEffect(() => {
    if (isAbhi) {
      setSummary(getAbhiBcDashboardSummary());
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [clientsRes, leadsRes] = await Promise.all([
          fetch("/api/clients", { cache: "no-store" }),
          fetch("/api/crm/leads", { cache: "no-store" }),
        ]);
        const clientsPayload = clientsRes.ok ? await clientsRes.json() : { clients: [] };
        const leadsPayload = leadsRes.ok ? await leadsRes.json() : { leads: [] };
        const clients = clientsPayload.clients ?? [];
        const leads = leadsPayload.leads ?? [];
        const openLeads = leads.filter(
          (lead: { status?: string }) =>
            lead.status && !["Won", "Lost", "Active Customer"].includes(String(lead.status)),
        );
        const pipelineByStageMap = new Map<string, { count: number; valueUsd: number }>();
        for (const lead of openLeads) {
          const stage = String(lead.status ?? "Cold");
          const current = pipelineByStageMap.get(stage) ?? { count: 0, valueUsd: 0 };
          current.count += 1;
          current.valueUsd += Number(lead.estimatedValue) || 0;
          pipelineByStageMap.set(stage, current);
        }
        const pipelineByStage = [...pipelineByStageMap.entries()].map(([stage, row]) => ({
          stage: stage as OaBcDashboardSummary["pipelineByStage"][number]["stage"],
          count: row.count,
          valueUsd: row.valueUsd,
        }));
        const clientBase = buildWorkspaceBcDashboardSummaryFromClients(clients);
        const next: OaBcDashboardSummary = {
          ...clientBase,
          arrUsd: openLeads.reduce(
            (sum: number, lead: { estimatedValue?: number }) =>
              sum + (Number(lead.estimatedValue) || 0),
            0,
          ),
          pipelineValueUsd: openLeads.reduce(
            (sum: number, lead: { estimatedValue?: number }) =>
              sum + (Number(lead.estimatedValue) || 0),
            0,
          ),
          pipelineByStage,
          discoveryCount: Math.min(leads.length, 12),
        };
        if (!cancelled) setSummary(next);
      } catch {
        if (!cancelled) setSummary(EMPTY_BC_DASHBOARD_SUMMARY);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAbhi]);

  const eyebrow = buildBusinessCentralDashboardEyebrow({
    variant: "workspace",
    workspaceSlug,
    workspaceName,
  });

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
      description={
        isAbhi
          ? "Member commercial snapshot across directory, pipeline, discovery, onboarding, and partners — all figures in GBP."
          : "Commercial snapshot across clients, pipeline, discovery, onboarding, partners, and grants."
      }
      summary={summary}
      grantsTile={
        isAbhi
          ? { value: "N/A", hint: "Grant programmes not used on ABHI workspace" }
          : { value: "—", hint: "No grant programmes configured" }
      }
      currency={currency}
    />
  );
}
