"use client";

import { ArrowRight, ChevronDown, Info } from "lucide-react";
import { useState } from "react";

import { formatLatencyMs } from "@/lib/realtime-video-pipeline/calculations";
import {
  buildScenarioDefinition,
  ENGINEERING_MODEL_FLOW_STEPS,
  FLIGHT_SCENARIO_GUIDE,
  isOperationalFlightScenario,
} from "@/lib/realtime-video-pipeline/workbench-scenario-presentation";
import type { WorkbenchModel } from "@/lib/realtime-video-pipeline/workbench-types";
import { WorkspaceStatusPill } from "@/components/workspace-ui/primitives";
import { cn } from "@/lib/utils";

import { contentionTone, criterionTone, fmtNum, fmtUsd, metricTile } from "./shared";

type Props = {
  model: WorkbenchModel;
  onOpenFlightScenarios?: () => void;
};

function DefinitionRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-3">
      <dt className="min-w-[9rem] text-[11px] font-semibold uppercase tracking-[0.12em] text-white/40">
        {label}
      </dt>
      <dd className="text-sm text-white/90">{value}</dd>
    </div>
  );
}

function EngineeringModelFlow() {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <h3 className="text-sm font-semibold text-white">Scenario → downstream model</h3>
      <p className="mt-1 text-xs text-white/45">
        How the selected scenario feeds the engineering workbench calculations.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {ENGINEERING_MODEL_FLOW_STEPS.map((step, index) => (
          <div key={step} className="flex items-center gap-2">
            <span className="rounded-lg border border-sky-400/25 bg-sky-500/10 px-3 py-1.5 text-xs font-medium text-sky-100">
              {step}
            </span>
            {index < ENGINEERING_MODEL_FLOW_STEPS.length - 1 ? (
              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-white/25" aria-hidden />
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function ScenarioDefinitionPanel({
  model,
  onOpenFlightScenarios,
}: {
  model: WorkbenchModel;
  onOpenFlightScenarios?: () => void;
}) {
  const definition = buildScenarioDefinition(model);

  if (definition.kind === "technical_pipeline") {
    return (
      <div className="rounded-xl border border-violet-400/20 bg-violet-500/[0.06] p-4">
        <h3 className="text-sm font-semibold text-white">Scenario definition</h3>
        <div className="mt-3 space-y-3">
          <DefinitionRow label="Purpose" value={definition.purpose} />
          {definition.stageCount != null ? (
            <DefinitionRow
              label="Pipeline stages"
              value={`${definition.enabledStageCount ?? definition.stageCount} enabled · ${definition.stageCount} total`}
            />
          ) : null}
          <p className="text-sm leading-relaxed text-white/60">{definition.pipelineDescription}</p>
        </div>
        <p className="mt-4 text-xs text-violet-200/70">
          Technical reference pipeline — not an operational BCN flight schedule. Configure operating
          assumptions under Flight Scenarios when modelling a reserve deployment.
        </p>
      </div>
    );
  }

  const { keyParameters, missions } = definition;

  return (
    <div className="rounded-xl border border-amber-400/20 bg-amber-500/[0.06] p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-white">Scenario definition</h3>
        <WorkspaceStatusPill className="border-amber-400/30 bg-amber-500/15 text-amber-100">
          {definition.bannerLabel}
        </WorkspaceStatusPill>
      </div>

      <dl className="mt-4 space-y-2.5">
        <DefinitionRow label="Aircraft" value={keyParameters.aircraft} />
        <DefinitionRow label="Location" value={keyParameters.location} />
        <DefinitionRow label="Operating model" value={definition.operatingModel} />
        <DefinitionRow
          label="Reference daily operation"
          value={`${keyParameters.flightsPerDay} flights/day`}
        />
      </dl>

      <div className="mt-4 rounded-lg border border-white/8 bg-black/20 p-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">
          Reference mission schedule
        </p>
        <ul className="mt-2 space-y-1.5">
          {missions.map((mission) => (
            <li key={`${mission.label}-${mission.missionProfileSlug}`} className="text-sm text-white/85">
              <span className="font-medium">{mission.label}</span>
              <span className="text-white/45"> — {mission.durationHours} hours</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 border-t border-white/8 pt-3 text-sm font-semibold text-white">
          Total: {keyParameters.flightHoursPerDay} flight-hours/day
        </p>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border border-white/8 bg-black/15 px-3 py-2 text-sm text-white/85">
          {keyParameters.aircraft}
        </div>
        <div className="rounded-lg border border-white/8 bg-black/15 px-3 py-2 text-sm text-white/85">
          {keyParameters.aircraftCount} aircraft
        </div>
        <div className="rounded-lg border border-white/8 bg-black/15 px-3 py-2 text-sm text-white/85">
          {keyParameters.flightsPerDay} missions/day
        </div>
        <div className="rounded-lg border border-white/8 bg-black/15 px-3 py-2 text-sm text-white/85">
          {keyParameters.flightHoursPerDay} flight-hours/day
        </div>
        <div className="rounded-lg border border-white/8 bg-black/15 px-3 py-2 text-sm text-white/85">
          {keyParameters.liveStreamMbps} Mbps reference live stream
        </div>
        <div className="rounded-lg border border-white/8 bg-black/15 px-3 py-2 text-sm text-white/85">
          {keyParameters.connectivityDownloadMbps} Mbps / {keyParameters.connectivityUploadMbps} Mbps
          reference park connectivity
        </div>
      </div>

      <p className="mt-3 text-xs text-amber-200/80">{definition.validationNote}</p>

      {onOpenFlightScenarios ? (
        <button
          type="button"
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-sky-300 hover:text-sky-200"
          onClick={onOpenFlightScenarios}
        >
          Detailed scenario configuration
          <ArrowRight className="h-4 w-4" />
          Flight Scenarios
        </button>
      ) : null}
    </div>
  );
}

function FlightScenarioGuidePanel() {
  const [open, setOpen] = useState(true);

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02]">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-white">
          <Info className="h-4 w-4 text-sky-300/80" aria-hidden />
          What is a Flight Scenario?
        </span>
        <ChevronDown
          className={cn("h-4 w-4 text-white/40 transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>
      {open ? (
        <div className="border-t border-white/8 px-4 pb-4 pt-3">
          <p className="text-sm leading-relaxed text-white/60">{FLIGHT_SCENARIO_GUIDE}</p>
        </div>
      ) : null}
    </div>
  );
}

export function OverviewTab({ model, onOpenFlightScenarios }: Props) {
  const o = model.overview;
  const operational = isOperationalFlightScenario(model);
  const e2e =
    o.endToEndLatencyMs != null ? `${formatLatencyMs(o.endToEndLatencyMs)} ms` : "TBD";

  return (
    <div className="space-y-5">
      <ScenarioDefinitionPanel model={model} onOpenFlightScenarios={onOpenFlightScenarios} />

      <FlightScenarioGuidePanel />

      <EngineeringModelFlow />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {metricTile(
          "AI-annotated end-to-end latency",
          e2e,
          o.completeLatencyTbd
            ? `Known minimum ${formatLatencyMs(o.knownMinimumMs)} ms · COMPLETE LATENCY: TBD`
            : undefined,
          "md:col-span-2",
        )}
        {operational
          ? metricTile(
              "Aircraft",
              model.config.videoProfile.droneModel,
              "Reference assumption — to be validated with BCN",
            )
          : metricTile(
              "Pipeline stages",
              model.pipeline?.summary?.stageCount != null
                ? String(model.pipeline.summary.stageCount)
                : "TBD",
              model.pipeline?.summary?.enabledStageCount != null
                ? `${model.pipeline.summary.enabledStageCount} enabled`
                : undefined,
            )}
        {operational
          ? metricTile(
              "Flight hours / day",
              fmtNum(o.flightHoursPerDay, 1),
              `${o.flightsPerDay} flights`,
            )
          : metricTile(
              "Architecture mode",
              model.config.architectureMode.replace("_", " + "),
              "Technical reference pipeline",
            )}
        {operational
          ? metricTile(
              "Video / hour",
              `${fmtNum(o.videoGbPerHour)} GB`,
              `${fmtNum(model.videoData.mbps, 1)} Mbps effective`,
            )
          : null}
        {operational ? metricTile("Video / month", `${fmtNum(o.videoTbPerMonth, 3)} TB`, "From schedule") : null}
        {operational ? metricTile("GPU", o.gpuModel, `${fmtUsd(o.gpuCostPerHourUsd)}/hr`) : null}
        {operational ? metricTile("WOLF cloud / day", fmtUsd(o.cloudCostPerDayUsd), "Excludes Safari connectivity") : null}
        {operational ? metricTile("WOLF cloud / month", fmtUsd(o.cloudCostPerMonthUsd)) : null}
        {operational ? metricTile("12-month WOLF cost", fmtUsd(o.cost12MonthUsd)) : null}
        {operational ? metricTile("24-month WOLF cost", fmtUsd(o.cost24MonthUsd)) : null}
        {operational ? metricTile("WOLF / BCN total / mo", fmtUsd(o.wolfTotalMonthlyUsd)) : null}
        {operational ? metricTile("Safari total / mo", fmtUsd(o.safariTotalMonthlyUsd), "Connectivity & local infra") : null}
        {operational ? metricTile("Total system / mo", fmtUsd(o.systemTotalMonthlyUsd)) : null}
        {operational
          ? metricTile(
              "Connectivity",
              `${fmtNum(o.wolfUploadMbps, 1)} Mbps WOLF upload`,
              `${fmtNum(o.uploadHeadroomMbps, 1)} Mbps headroom`,
            )
          : null}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <WorkspaceStatusPill className={contentionTone(o.systemStatus)}>
          System connectivity: {o.systemStatus}
        </WorkspaceStatusPill>
        <WorkspaceStatusPill className={criterionTone(o.endToEndStatus)}>
          End-to-end criteria: {o.endToEndStatus}
          {o.endToEndTargetMs != null ? ` · target ${o.endToEndTargetMs} ms` : ""}
        </WorkspaceStatusPill>
        {operational ? (
          <span className="text-xs text-white/45">
            Architecture mode: {model.config.architectureMode.replace("_", " + ")}
          </span>
        ) : null}
      </div>
    </div>
  );
}
