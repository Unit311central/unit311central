import type { PipelineScenario } from "@/lib/realtime-video-pipeline/types";
import { BCN_VALIDATION_STATUS } from "@/lib/realtime-video-pipeline/workbench-reference-data";
import type { FlightLeg, WorkbenchModel } from "@/lib/realtime-video-pipeline/workbench-types";

export type ScenarioPresentationKind = "operational_flight" | "technical_pipeline";

export const FLIGHT_SCENARIO_GUIDE =
  "A Flight Scenario defines the proposed operating pattern that drives the downstream engineering model. It determines aircraft, flight frequency, flight duration, mission mix, video workload, bandwidth requirement, AI workload, GPU requirement, storage/data volume, cloud processing, operating cost, and latency workload.";

export const ENGINEERING_MODEL_FLOW_STEPS = [
  "Flight Scenario",
  "Mission Mix",
  "Video / Bandwidth",
  "AI / Compute",
  "Latency",
  "Cloud Cost",
  "Total WOLF Operating Cost",
] as const;

export function resolveScenarioPresentationKind(
  scenario: Pick<PipelineScenario, "scenarioKind">,
): ScenarioPresentationKind {
  return scenario.scenarioKind === "flight" ? "operational_flight" : "technical_pipeline";
}

export function resolveScenarioTypeLabel(kind: ScenarioPresentationKind): string {
  return kind === "operational_flight"
    ? "Operational Reference Scenario"
    : "Technical Reference Pipeline";
}

export function resolveScenarioStatusLabel(kind: ScenarioPresentationKind): string {
  return kind === "operational_flight" ? BCN_VALIDATION_STATUS : "Reference Architecture";
}

export function isOperationalFlightScenario(model: WorkbenchModel): boolean {
  return resolveScenarioPresentationKind(model.flightScenario) === "operational_flight";
}

export type ScenarioMissionSummary = {
  label: string;
  durationHours: number;
  missionProfileSlug: string;
};

export type ScenarioKeyParameters = {
  aircraft: string;
  aircraftCount: number;
  location: string;
  flightsPerDay: number;
  flightHoursPerDay: number;
  liveStreamMbps: number;
  connectivityDownloadMbps: number;
  connectivityUploadMbps: number;
  connectivityLabel: string;
};

export type OperationalScenarioDefinition = {
  kind: "operational_flight";
  bannerLabel: string;
  operatingModel: string;
  missions: ScenarioMissionSummary[];
  keyParameters: ScenarioKeyParameters;
  validationNote: string;
};

export type TechnicalPipelineDefinition = {
  kind: "technical_pipeline";
  purpose: string;
  stageCount: number | null;
  enabledStageCount: number | null;
  pipelineDescription: string;
};

export type ScenarioDefinition =
  | OperationalScenarioDefinition
  | TechnicalPipelineDefinition;

function summarizeMissions(schedule: FlightLeg[]): ScenarioMissionSummary[] {
  return [...schedule]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((leg) => ({
      label: leg.label,
      durationHours: leg.durationHours,
      missionProfileSlug: leg.missionProfileSlug,
    }));
}

function buildKeyParameters(model: WorkbenchModel): ScenarioKeyParameters {
  const { config, schedule } = model;
  return {
    aircraft: config.videoProfile.droneModel,
    aircraftCount: 1,
    location: config.location,
    flightsPerDay: schedule.flightsPerDay,
    flightHoursPerDay: schedule.flightHoursPerDay,
    liveStreamMbps: config.videoProfile.liveStreamBitrateMbps,
    connectivityDownloadMbps: config.connectivity.downloadMbps,
    connectivityUploadMbps: config.connectivity.uploadMbps,
    connectivityLabel: config.connectivity.label,
  };
}

/** Derive Overview scenario copy from the live workbench model — no duplicate scenario store. */
export function buildScenarioDefinition(model: WorkbenchModel): ScenarioDefinition {
  if (!isOperationalFlightScenario(model)) {
    const summary = model.pipeline?.summary ?? null;
    return {
      kind: "technical_pipeline",
      purpose:
        model.flightScenario.description ||
        "Technical reference architecture used to model the generic drone → RF → cloud → AI → WOLF → operator pipeline.",
      stageCount: summary?.stageCount ?? null,
      enabledStageCount: summary?.enabledStageCount ?? null,
      pipelineDescription:
        "Models end-to-end latency and infrastructure stages from capture through operator delivery. Operational flight schedules are configured separately under Flight Scenarios.",
    };
  }

  const keyParameters = buildKeyParameters(model);
  const aircraftName = keyParameters.aircraft;

  return {
    kind: "operational_flight",
    bannerLabel: "Reference Operating Scenario — To Be Validated With BCN",
    operatingModel: `One ${aircraftName} aircraft`,
    missions: summarizeMissions(model.config.flightSchedule),
    keyParameters,
    validationNote: BCN_VALIDATION_STATUS,
  };
}

export function resolveScenarioPresentation(
  scenario: PipelineScenario,
): { kind: ScenarioPresentationKind; typeLabel: string; statusLabel: string } {
  const kind = resolveScenarioPresentationKind(scenario);
  return {
    kind,
    typeLabel: resolveScenarioTypeLabel(kind),
    statusLabel: resolveScenarioStatusLabel(kind),
  };
}
