"use client";

import type { WorkbenchModel } from "@/lib/realtime-video-pipeline/workbench-types";

import { fmtNum, fmtUsd, metricTile } from "./shared";

export function CostModelTab({ model }: { model: WorkbenchModel }) {
  const cost1 = model.costs.find((c) => c.months === 1);
  const cost12 = model.costs.find((c) => c.months === 12);
  const cost24 = model.costs.find((c) => c.months === 24);

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {metricTile("Flight hours / day", fmtNum(model.schedule.flightHoursPerDay, 1))}
        {metricTile("Flights / day", String(model.schedule.flightsPerDay))}
        {metricTile("Video / hour", `${fmtNum(model.videoData.gbPerHour)} GB`)}
        {metricTile("Video / day", `${fmtNum(model.videoData.gbPerDay)} GB`)}
        {metricTile("Video / month", `${fmtNum(model.videoData.tbPerMonth, 3)} TB`)}
        {metricTile("WOLF / day", fmtUsd(cost1?.dailyCostUsd), "Cloud compute only")}
        {metricTile("WOLF / month", fmtUsd(cost1?.monthlyCostUsd))}
        {metricTile("12-month WOLF", fmtUsd(cost12?.wolfTotalUsd))}
        {metricTile("24-month WOLF", fmtUsd(cost24?.wolfTotalUsd))}
        {metricTile("Safari / month", fmtUsd(cost1?.safariTotalUsd), "Connectivity — not in WOLF cost")}
        {metricTile("Total system / month", fmtUsd(cost1?.systemTotalUsd))}
        {metricTile("Cost / flight", fmtUsd(cost1?.costPerFlightUsd))}
        {metricTile("Cost / flight hour", fmtUsd(cost1?.costPerFlightHourUsd))}
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
                  <span className="font-mono">
                    {line.unitCostUsd != null
                      ? `${fmtUsd(line.unitCostUsd)}/${line.unit}`
                      : "TBD"}
                  </span>
                </li>
              ))}
          </ul>
        </div>
        <div className="rounded-xl border border-white/10 p-4">
          <h3 className="text-sm font-semibold text-white">Safari cost breakdown</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {model.config.costLineItems
              .filter((l) => l.category === "safari")
              .map((line) => (
                <li key={line.id} className="flex justify-between gap-3 text-white/70">
                  <span>{line.label}</span>
                  <span className="font-mono">
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
        <table className="min-w-[900px] w-full text-left text-sm">
          <thead className="bg-white/[0.04] text-xs uppercase tracking-wide text-white/45">
            <tr>
              <th className="px-3 py-2">Months</th>
              <th className="px-3 py-2 text-right">WOLF total</th>
              <th className="px-3 py-2 text-right">Safari total</th>
              <th className="px-3 py-2 text-right">System total</th>
              <th className="px-3 py-2 text-right">Daily</th>
              <th className="px-3 py-2 text-right">Monthly</th>
              <th className="px-3 py-2 text-right">Per flight hr</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/8">
            {model.costs.map((row) => (
              <tr key={row.months} className="hover:bg-white/[0.02]">
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
