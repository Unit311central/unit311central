"use client";

import {
  AlertTriangle,
  Brain,
  ChevronRight,
  LayoutDashboard,
  Loader2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import type {
  IntelligenceBriefing,
  IntelligenceDomainDefinition,
  IntelligenceScoreBand,
} from "@/lib/intelligence/types";
import { resolveIntelligenceNavLabel } from "@/lib/intelligence/intelligence-nav-labels";
import { resolveIntelligenceWorkspaceSlugFromBrowser } from "@/lib/intelligence/workspace-context";
import { cn } from "@/lib/utils";

type IntelligenceUiView = {
  viewId: string;
  domainId: string;
  label?: string;
};

type AreaCard = {
  domainId: string;
  label: string;
  viewId: string;
  description?: string;
  briefing: IntelligenceBriefing | null;
  recordCount: number | null;
};

const LEGACY_AREA_VIEWS: Record<string, string> = {
  "company-intelligence": "demo-company-intelligence",
  "client-intelligence": "demo-client-intelligence",
  member: "member-intelligence",
  "market-intelligence": "demo-market-intelligence",
  regulatory: "regulatory-dashboard",
  impact: "impact-intelligence-dashboard",
};

const POSTURE_STYLES: Record<IntelligenceScoreBand, string> = {
  excellent: "border-emerald-400/35 bg-emerald-500/12 text-emerald-100",
  healthy: "border-emerald-400/30 bg-emerald-500/10 text-emerald-100",
  watch: "border-amber-400/35 bg-amber-500/12 text-amber-100",
  elevated: "border-orange-400/35 bg-orange-500/12 text-orange-100",
  critical: "border-rose-400/40 bg-rose-500/15 text-rose-100",
};

function resolveViewIdForDomain(
  domain: IntelligenceDomainDefinition,
  uiViews: IntelligenceUiView[],
): string | null {
  for (const navView of domain.navViews ?? []) {
    if (navView === "intelligence-dashboard") continue;
    const match = uiViews.find((v) => v.viewId === navView && v.domainId === domain.id);
    if (match) return match.viewId;
  }
  const primary = uiViews.find(
    (v) => v.domainId === domain.id && v.viewId !== "intelligence-dashboard",
  );
  if (primary) return primary.viewId;
  return LEGACY_AREA_VIEWS[domain.id] ?? null;
}

function briefingHighlights(briefing: IntelligenceBriefing | null): string[] {
  if (!briefing) return [];
  if (briefing.postureReason?.trim()) {
    return [briefing.postureReason.trim()];
  }
  const bullets = briefing.sections.flatMap((section) => section.bullets).filter(Boolean);
  return bullets.slice(0, 3);
}

function postureLabel(posture: IntelligenceScoreBand | undefined) {
  if (!posture) return null;
  return posture.charAt(0).toUpperCase() + posture.slice(1);
}

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
  const [uiViews, setUiViews] = useState<IntelligenceUiView[]>([]);
  const [overviewBriefing, setOverviewBriefing] = useState<IntelligenceBriefing | null>(null);
  const [areaBriefings, setAreaBriefings] = useState<Record<string, IntelligenceBriefing | null>>(
    {},
  );
  const [recordCounts, setRecordCounts] = useState<Record<string, number>>({});
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
        uiViews?: IntelligenceUiView[];
      };
      const loadedDomains = (domainsData.domains ?? []).filter((d) => d.id !== "dashboard");
      const loadedUiViews = domainsData.uiViews ?? [];
      setDomains(loadedDomains);
      setUiViews(loadedUiViews);

      const dashboardRes = await fetch("/api/intelligence/briefing?domainId=dashboard", {
        cache: "no-store",
      });
      if (dashboardRes.ok) {
        const dashboardData = (await dashboardRes.json()) as { briefing?: IntelligenceBriefing };
        setOverviewBriefing(dashboardData.briefing ?? null);
      }

      const areaResults = await Promise.all(
        loadedDomains.map(async (domain) => {
          const [briefingRes, searchRes] = await Promise.all([
            fetch(`/api/intelligence/briefing?domainId=${encodeURIComponent(domain.id)}`, {
              cache: "no-store",
            }),
            fetch(
              `/api/intelligence/search?domainId=${encodeURIComponent(domain.id)}&limit=1&offset=0`,
              { cache: "no-store" },
            ),
          ]);

          let briefing: IntelligenceBriefing | null = null;
          if (briefingRes.ok) {
            const data = (await briefingRes.json()) as { briefing?: IntelligenceBriefing };
            briefing = data.briefing ?? null;
          }

          let total: number | null = null;
          if (searchRes.ok) {
            const searchData = (await searchRes.json()) as { total?: number };
            total = typeof searchData.total === "number" ? searchData.total : null;
          }

          return { domainId: domain.id, briefing, total };
        }),
      );

      setAreaBriefings(
        Object.fromEntries(areaResults.map((row) => [row.domainId, row.briefing])),
      );
      setRecordCounts(
        Object.fromEntries(
          areaResults
            .filter((row) => row.total != null)
            .map((row) => [row.domainId, row.total as number]),
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load intelligence dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const areas: AreaCard[] = [];
  for (const domain of domains) {
    const viewId = resolveViewIdForDomain(domain, uiViews);
    if (!viewId) continue;
    areas.push({
      domainId: domain.id,
      label: domain.label,
      viewId,
      description: domain.description,
      briefing: areaBriefings[domain.id] ?? null,
      recordCount: recordCounts[domain.id] ?? null,
    });
  }

  const areaLabels = areas.map((area) => area.label).join(", ");

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
          {areaLabels
            ? `Consolidated overview across ${areaLabels} — open any tile for full briefings and records.`
            : "Overview across intelligence areas — open each area for detailed briefings and records."}
        </p>
      </header>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-white/50">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading intelligence overview…
        </div>
      ) : null}

      {error ? (
        <div className="flex items-center gap-2 rounded-lg border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      ) : null}

      {overviewBriefing ? (
        <section className="rounded-2xl border border-violet-400/20 bg-violet-500/10 p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-violet-100">
              <Brain className="h-4 w-4" />
              <h2 className="text-sm font-semibold">{overviewBriefing.headline}</h2>
            </div>
            {overviewBriefing.posture ? (
              <span
                className={cn(
                  "rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                  POSTURE_STYLES[overviewBriefing.posture] ??
                    "border-white/15 bg-white/[0.06] text-white/70",
                )}
              >
                {postureLabel(overviewBriefing.posture)}
              </span>
            ) : null}
          </div>
          {overviewBriefing.postureReason ? (
            <p className="mt-2 text-sm text-white/65">{overviewBriefing.postureReason}</p>
          ) : null}
          {overviewBriefing.sections.length > 0 ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {overviewBriefing.sections.map((section) => (
                <div
                  key={section.id}
                  className="rounded-xl border border-white/10 bg-black/20 px-3 py-3"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/45">
                    {section.title}
                  </p>
                  <ul className="mt-2 space-y-1 text-[12px] leading-relaxed text-white/70">
                    {section.bullets.slice(0, 2).map((bullet) => (
                      <li key={bullet}>• {bullet}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {areas.map((area) => {
          const highlights = briefingHighlights(area.briefing);
          const posture = area.briefing?.posture;
          return (
            <button
              key={area.domainId}
              type="button"
              onClick={() => openView(area.viewId)}
              className={cn(
                "rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left transition hover:border-violet-400/30 hover:bg-violet-500/5",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-white">{area.label}</p>
                    {posture ? (
                      <span
                        className={cn(
                          "rounded border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide",
                          POSTURE_STYLES[posture] ??
                            "border-white/15 bg-white/[0.06] text-white/65",
                        )}
                      >
                        {postureLabel(posture)}
                      </span>
                    ) : null}
                    {area.recordCount != null ? (
                      <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-white/50">
                        {area.recordCount} signal{area.recordCount === 1 ? "" : "s"}
                      </span>
                    ) : null}
                  </div>
                  {area.briefing?.headline ? (
                    <p className="mt-1 text-[12px] font-medium text-violet-100/90">
                      {area.briefing.headline}
                    </p>
                  ) : null}
                  {area.description ? (
                    <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-white/45">
                      {area.description}
                    </p>
                  ) : null}
                </div>
                <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-white/30" />
              </div>
              {highlights.length > 0 ? (
                <ul className="mt-3 space-y-1 text-[12px] leading-relaxed text-white/60">
                  {highlights.map((line) => (
                    <li key={line} className="line-clamp-2">
                      • {line}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-[12px] text-white/40">Open for detailed briefing.</p>
              )}
              {area.briefing?.recommendedActions?.[0] ? (
                <p className="mt-2 text-[11px] text-violet-200/80">
                  Next: {area.briefing.recommendedActions[0]}
                </p>
              ) : null}
            </button>
          );
        })}
      </div>

      {!loading && areas.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-white/45">
          No intelligence areas are configured for this workspace.
        </div>
      ) : null}
    </div>
  );
}
