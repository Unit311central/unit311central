"use client";

import { useEffect, useState } from "react";

import { getWorkbenchApi } from "@/lib/realtime-video-pipeline/client-api";
import { compareWorkbenchModels } from "@/lib/realtime-video-pipeline/workbench-engine";
import type { WorkbenchModel } from "@/lib/realtime-video-pipeline/workbench-types";
import { cn } from "@/lib/utils";

import { fmtUsd } from "./shared";

const ARCHITECTURE_OPTIONS = [
  {
    id: "cloud",
    title: "Cloud processing",
    path: "Oryx → Internet → Cloud → AI → WOLF",
  },
  {
    id: "edge_cloud",
    title: "Edge + Cloud AI",
    path: "Oryx → Edge → Internet → Cloud AI → WOLF",
  },
  {
    id: "on_site",
    title: "On-site processing",
    path: "Oryx → Local compute → AI → WOLF",
  },
] as const;

export function ArchitectureOptionsTab({
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

  useEffect(() => {
    if (!compareId) {
      setCompareModel(null);
      return;
    }
    let cancelled = false;
    void getWorkbenchApi(compareId).then(({ model: loaded }) => {
      if (!cancelled) setCompareModel(loaded);
    });
    return () => {
      cancelled = true;
    };
  }, [compareId]);

  const comparison =
    compareModel != null ? compareWorkbenchModels(model, compareModel) : null;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-white">Processing architecture options</h3>
        <p className="mt-1 text-xs text-white/45">
          Objective comparison for BCN decision-making — no forced conclusion. Edit mode in Flight
          Scenarios.
        </p>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {ARCHITECTURE_OPTIONS.map((opt) => (
            <div
              key={opt.id}
              className={cn(
                "rounded-lg border p-4",
                model.config.architectureMode === opt.id
                  ? "border-sky-400/40 bg-sky-500/10"
                  : "border-white/10 bg-white/[0.02]",
              )}
            >
              <p className="font-medium text-white">{opt.title}</p>
              <p className="mt-2 font-mono text-xs text-white/50">{opt.path}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-white/10 p-4">
        <h3 className="text-sm font-semibold text-white">Scenario comparison</h3>
        <p className="mt-1 text-xs text-white/45">
          Duplicate scenarios (e.g. BCN Reference vs High Bitrate) then compare economics here.
        </p>
        <select
          className="mt-3 w-full max-w-md rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
          value={compareId ?? ""}
          onChange={(e) => onCompareIdChange(e.target.value)}
        >
          <option value="">Select scenario to compare…</option>
          {scenarios
            .filter((s) => s.id !== model.flightScenario.id)
            .map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
        </select>
        {comparison ? (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-[640px] w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-white/40">
                  <th className="py-2">Metric</th>
                  <th className="py-2">{comparison.scenarioA.name}</th>
                  <th className="py-2">{comparison.scenarioB.name}</th>
                  <th className="py-2">Delta</th>
                </tr>
              </thead>
              <tbody>
                {comparison.deltas.map((row) => (
                  <tr key={row.label} className="border-t border-white/8">
                    <td className="py-2 text-white/70">{row.label}</td>
                    <td className="py-2 font-mono">{row.valueA}</td>
                    <td className="py-2 font-mono">{row.valueB}</td>
                    <td className="py-2 font-mono text-sky-200">{row.delta}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
        <div className="mt-4 grid gap-2 md:grid-cols-3 text-sm">
          {metricRow("WOLF monthly", fmtUsd(model.overview.wolfTotalMonthlyUsd))}
          {metricRow("Video TB/mo", String(model.videoData.tbPerMonth.toFixed(3)))}
          {metricRow("Upload headroom", `${model.contention.uploadHeadroomMbps.toFixed(1)} Mbps`)}
        </div>
      </div>
    </div>
  );
}

function metricRow(label: string, value: string) {
  return (
    <div className="rounded-lg border border-white/8 bg-black/20 px-3 py-2">
      <p className="text-[10px] uppercase text-white/40">{label}</p>
      <p className="font-mono text-white">{value}</p>
    </div>
  );
}
