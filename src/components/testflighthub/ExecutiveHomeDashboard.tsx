"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { LayoutGrid, Plus, RotateCcw, X } from "lucide-react";

import { WorkspaceDashboard } from "@/components/dashboard-framework";
import PortfolioCompanyMap from "@/components/testflighthub/talanton/PortfolioCompanyMap";
import type { FinancialOverviewSnapshot } from "@/lib/accounting/types";
import type { ManagedClient } from "@/lib/client-management-data";
import {
  executiveHomeDashboardConfig,
  withExecutiveHomeLiveData,
} from "@/lib/executive-home-dashboard";
import {
  DEFAULT_EXECUTIVE_HOME_LAYOUT,
  EXECUTIVE_HOME_TILE_CATALOG,
  loadExecutiveHomeLayout,
  saveExecutiveHomeLayout,
  type ExecutiveHomeTileId,
} from "@/lib/executive-home-layout";
import type { InternalProject } from "@/lib/projects-data";
import { isBrowserTalantonImpactSurface } from "@/lib/talanton-surface";
import { cn } from "@/lib/utils";

type HomeKpiBundle = {
  projects: InternalProject[];
  clients: ManagedClient[];
  financials: FinancialOverviewSnapshot | null;
  onboardingPipelineCount?: number;
};

/** Flagship Home experience — Executive Operating Centre with live KPI SSOT. */
export default function ExecutiveHomeDashboard() {
  const [bundle, setBundle] = useState<HomeKpiBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [layout, setLayout] = useState<ExecutiveHomeTileId[]>([...DEFAULT_EXECUTIVE_HOME_LAYOUT]);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [layoutHydrated, setLayoutHydrated] = useState(false);
  const isTalanton = typeof window !== "undefined" ? isBrowserTalantonImpactSurface() : false;

  useEffect(() => {
    setLayout(loadExecutiveHomeLayout());
    setLayoutHydrated(true);
  }, []);

  useEffect(() => {
    if (!layoutHydrated) return;
    saveExecutiveHomeLayout(layout);
  }, [layout, layoutHydrated]);

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
        onboardingPipelineCount: data.onboardingPipelineCount ?? 0,
      });
    } catch {
      setBundle({ projects: [], clients: [], financials: null, onboardingPipelineCount: 0 });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // OnwardAir: defer weekly competitor brief until after first paint / idle.
  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;
    const run = () => {
      if (cancelled) return;
      try {
        const { isBrowserOnwardAirSurface } =
          require("@/lib/onwardair-surface") as typeof import("@/lib/onwardair-surface");
        if (!isBrowserOnwardAirSurface()) return;
        const feed =
          require("@/lib/onwardair/competitor-intelligence-feed-store") as typeof import("@/lib/onwardair/competitor-intelligence-feed-store");
        const result = feed.ensureWeeklyCompetitorIntelligenceRefresh();
        if (result.created) {
          setBundle((current) => (current ? { ...current } : current));
        }
      } catch {
        /* optional */
      }
    };
    const ric = (
      window as Window & {
        requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
        cancelIdleCallback?: (id: number) => void;
      }
    ).requestIdleCallback;
    let idleId: number | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    if (typeof ric === "function") {
      idleId = ric(run, { timeout: 4000 });
    } else {
      timeoutId = setTimeout(run, 1500);
    }
    return () => {
      cancelled = true;
      if (idleId != null) {
        (
          window as Window & { cancelIdleCallback?: (id: number) => void }
        ).cancelIdleCallback?.(idleId);
      }
      if (timeoutId != null) clearTimeout(timeoutId);
    };
  }, []);

  const config = useMemo(() => {
    const base = !bundle
      ? executiveHomeDashboardConfig
      : withExecutiveHomeLiveData(executiveHomeDashboardConfig, bundle);

    const byId = new Map(base.sections.map((section) => [section.id, section]));
    const header = byId.get("header");
    const customSections = layout
      .map((id) => byId.get(id))
      .filter((section): section is NonNullable<typeof section> => Boolean(section));

    return {
      ...base,
      sections: header ? [header, ...customSections] : customSections,
    };
  }, [bundle, layout]);

  const hiddenTiles = useMemo(
    () => EXECUTIVE_HOME_TILE_CATALOG.filter((tile) => !layout.includes(tile.id)),
    [layout],
  );

  function moveTile(id: ExecutiveHomeTileId, direction: -1 | 1) {
    setLayout((current) => {
      const index = current.indexOf(id);
      if (index < 0) return current;
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= current.length) return current;
      const next = [...current];
      const [item] = next.splice(index, 1);
      next.splice(nextIndex, 0, item);
      return next;
    });
  }

  function hideTile(id: ExecutiveHomeTileId) {
    setLayout((current) => current.filter((entry) => entry !== id));
  }

  function showTile(id: ExecutiveHomeTileId) {
    setLayout((current) => (current.includes(id) ? current : [...current, id]));
  }

  return (
    <div data-ai-target="home-tiles" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 px-0.5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
          Executive dashboard
        </p>
        <button
          type="button"
          data-ai-target="home-customize"
          onClick={() => setCustomizeOpen((open) => !open)}
          className={cn(
            "inline-flex items-center gap-2 rounded-xl border px-2.5 py-1.5 text-[11px] font-semibold transition-colors sm:px-3 sm:text-xs",
            customizeOpen
              ? "border-sky-400/40 bg-sky-500/15 text-sky-200"
              : "border-white/10 bg-white/[0.03] text-white/70 hover:border-white/20 hover:text-white",
          )}
        >
          <LayoutGrid className="h-3.5 w-3.5" />
          Customise tiles
        </button>
      </div>

      {customizeOpen ? (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <p className="mb-2 text-[11px] text-white/50">
            Show, hide, and reorder Home dashboard sections. Your layout is saved on this device.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {layout.map((id, index) => {
              const tile = EXECUTIVE_HOME_TILE_CATALOG.find((entry) => entry.id === id);
              if (!tile) return null;
              return (
                <div
                  key={id}
                  className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-[#0b1524]/80 px-2 py-1 text-[11px] text-white/80"
                >
                  <span>{tile.title}</span>
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => moveTile(id, -1)}
                    className="rounded px-1 text-white/50 hover:text-white disabled:opacity-30"
                    aria-label={`Move ${tile.title} earlier`}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    disabled={index === layout.length - 1}
                    onClick={() => moveTile(id, 1)}
                    className="rounded px-1 text-white/50 hover:text-white disabled:opacity-30"
                    aria-label={`Move ${tile.title} later`}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => hideTile(id)}
                    className="rounded p-0.5 text-rose-200/80 hover:bg-rose-500/15"
                    aria-label={`Hide ${tile.title}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
            {hiddenTiles.map((tile) => (
              <button
                key={tile.id}
                type="button"
                onClick={() => showTile(tile.id)}
                className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-200"
              >
                <Plus className="h-3 w-3" />
                {tile.title}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setLayout([...DEFAULT_EXECUTIVE_HOME_LAYOUT])}
              className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-1 text-[11px] text-white/55 hover:text-white"
            >
              <RotateCcw className="h-3 w-3" />
              Restore defaults
            </button>
          </div>
        </div>
      ) : null}

      <WorkspaceDashboard
        config={config}
        audience={{ workspaceId: "home", role: "ceo" }}
        loading={loading && !bundle}
        preserveSectionOrder
      />

      {isTalanton ? <PortfolioCompanyMap /> : null}
    </div>
  );
}
