"use client";

import { formatLatencyMs } from "@/lib/realtime-video-pipeline/calculations";
import {
  BCN_REFERENCE_CONFIG_STATUS,
  ORYX_AIRCRAFT_NAME,
} from "@/lib/realtime-video-pipeline/workbench-reference-data";
import type { WorkbenchModel } from "@/lib/realtime-video-pipeline/workbench-types";
import { WorkspaceStatusPill } from "@/components/workspace-ui/primitives";

import { contentionTone, criterionTone, fmtNum, fmtUsd, metricTile } from "./shared";

export function OverviewTab({ model }: { model: WorkbenchModel }) {
  const o = model.overview;
  const e2e =
    o.endToEndLatencyMs != null ? `${formatLatencyMs(o.endToEndLatencyMs)} ms` : "TBD";

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {metricTile(
          "AI-annotated end-to-end latency",
          e2e,
          o.completeLatencyTbd
            ? `Known minimum ${formatLatencyMs(o.knownMinimumMs)} ms · COMPLETE LATENCY: TBD`
            : undefined,
          "md:col-span-2",
        )}
        {metricTile("Aircraft", ORYX_AIRCRAFT_NAME, BCN_REFERENCE_CONFIG_STATUS)}
        {metricTile("Flight hours / day", fmtNum(o.flightHoursPerDay, 1), `${o.flightsPerDay} flights`)}
        {metricTile("Video / hour", `${fmtNum(o.videoGbPerHour)} GB`, `${fmtNum(model.videoData.mbps, 1)} Mbps effective`)}
        {metricTile("Video / month", `${fmtNum(o.videoTbPerMonth, 3)} TB`, "Calculated from schedule")}
        {metricTile("GPU", o.gpuModel, fmtUsd(o.gpuCostPerHourUsd) + "/hr")}
        {metricTile("WOLF cloud / day", fmtUsd(o.cloudCostPerDayUsd), "Excludes Safari connectivity")}
        {metricTile("WOLF cloud / month", fmtUsd(o.cloudCostPerMonthUsd))}
        {metricTile("12-month WOLF cost", fmtUsd(o.cost12MonthUsd))}
        {metricTile("24-month WOLF cost", fmtUsd(o.cost24MonthUsd))}
        {metricTile("WOLF / BCN total / mo", fmtUsd(o.wolfTotalMonthlyUsd))}
        {metricTile("Safari total / mo", fmtUsd(o.safariTotalMonthlyUsd), "Connectivity & local infra")}
        {metricTile("Total system / mo", fmtUsd(o.systemTotalMonthlyUsd))}
        {metricTile(
          "Connectivity",
          `${fmtNum(o.wolfUploadMbps, 1)} Mbps WOLF upload`,
          `${fmtNum(o.uploadHeadroomMbps, 1)} Mbps headroom`,
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <WorkspaceStatusPill className={contentionTone(o.systemStatus)}>
          System connectivity: {o.systemStatus}
        </WorkspaceStatusPill>
        <WorkspaceStatusPill className={criterionTone(o.endToEndStatus)}>
          End-to-end criteria: {o.endToEndStatus}
          {o.endToEndTargetMs != null ? ` · target ${o.endToEndTargetMs} ms` : ""}
        </WorkspaceStatusPill>
        <span className="text-xs text-white/45">
          Architecture mode: {model.config.architectureMode.replace("_", " + ")}
        </span>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
        <h3 className="text-sm font-semibold text-white">Daily mission schedule</h3>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {model.config.flightSchedule.map((leg) => (
            <div key={leg.id} className="rounded-lg border border-white/8 bg-black/20 px-3 py-2">
              <p className="font-medium text-white">{leg.label}</p>
              <p className="text-xs text-white/45">
                {leg.durationHours}h · profile {leg.missionProfileSlug}
                {leg.gapAfterHours > 0 ? ` · ${leg.gapAfterHours}h gap after` : ""}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
