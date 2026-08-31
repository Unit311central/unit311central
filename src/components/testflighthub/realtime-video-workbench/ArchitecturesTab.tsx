"use client";

import { useEffect, useState } from "react";

import { getWorkbenchApi } from "@/lib/realtime-video-pipeline/client-api";
import { compareWorkbenchModels } from "@/lib/realtime-video-pipeline/workbench-engine";
import type { ArchitectureView, WorkbenchModel } from "@/lib/realtime-video-pipeline/workbench-types";
import { cn } from "@/lib/utils";

import { fmtUsd } from "./shared";

function ArchitectureDiagram({ view }: { view: ArchitectureView }) {
  const [pulse, setPulse] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setPulse((p) => (p + 1) % 100), 60);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="overflow-x-auto rounded-xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-6">
      <h3 className="mb-4 text-sm font-semibold text-white">{view.title}</h3>
      <div className="flex min-w-[640px] flex-col items-center gap-0">
        {view.nodes.map((node, index) => (
          <div key={node.id} className="flex w-full max-w-md flex-col items-center">
            <div
              className={cn(
                "relative w-full rounded-lg border px-4 py-3 text-center transition-colors",
                node.enabled
                  ? "border-sky-400/25 bg-sky-500/10"
                  : "border-white/10 bg-white/[0.02] opacity-40",
              )}
            >
              <p className="text-sm font-medium text-white">{node.label}</p>
              {node.valueLabel ? (
                <p className="mt-1 font-mono text-xs text-sky-200/80">{node.valueLabel}</p>
              ) : null}
              <p className="mt-0.5 text-[10px] uppercase tracking-wide text-white/35">
                {node.section}
              </p>
            </div>
            {index < view.nodes.length - 1 ? (
              <div className="relative flex h-10 w-px flex-col items-center justify-center bg-white/15">
                <div
                  className="absolute h-2 w-2 rounded-full bg-sky-400/80 shadow-[0_0_8px_rgba(56,189,248,0.8)]"
                  style={{
                    top: `${pulse % 100}%`,
                    transform: "translateY(-50%)",
                    transition: "top 0.06s linear",
                  }}
                />
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ArchitecturesTab({ model }: { model: WorkbenchModel }) {
  const [activeView, setActiveView] = useState(model.architectureViews[0]?.id ?? "executive");

  const view = model.architectureViews.find((v) => v.id === activeView) ?? model.architectureViews[0];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {model.architectureViews.map((v) => (
          <button
            key={v.id}
            type="button"
            className={cn(
              "rounded-full border px-3 py-1 text-xs",
              activeView === v.id
                ? "border-sky-400/40 bg-sky-500/15 text-sky-100"
                : "border-white/10 bg-white/5 text-white/60 hover:text-white",
            )}
            onClick={() => setActiveView(v.id)}
          >
            {v.title}
          </button>
        ))}
      </div>
      {view ? <ArchitectureDiagram view={view} /> : null}
      {activeView === "failure-resilience" && view && view.nodes.length === 0 ? (
        <p className="text-sm text-white/45">
          Add failure impact / fallback fields on pipeline stages to populate this resilience view.
          Unknown technologies remain TBD — not invented here.
        </p>
      ) : null}
      <p className="text-xs text-white/40">
        Values are derived from the master pipeline and flight scenario model — not hard-coded in the
        diagram.
      </p>
    </div>
  );
}

const ARCHITECTURE_OPTIONS = [
  {
    id: "cloud",
    title: "Option A — Cloud processing",
    path: "Drone → Internet → Cloud → AI → WOLF",
  },
  {
    id: "edge_cloud",
    title: "Option B — Edge + Cloud AI",
    path: "Drone → Edge → Internet → Cloud AI → WOLF",
  },
  {
    id: "on_site",
    title: "Option C — On-site processing",
    path: "Drone → Local compute → AI → WOLF",
  },
] as const;

export function CompareTab({
  model,
  scenarios,
  compareId,
  onCompareIdChange,
}: {
  model: WorkbenchModel;
  scenarios: { id: string; name: string }[];
  compareId: string | null;
  onCompareIdChange: (id: string) => void;
}) {
  const [compareModel, setCompareModel] = useState<WorkbenchModel | null>(null);
  const [loadingCompare, setLoadingCompare] = useState(false);

  useEffect(() => {
    if (!compareId) {
      setCompareModel(null);
      return;
    }
    let cancelled = false;
    setLoadingCompare(true);
    void getWorkbenchApi(compareId)
      .then(({ model: loaded }) => {
        if (!cancelled) setCompareModel(loaded);
      })
      .finally(() => {
        if (!cancelled) setLoadingCompare(false);
      });
    return () => {
      cancelled = true;
    };
  }, [compareId]);

  const comparison =
    compareModel != null ? compareWorkbenchModels(model, compareModel) : null;

  const cost12A = model.costs.find((c) => c.months === 12);
  const cost24A = model.costs.find((c) => c.months === 24);
  const cost12B = compareModel?.costs.find((c) => c.months === 12);
  const cost24B = compareModel?.costs.find((c) => c.months === 24);

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-white/10 p-4">
        <h3 className="text-sm font-semibold text-white">Architecture comparison</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {ARCHITECTURE_OPTIONS.map((opt) => (
            <div
              key={opt.id}
              className={cn(
                "rounded-lg border p-3",
                model.config.architectureMode === opt.id
                  ? "border-sky-400/30 bg-sky-500/10"
                  : "border-white/10 bg-white/[0.02]",
              )}
            >
              <p className="text-sm font-medium text-white">{opt.title}</p>
              <p className="mt-1 font-mono text-xs text-white/50">{opt.path}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-white/40">
          Select architecture mode in Flight Scenarios to compare cost and latency impacts. No forced
          conclusion — objective comparison for BCN/WOLF decision-making.
        </p>
      </div>

      <div className="rounded-xl border border-white/10 p-4">
        <h3 className="text-sm font-semibold text-white">Scenario comparison</h3>
        <label className="mt-3 block text-sm text-white/50">
          Compare with
          <select
            className="mt-1 w-full max-w-md rounded-lg border border-white/10 bg-black/30 px-3 py-2"
            value={compareId ?? ""}
            onChange={(e) => onCompareIdChange(e.target.value)}
          >
            <option value="">Select scenario…</option>
            {scenarios
              .filter((s) => s.id !== model.flightScenario.id)
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
          </select>
        </label>
        <p className="mt-2 text-xs text-white/40">
          Duplicate scenarios to create versioned copies (e.g. South Africa — BCN Confirmed) without
          overwriting reference assumptions.
        </p>
        {loadingCompare ? (
          <p className="mt-3 text-sm text-white/45">Loading comparison scenario…</p>
        ) : null}
        {comparison ? (
          <div className="mt-4 overflow-x-auto rounded-lg border border-white/8">
            <table className="min-w-[720px] w-full text-left text-sm">
              <thead className="bg-white/[0.03] text-xs uppercase text-white/40">
                <tr>
                  <th className="px-3 py-2">Metric</th>
                  <th className="px-3 py-2">{comparison.scenarioA.name}</th>
                  <th className="px-3 py-2">{comparison.scenarioB.name}</th>
                  <th className="px-3 py-2">Delta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/8">
                {comparison.deltas.map((row) => (
                  <tr key={row.label}>
                    <td className="px-3 py-2 text-white/70">{row.label}</td>
                    <td className="px-3 py-2 font-mono">{row.valueA}</td>
                    <td className="px-3 py-2 font-mono">{row.valueB}</td>
                    <td className="px-3 py-2 font-mono text-sky-200/90">{row.delta}</td>
                  </tr>
                ))}
                <tr>
                  <td className="px-3 py-2 text-white/70">12-month WOLF cost</td>
                  <td className="px-3 py-2 font-mono">{fmtUsd(cost12A?.wolfTotalUsd)}</td>
                  <td className="px-3 py-2 font-mono">{fmtUsd(cost12B?.wolfTotalUsd)}</td>
                  <td className="px-3 py-2 font-mono text-sky-200/90">—</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 text-white/70">24-month WOLF cost</td>
                  <td className="px-3 py-2 font-mono">{fmtUsd(cost24A?.wolfTotalUsd)}</td>
                  <td className="px-3 py-2 font-mono">{fmtUsd(cost24B?.wolfTotalUsd)}</td>
                  <td className="px-3 py-2 font-mono text-sky-200/90">—</td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </div>
  );
}
