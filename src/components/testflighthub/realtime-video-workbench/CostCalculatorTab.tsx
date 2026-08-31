"use client";

import { useMemo, useState } from "react";

import type { PeriodCost, WorkbenchModel } from "@/lib/realtime-video-pipeline/workbench-types";

import { fmtNum, fmtUsd, largeMetricTile, metricTile } from "./shared";

type CostView = "daily" | "weekly" | "monthly" | "cumulative";

function CostChart({
  costs,
  view,
  selectedMonths,
}: {
  costs: PeriodCost[];
  view: CostView;
  selectedMonths: number;
}) {
  const slice = costs.slice(0, selectedMonths);
  const max = Math.max(
    ...slice.map((c) => c.systemTotalUsd ?? 0),
    ...slice.map((c) => c.wolfTotalUsd ?? 0),
    1,
  );
  const w = 720;
  const h = 220;
  const pad = 32;

  function y(value: number | null) {
    if (value == null) return h - pad;
    return h - pad - ((value / max) * (h - pad * 2));
  }

  function pathFor(key: "wolfTotalUsd" | "safariTotalUsd" | "systemTotalUsd") {
    if (slice.length === 0) return "";
    const step = (w - pad * 2) / Math.max(slice.length - 1, 1);
    return slice
      .map((row, i) => {
        const raw = row[key];
        const val =
          view === "cumulative"
            ? raw
            : view === "monthly"
              ? row.monthlyCostUsd && key === "wolfTotalUsd"
                ? row.monthlyCostUsd
                : key === "safariTotalUsd"
                  ? (row.safariTotalUsd ?? 0) / row.months
                  : (row.systemTotalUsd ?? 0) / row.months
              : view === "weekly"
                ? (raw ?? 0) / (row.months * 4.33)
                : (raw ?? 0) / (row.months * 30);
        const x = pad + i * step;
        return `${i === 0 ? "M" : "L"}${x},${y(val)}`;
      })
      .join(" ");
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-white/10 bg-black/20 p-4">
      <svg viewBox={`0 0 ${w} ${h}`} className="min-w-[720px] w-full" role="img">
        <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke="rgba(255,255,255,0.15)" />
        <path d={pathFor("wolfTotalUsd")} fill="none" stroke="#38bdf8" strokeWidth="2" />
        <path d={pathFor("safariTotalUsd")} fill="none" stroke="#fbbf24" strokeWidth="2" />
        <path d={pathFor("systemTotalUsd")} fill="none" stroke="#a78bfa" strokeWidth="2.5" />
        {slice.map((row, i) => {
          const step = (w - pad * 2) / Math.max(slice.length - 1, 1);
          const x = pad + i * step;
          return (
            <text
              key={row.months}
              x={x}
              y={h - 8}
              fill="rgba(255,255,255,0.35)"
              fontSize="10"
              textAnchor="middle"
            >
              M{row.months}
            </text>
          );
        })}
      </svg>
      <div className="mt-2 flex flex-wrap gap-4 text-xs text-white/55">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-4 rounded bg-sky-400" /> WOLF
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-4 rounded bg-amber-400" /> Safari
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-4 rounded bg-violet-400" /> Total
        </span>
        <span className="text-white/35">View: {view}</span>
      </div>
    </div>
  );
}

export function CostCalculatorTab({ model }: { model: WorkbenchModel }) {
  const [selectedMonths, setSelectedMonths] = useState(12);
  const [costView, setCostView] = useState<CostView>("cumulative");

  const selected = model.costs.find((c) => c.months === selectedMonths) ?? model.costs[0];
  const cost1 = model.costs.find((c) => c.months === 1);
  const cost24 = model.costs.find((c) => c.months === 24);

  const gpuHoursPerDay = useMemo(() => {
    const s = model.schedule;
    return s.flightHoursPerDay * s.weightedGpuIntensity * model.config.gpuConfig.gpuCount;
  }, [model]);

  const gpuHoursMonth = gpuHoursPerDay * model.config.daysPerMonth;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-amber-400/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-100/90">
        Reference assumptions — not verified BCN pricing. Safari connectivity is modelled separately
        and is <strong>not</strong> included in WOLF operating cost.
        <p className="mt-2 text-xs text-white/40">
          Edit flights, GPU, and schedule in <strong className="text-white/60">Flight Scenarios</strong> ·
          mission intensity in <strong className="text-white/60">Mission Profiles</strong> · bitrate in{" "}
          <strong className="text-white/60">Video &amp; Bandwidth</strong>. Tiles update after save.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {largeMetricTile("Cost / day (WOLF)", fmtUsd(cost1?.dailyCostUsd), "Cloud compute & GPU")}
        {largeMetricTile("Cost / week (WOLF)", fmtUsd(cost1?.weeklyCostUsd))}
        {largeMetricTile("Cost / month (WOLF)", fmtUsd(cost1?.monthlyCostUsd))}
        {largeMetricTile(
          "Cost / year (WOLF)",
          fmtUsd(cost1?.monthlyCostUsd != null ? cost1.monthlyCostUsd * 12 : null),
        )}
        {largeMetricTile("24-month total", fmtUsd(cost24?.systemTotalUsd), "WOLF + Safari system")}
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {largeMetricTile("WOLF / BCN", fmtUsd(selected?.wolfTotalUsd), `${selectedMonths}-month cumulative`)}
        {largeMetricTile("Safari", fmtUsd(selected?.safariTotalUsd), "Connectivity — not in WOLF cost")}
        {largeMetricTile("Total system", fmtUsd(selected?.systemTotalUsd))}
      </div>

      <div className="flex flex-wrap items-end gap-4 rounded-xl border border-white/10 bg-white/[0.02] p-4">
        <label className="text-sm text-white/60">
          Time period (months)
          <select
            className="mt-1 block min-w-[8rem] rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white"
            value={selectedMonths}
            onChange={(e) => setSelectedMonths(Number(e.target.value))}
          >
            {Array.from({ length: 24 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                {m} month{m === 1 ? "" : "s"}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-white/60">
          Chart view
          <select
            className="mt-1 block min-w-[10rem] rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white"
            value={costView}
            onChange={(e) => setCostView(e.target.value as CostView)}
          >
            <option value="cumulative">Cumulative</option>
            <option value="monthly">Monthly average</option>
            <option value="weekly">Weekly average</option>
            <option value="daily">Daily average</option>
          </select>
        </label>
      </div>

      <CostChart costs={model.costs} view={costView} selectedMonths={selectedMonths} />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {metricTile("Flights / day", String(model.schedule.flightsPerDay))}
        {metricTile("Flight hours / day", fmtNum(model.schedule.flightHoursPerDay, 1))}
        {metricTile("Cost / flight", fmtUsd(selected?.costPerFlightUsd))}
        {metricTile("Cost / flight hour", fmtUsd(selected?.costPerFlightHourUsd))}
        {metricTile("GPU hours / day", fmtNum(gpuHoursPerDay, 2), "Reference assumption")}
        {metricTile("GPU hours / month", fmtNum(gpuHoursMonth, 1))}
        {metricTile("GPU model", model.config.gpuConfig.model)}
        {metricTile("GPU $/hour", fmtUsd(model.config.gpuConfig.hourlyPriceUsd), "Reference assumption")}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-white/10 p-4">
          <h3 className="text-sm font-semibold text-white">WOLF / BCN cost breakdown</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {model.config.costLineItems
              .filter((l) => l.category === "wolf")
              .map((line) => (
                <li key={line.id} className="flex justify-between gap-3 text-white/70">
                  <span>{line.label}</span>
                  <span className="font-mono text-right">
                    {line.unitCostUsd != null
                      ? `${fmtUsd(line.unitCostUsd)}/${line.unit}`
                      : "TBD"}
                    <span className="ml-2 text-[10px] text-amber-200/70">{line.status}</span>
                  </span>
                </li>
              ))}
          </ul>
        </div>
        <div className="rounded-xl border border-white/10 p-4">
          <h3 className="text-sm font-semibold text-white">Safari cost breakdown</h3>
          <p className="mt-1 text-xs text-white/45">Paid by Safari — excluded from WOLF totals above.</p>
          <ul className="mt-3 space-y-2 text-sm">
            {model.config.costLineItems
              .filter((l) => l.category === "safari")
              .map((line) => (
                <li key={line.id} className="flex justify-between gap-3 text-white/70">
                  <span>{line.label}</span>
                  <span className="font-mono text-right">
                    {line.unitCostUsd != null
                      ? `${fmtUsd(line.unitCostUsd)}/${line.unit}`
                      : "TBD"}
                  </span>
                </li>
              ))}
          </ul>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="min-w-[960px] w-full text-left text-sm">
          <thead className="bg-white/[0.04] text-xs uppercase tracking-wide text-white/45">
            <tr>
              <th className="px-3 py-2">Months</th>
              <th className="px-3 py-2 text-right">WOLF cumulative</th>
              <th className="px-3 py-2 text-right">Safari cumulative</th>
              <th className="px-3 py-2 text-right">System cumulative</th>
              <th className="px-3 py-2 text-right">WOLF / day</th>
              <th className="px-3 py-2 text-right">WOLF / month</th>
              <th className="px-3 py-2 text-right">Per flight hr</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/8">
            {model.costs.map((row) => (
              <tr
                key={row.months}
                className={row.months === selectedMonths ? "bg-sky-500/10" : "hover:bg-white/[0.02]"}
              >
                <td className="px-3 py-2 font-mono">{row.months}</td>
                <td className="px-3 py-2 text-right font-mono">{fmtUsd(row.wolfTotalUsd)}</td>
                <td className="px-3 py-2 text-right font-mono">{fmtUsd(row.safariTotalUsd)}</td>
                <td className="px-3 py-2 text-right font-mono">{fmtUsd(row.systemTotalUsd)}</td>
                <td className="px-3 py-2 text-right font-mono">{fmtUsd(row.dailyCostUsd)}</td>
                <td className="px-3 py-2 text-right font-mono">{fmtUsd(row.monthlyCostUsd)}</td>
                <td className="px-3 py-2 text-right font-mono">{fmtUsd(row.costPerFlightHourUsd)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
