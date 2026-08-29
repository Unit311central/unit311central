"use client";

import { Brain, ChevronRight, LayoutDashboard, Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import type { IntelligenceBriefing, IntelligenceDomainDefinition } from "@/lib/intelligence/types";
import { resolveIntelligenceNavLabel } from "@/lib/intelligence/intelligence-nav-labels";
import { resolveIntelligenceWorkspaceSlugFromBrowser } from "@/lib/intelligence/workspace-context";
import { cn } from "@/lib/utils";

type AreaCard = {
  domainId: string;
  label: string;
  viewId: string;
  description?: string;
  briefing: IntelligenceBriefing | null;
};

const AREA_VIEWS: Record<string, string> = {
  "company-intelligence": "demo-company-intelligence",
  "client-intelligence": "demo-client-intelligence",
  member: "member-intelligence",
  "market-intelligence": "demo-market-intelligence",
};

export default function IntelligenceDashboardWorkspace({
  workspaceSlug: workspaceSlugProp,
}: {
  workspaceSlug?: string | null;
}) {
  const router = useRouter();
  const workspaceSlug =
    workspaceSlugProp ?? resolveIntelligenceWorkspaceSlugFromBrowser() ?? "";
  const moduleLabel = useMemo(
    () => resolveIntelligenceNavLabel(workspaceSlug),
    [workspaceSlug],
  );

  const [domains, setDomains] = useState<IntelligenceDomainDefinition[]>([]);
  const [overviewBriefing, setOverviewBriefing] = useState<IntelligenceBriefing | null>(null);
  const [areaBriefings, setAreaBriefings] = useState<Record<string, IntelligenceBriefing | null>>(
    {},
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const domainsRes = await fetch("/api/intelligence/domains", { cache: "no-store" });
      if (!domainsRes.ok) throw new Error("Failed to load intelligence domains.");
      const domainsData = (await domainsRes.json()) as {
        domains?: IntelligenceDomainDefinition[];
      };
      const loadedDomains = (domainsData.domains ?? []).filter((d) => d.id !== "dashboard");
      setDomains(loadedDomains);

      const dashboardRes = await fetch("/api/intelligence/briefing?domainId=dashboard", {
        cache: "no-store",
      });
      if (dashboardRes.ok) {
        const dashboardData = (await dashboardRes.json()) as { briefing?: IntelligenceBriefing };
        setOverviewBriefing(dashboardData.briefing ?? null);
      }

      const briefingEntries = await Promise.all(
        loadedDomains.map(async (domain) => {
          const res = await fetch(
            `/api/intelligence/briefing?domainId=${encodeURIComponent(domain.id)}`,
            { cache: "no-store" },
          );
          if (!res.ok) return [domain.id, null] as const;
          const data = (await res.json()) as { briefing?: IntelligenceBriefing };
          return [domain.id, data.briefing ?? null] as const;
        }),
      );
      setAreaBriefings(Object.fromEntries(briefingEntries));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load intelligence dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const areas: AreaCard[] = domains
    .filter((domain) => AREA_VIEWS[domain.id])
    .map((domain) => ({
      domainId: domain.id,
      label: domain.label,
      viewId: AREA_VIEWS[domain.id]!,
      description: domain.description,
      briefing: areaBriefings[domain.id] ?? null,
    }));

  function openView(viewId: string) {
    const url = new URL(window.location.href);
    url.searchParams.set("view", viewId);
    router.push(`${url.pathname}?${url.searchParams.toString()}`);
  }

  if (!workspaceSlug) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 text-sm text-white/60">
        Intelligence is not configured for this workspace.
      </div>
    );
  }

  return (
    <div className="space-y-5 p-1">
      <header className="rounded-2xl border border-white/10 bg-gradient-to-br from-violet-500/10 via-white/[0.02] to-transparent p-5 sm:p-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-300/80">
          {moduleLabel}
        </p>
        <h1 className="mt-2 flex items-center gap-2 text-2xl font-semibold tracking-tight text-white">
          <LayoutDashboard className="h-6 w-6 text-violet-300" />
          Dashboard
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/60">
          Overview across Company, Client, and Market Intelligence — open each area for detailed
          briefings and records.
        </p>
      </header>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-white/50">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading intelligence overview…
        </div>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      {overviewBriefing ? (
        <section className="rounded-2xl border border-violet-400/20 bg-violet-500/10 p-4 sm:p-5">
          <div className="flex items-center gap-2 text-violet-100">
            <Brain className="h-4 w-4" />
            <h2 className="text-sm font-semibold">{overviewBriefing.headline}</h2>
          </div>
          {overviewBriefing.postureReason ? (
            <p className="mt-2 text-sm text-white/65">{overviewBriefing.postureReason}</p>
          ) : null}
          {overviewBriefing.sections[0]?.bullets?.length ? (
            <ul className="mt-3 space-y-1 text-[13px] text-white/60">
              {overviewBriefing.sections[0].bullets.map((bullet) => (
                <li key={bullet}>• {bullet}</li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        {areas.map((area) => (
          <button
            key={area.domainId}
            type="button"
            onClick={() => openView(area.viewId)}
            className={cn(
              "rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left transition hover:border-violet-400/30 hover:bg-violet-500/5",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">{area.label}</p>
                {area.description ? (
                  <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-white/50">
                    {area.description}
                  </p>
                ) : null}
              </div>
              <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-white/30" />
            </div>
            {area.briefing?.postureReason ? (
              <p className="mt-3 text-[12px] leading-relaxed text-white/55">
                {area.briefing.postureReason}
              </p>
            ) : null}
            {area.briefing?.recommendedActions?.[0] ? (
              <p className="mt-2 text-[11px] text-violet-200/80">
                Next: {area.briefing.recommendedActions[0]}
              </p>
            ) : null}
          </button>
        ))}
      </div>
    </div>
  );
}
