import { computePipelineSummary, computeStageTotals } from "@/lib/realtime-video-pipeline/calculations";
import type { PipelineScenario, PipelineStage, PipelineSummary } from "@/lib/realtime-video-pipeline/types";
import { resolveWorkbenchConfig } from "@/lib/realtime-video-pipeline/workbench-reference-data";
import type {
  ArchitectureNode,
  ArchitectureView,
  ContentionResult,
  ContentionStatus,
  CriterionEvaluation,
  CriterionStatus,
  FlightLeg,
  GpuConfig,
  LatencyContributor,
  MissionProfile,
  OperatingSchedule,
  PeriodCost,
  ScenarioComparison,
  ScenarioWithSummaryLite,
  SuccessCriterion,
  ValueStatus,
  VideoDataVolumes,
  WorkbenchConfig,
  WorkbenchModel,
  WorkbenchOverview,
} from "@/lib/realtime-video-pipeline/workbench-types";

const MBPS_TO_GB_PER_HOUR = 0.45; // Mbps * hours * (1e6/8)/1e9 ≈ 0.45 GB per Mbps-hour

export function mbpsToGbPerHour(mbps: number, overheadPct = 0): number {
  const effective = mbps * (1 + overheadPct / 100);
  return effective * MBPS_TO_GB_PER_HOUR;
}

export function computeOperatingSchedule(
  schedule: FlightLeg[],
  missionProfiles: MissionProfile[],
  daysPerWeek: number,
  daysPerMonth: number,
): OperatingSchedule {
  const profileMap = new Map(missionProfiles.map((p) => [p.slug, p]));
  let flightHoursPerDay = 0;
  let weightedGpu = 0;
  let weightedCpu = 0;

  for (const leg of schedule) {
    flightHoursPerDay += leg.durationHours;
    const profile = profileMap.get(leg.missionProfileSlug);
    if (profile) {
      weightedGpu += profile.gpuIntensity * leg.durationHours;
      weightedCpu += profile.cpuIntensity * leg.durationHours;
    }
  }

  const divisor = flightHoursPerDay || 1;
  return {
    flightsPerDay: schedule.length,
    flightHoursPerDay,
    flightHoursPerWeek: flightHoursPerDay * daysPerWeek,
    flightHoursPerMonth: flightHoursPerDay * daysPerMonth,
    weightedGpuIntensity: weightedGpu / divisor,
    weightedCpuIntensity: weightedCpu / divisor,
  };
}

export function computeEffectiveLiveBitrateMbps(
  config: WorkbenchConfig,
  schedule: OperatingSchedule,
): { mbps: number; status: ValueStatus } {
  const profileMap = new Map(config.missionProfiles.map((p) => [p.slug, p]));
  let weighted = 0;
  let hours = 0;
  for (const leg of config.flightSchedule) {
    const profile = profileMap.get(leg.missionProfileSlug);
    const legMbps = profile?.liveBitrateMbps ?? config.videoProfile.liveStreamBitrateMbps;
    weighted += legMbps * leg.durationHours;
    hours += leg.durationHours;
  }
  if (hours <= 0) {
    return {
      mbps: config.videoProfile.liveStreamBitrateMbps,
      status: config.videoProfile.liveStreamBitrateStatus,
    };
  }
  return {
    mbps: weighted / hours,
    status: "Calculated",
  };
}

export function computeVideoDataVolumes(
  mbps: number,
  flightHoursPerDay: number,
  daysPerWeek: number,
  daysPerMonth: number,
  overheadPct: number,
): VideoDataVolumes {
  const gbPerHour = mbpsToGbPerHour(mbps, overheadPct);
  const gbPerDay = gbPerHour * flightHoursPerDay;
  const gbPerWeek = gbPerDay * daysPerWeek;
  const gbPerMonth = gbPerDay * daysPerMonth;
  return {
    mbps,
    gbPerHour,
    gbPerDay,
    gbPerWeek,
    gbPerMonth,
    tbPerMonth: gbPerMonth / 1000,
    tbPerYear: (gbPerMonth * 12) / 1000,
    status: "Calculated",
  };
}

export function computeContention(config: WorkbenchConfig, wolfMbps: number): ContentionResult {
  const conn = config.connectivity;
  const park = config.parkContention;
  const concurrentGuests = park.guestCapacity * (park.concurrentGuestPct / 100);
  const guestMbps = concurrentGuests * park.avgGuestBandwidthMbps;
  const staffMbps = park.staffCount * park.avgStaffBandwidthMbps;
  const background = guestMbps + staffMbps + park.operationalTrafficMbps;
  const headroomFactor = 1 - park.safetyHeadroomPct / 100;
  const usableUpload = conn.uploadMbps * headroomFactor;
  const uploadHeadroom = usableUpload - background - wolfMbps;
  const usableDownload = conn.downloadMbps * headroomFactor;
  const downloadHeadroom = usableDownload - background;

  let status: ContentionStatus = "GREEN";
  if (uploadHeadroom < 0) status = "RED";
  else if (uploadHeadroom < wolfMbps * 0.25) status = "AMBER";

  return {
    totalDownloadMbps: conn.downloadMbps,
    totalUploadMbps: conn.uploadMbps,
    backgroundConsumptionMbps: background,
    wolfRequiredMbps: wolfMbps,
    uploadHeadroomMbps: uploadHeadroom,
    downloadHeadroomMbps: downloadHeadroom - wolfMbps,
    status,
    wolfUploadUtilisationPct: usableUpload > 0 ? (wolfMbps / usableUpload) * 100 : 100,
  };
}

function gpuHourlyCost(gpu: GpuConfig): number | null {
  if (gpu.hourlyPriceUsd == null) return null;
  return gpu.gpuCount * gpu.hourlyPriceUsd + gpu.otherComputeHourlyUsd;
}

export function computePeriodCosts(
  config: WorkbenchConfig,
  schedule: OperatingSchedule,
  videoData: VideoDataVolumes,
): PeriodCost[] {
  const gpuHourly = gpuHourlyCost(config.gpuConfig);
  const gpuHoursPerDay =
    schedule.flightHoursPerDay * schedule.weightedGpuIntensity * config.gpuConfig.gpuCount;
  const mediaHoursPerDay = schedule.flightHoursPerDay;

  const wolfMonthlyFixed = config.costLineItems
    .filter((l) => l.category === "wolf" && l.unit === "month")
    .reduce((sum, l) => sum + (l.unitCostUsd ?? 0) * l.estimatedQuantity, 0);
  const safariMonthlyFixed = config.costLineItems
    .filter((l) => l.category === "safari" && l.unit === "month")
    .reduce((sum, l) => sum + (l.unitCostUsd ?? 0) * l.estimatedQuantity, 0);

  const wolfVariableHourly =
    (gpuHourly ?? 0) * (gpuHoursPerDay / Math.max(schedule.flightHoursPerDay, 0.001)) +
    0.12 * (mediaHoursPerDay / Math.max(schedule.flightHoursPerDay, 0.001));

  const results: PeriodCost[] = [];
  for (let months = 1; months <= 24; months += 1) {
    const daysInPeriod = config.daysPerMonth * months;
    const flightHours = schedule.flightHoursPerDay * daysInPeriod;
    const gpuHours = gpuHoursPerDay * daysInPeriod;
    const mediaHours = mediaHoursPerDay * daysInPeriod;

    const wolfGpu = gpuHourly != null ? gpuHourly * gpuHours : null;
    const wolfMedia = 0.12 * mediaHours;
    const wolfFixed = wolfMonthlyFixed * months;
    const wolfTotal =
      wolfGpu != null ? wolfGpu + wolfMedia + wolfFixed : wolfMedia != null ? wolfMedia + wolfFixed : null;

    const safariTotal = safariMonthlyFixed * months;
    const systemTotal = wolfTotal != null && safariTotal != null ? wolfTotal + safariTotal : null;

    const dailyWolf = wolfTotal != null ? wolfTotal / daysInPeriod : null;
    const weeklyWolf = dailyWolf != null ? dailyWolf * config.daysPerWeek : null;
    const monthlyWolf = wolfTotal != null ? wolfTotal / months : null;

    results.push({
      months,
      wolfTotalUsd: wolfTotal,
      safariTotalUsd: safariTotal,
      systemTotalUsd: systemTotal,
      costPerFlightUsd:
        wolfTotal != null && schedule.flightsPerDay > 0
          ? wolfTotal / (schedule.flightsPerDay * daysInPeriod)
          : null,
      costPerFlightHourUsd: wolfTotal != null && flightHours > 0 ? wolfTotal / flightHours : null,
      dailyCostUsd: dailyWolf,
      weeklyCostUsd: weeklyWolf,
      monthlyCostUsd: monthlyWolf,
      cumulativeCostUsd: systemTotal,
    });
  }
  return results;
}

function evaluateCriterion(
  criterion: SuccessCriterion,
  values: Record<string, number | null>,
): CriterionEvaluation {
  const currentValue = values[criterion.metric] ?? null;
  if (currentValue == null) {
    return {
      criterion,
      currentValue: null,
      targetValue: criterion.targetValue,
      difference: null,
      headroom: null,
      status: "NOT TESTED",
      currentStatus: "TBD",
    };
  }

  const higherIsBetter = criterion.higherIsBetter;
  const diff = higherIsBetter
    ? currentValue - criterion.targetValue
    : criterion.targetValue - currentValue;
  const headroom = diff;
  const warningLine = criterion.targetValue * (criterion.warningThresholdPct / 100);

  let status: CriterionStatus = "PASS";
  if (higherIsBetter) {
    if (currentValue < criterion.targetValue) status = "FAIL";
    else if (currentValue < criterion.targetValue + warningLine * 0.1) status = "WARNING";
  } else {
    if (currentValue > criterion.targetValue) status = "FAIL";
    else if (currentValue > criterion.targetValue * (criterion.warningThresholdPct / 100))
      status = "WARNING";
  }

  return {
    criterion,
    currentValue,
    targetValue: criterion.targetValue,
    difference: higherIsBetter ? currentValue - criterion.targetValue : criterion.targetValue - currentValue,
    headroom,
    status,
    currentStatus: "Calculated",
  };
}

export function computeLatencyContributors(
  stages: PipelineStage[],
  totalMs: number | null,
): LatencyContributor[] {
  const enabled = stages.filter((s) => s.enabled);
  const knownTotal =
    totalMs ??
    enabled.reduce((sum, s) => {
      const t = computeStageTotals(s);
      return sum + (t.knownMinimumMs ?? 0);
    }, 0);

  const contributors: LatencyContributor[] = [];
  for (const stage of enabled) {
    const t = computeStageTotals(stage);
    const latencyMs = t.totalMs ?? t.knownMinimumMs;
    if (latencyMs <= 0) continue;
    contributors.push({
      stageId: stage.id,
      component: stage.component,
      pipelineSection: stage.pipelineSection,
      latencyMs,
      pctOfTotal: knownTotal > 0 ? (latencyMs / knownTotal) * 100 : 0,
      measurementStatus: stage.measurementStatus,
      suggestion:
        stage.measurementStatus === "TBD"
          ? "Measure or specify this stage to improve model accuracy."
          : "Review assumptions and consider parallel path optimisation.",
    });
  }
  return contributors.sort((a, b) => b.latencyMs - a.latencyMs).slice(0, 8);
}

function buildArchitectureView(
  id: string,
  title: string,
  stages: PipelineStage[],
  filter?: (s: PipelineStage) => boolean,
): ArchitectureView {
  const filtered = stages.filter((s) => s.enabled && (!filter || filter(s)));
  const nodes: ArchitectureNode[] = filtered.map((s) => {
    const t = computeStageTotals(s);
    const latency = t.totalMs ?? (t.knownMinimumMs > 0 ? t.knownMinimumMs : null);
    const bitrate = s.details.bitrateMbps;
    let valueLabel: string | null = null;
    if (latency != null) valueLabel = `${latency < 1 ? latency.toFixed(3) : latency.toFixed(1)} ms`;
    else if (bitrate != null) valueLabel = `${bitrate} Mbps`;
    return {
      id: s.id,
      label: s.component,
      section: s.pipelineSection,
      valueLabel,
      latencyMs: latency,
      enabled: s.enabled,
      pathKind: s.pathKind,
    };
  });
  const edges = nodes.slice(0, -1).map((n, i) => ({
    from: n.id,
    to: nodes[i + 1]!.id,
  }));
  return { id, title, nodes, edges };
}

export function buildArchitectureViews(
  stages: PipelineStage[],
  options?: { aircraftName?: string },
): ArchitectureView[] {
  const aircraft = options?.aircraftName ?? "Aircraft";
  const enabled = [...stages].filter((s) => s.enabled).sort((a, b) => a.stageOrder - b.stageOrder);
  const rfLatency = enabled.find((s) => s.component === "RF propagation");
  const ingest = enabled.find((s) => s.component === "Cloud Video Ingestion Service");
  const gpu = enabled.find((s) => s.component.includes("GPU"));
  const rfMs = rfLatency ? computeStageTotals(rfLatency).totalMs : null;
  const ingestMs = ingest ? computeStageTotals(ingest).totalMs : null;
  const gpuMs = gpu ? computeStageTotals(gpu).totalMs ?? gpu.aiInferenceMs : null;

  return [
    {
      id: "executive",
      title: "Executive / High Level",
      nodes: [
        node("oryx", aircraft, "Drone", null),
        node("rf", "RF / Communications", "RF Transmission", rfMs),
        node("ground", "Ground Station", "HQ Ground Station", null),
        node("park", "Park Network", "HQ Network", null),
        node("wan", "Internet / WAN", "Internet", null),
        node("ingest", "Cloud Video Ingestion", "Cloud Video Ingest", ingestMs),
        node("media", "Video Processing", "Cloud Media Processing", null),
        node("ai", "AI Processing", "AI Infrastructure", gpuMs),
        node("wolf", "WOLF Services", "WOLF Backend", null),
        node("op", "Operator / Browser", "Browser", null),
      ],
      edges: [
        { from: "oryx", to: "rf" },
        { from: "rf", to: "ground" },
        { from: "ground", to: "park" },
        { from: "park", to: "wan" },
        { from: "wan", to: "ingest" },
        { from: "ingest", to: "media" },
        { from: "media", to: "ai" },
        { from: "ai", to: "wolf" },
        { from: "wolf", to: "op" },
      ],
    },
    buildArchitectureView("infrastructure", "Infrastructure", enabled),
    buildArchitectureView("software", "Software / Services", enabled, (s) =>
      ["WOLF Backend", "Cloud Video Ingest", "Cloud Media Processing", "AI Infrastructure"].includes(
        s.pipelineSection,
      ),
    ),
    buildArchitectureView("middleware", "Middleware / Data Flow", enabled, (s) =>
      ["Cloud Video Ingest", "Cloud Media Processing", "WOLF Backend", "Database"].includes(
        s.pipelineSection,
      ),
    ),
    buildArchitectureView("ai-pipeline", "AI Pipeline", enabled, (s) =>
      ["AI Infrastructure", "AI Detection", "AI Identification"].includes(s.pipelineSection),
    ),
    buildArchitectureView("network-latency", "Network / Latency", enabled, (s) =>
      ["RF Transmission", "HQ Network", "Internet", "Browser Delivery", "Browser"].includes(
        s.pipelineSection,
      ),
    ),
    buildArchitectureView("data-flow", "Data Architecture", enabled),
    {
      id: "failure-resilience",
      title: "Failure / Resilience",
      nodes: enabled
        .filter((s) => s.details.failureImpact || s.details.failureFallback)
        .map((s) => {
          const t = computeStageTotals(s);
          return {
            id: s.id,
            label: s.component,
            section: s.pipelineSection,
            valueLabel: s.details.failureImpact?.slice(0, 40) ?? "TBD",
            latencyMs: t.totalMs,
            enabled: s.enabled,
            pathKind: s.pathKind,
          };
        }),
      edges: [],
    },
  ];
}

function node(
  id: string,
  label: string,
  section: string,
  latencyMs: number | null,
): ArchitectureNode {
  return {
    id,
    label,
    section,
    valueLabel: latencyMs != null ? `${latencyMs} ms` : null,
    latencyMs,
    enabled: true,
    pathKind: null,
  };
}

export function buildWorkbenchModel(input: {
  flightScenario: PipelineScenario;
  pipeline: ScenarioWithSummaryLite | null;
}): WorkbenchModel {
  const config = resolveWorkbenchConfig(input.flightScenario.workbenchConfig);
  const schedule = computeOperatingSchedule(
    config.flightSchedule ?? [],
    config.missionProfiles ?? [],
    config.daysPerWeek ?? 7,
    config.daysPerMonth ?? 30,
  );
  const bitrate = computeEffectiveLiveBitrateMbps(config, schedule);
  const videoData = computeVideoDataVolumes(
    bitrate.mbps,
    schedule.flightHoursPerDay,
    config.daysPerWeek ?? 7,
    config.daysPerMonth ?? 30,
    config.videoProfile?.protocolOverheadPct ?? 12,
  );
  const contention = computeContention(config, bitrate.mbps);
  const costs = computePeriodCosts(config, schedule, videoData);
  const summary = input.pipeline?.summary ?? null;
  const stages = input.pipeline?.stages ?? [];

  const metricValues: Record<string, number | null> = {
    end_to_end_latency_ms: summary?.aiAnnotatedLatencyMs ?? summary?.knownMinimumMs ?? null,
    detection_latency_ms: summary?.aiDetectionLatencyMs ?? null,
    ai_inference_ms: summary?.totalAiInferenceMs ?? null,
    min_fps: config.videoProfile?.liveStreamFps ?? null,
    max_bandwidth_mbps: bitrate.mbps,
    min_availability_pct: config.connectivity?.availabilityPct ?? null,
    max_packet_loss_pct: config.connectivity?.packetLossPct ?? null,
    upload_headroom_mbps: contention.uploadHeadroomMbps,
  };

  const criteria = (config.successCriteria ?? []).map((c) => evaluateCriterion(c, metricValues));
  const e2eCriterion = criteria.find((c) => c.criterion.metric === "end_to_end_latency_ms");
  const latencyContributors = computeLatencyContributors(
    stages,
    summary?.aiAnnotatedLatencyMs ?? summary?.completeLatencyMs ?? null,
  );

  const cost12 = costs.find((c) => c.months === 12);
  const cost24 = costs.find((c) => c.months === 24);
  const cost1 = costs.find((c) => c.months === 1);

  const overview: WorkbenchOverview = {
    endToEndLatencyMs: summary?.aiAnnotatedLatencyMs ?? null,
    endToEndStatus: e2eCriterion?.status ?? "NOT TESTED",
    endToEndTargetMs: e2eCriterion?.criterion.targetValue ?? null,
    flightHoursPerDay: schedule.flightHoursPerDay,
    flightsPerDay: schedule.flightsPerDay,
    videoGbPerHour: videoData.gbPerHour,
    videoTbPerMonth: videoData.tbPerMonth,
    gpuModel: config.gpuConfig?.model ?? "TBD",
    gpuCostPerHourUsd: gpuHourlyCost(config.gpuConfig ?? ({} as GpuConfig)),
    cloudCostPerDayUsd: cost1?.dailyCostUsd ?? null,
    cloudCostPerMonthUsd: cost1?.monthlyCostUsd ?? null,
    cost12MonthUsd: cost12?.wolfTotalUsd ?? null,
    cost24MonthUsd: cost24?.wolfTotalUsd ?? null,
    wolfTotalMonthlyUsd: cost1?.monthlyCostUsd ?? null,
    safariTotalMonthlyUsd: cost1?.safariTotalUsd != null ? cost1.safariTotalUsd : null,
    systemTotalMonthlyUsd: cost1?.systemTotalUsd ?? null,
    usableUploadMbps: contention.totalUploadMbps * (1 - (config.parkContention?.safetyHeadroomPct ?? 20) / 100),
    wolfUploadMbps: contention.wolfRequiredMbps,
    uploadHeadroomMbps: contention.uploadHeadroomMbps,
    systemStatus: contention.status,
    completeLatencyTbd: summary?.completeLatencyMs == null,
    knownMinimumMs: summary?.knownMinimumMs ?? 0,
  };

  return {
    flightScenario: input.flightScenario,
    pipelineScenario: null,
    pipeline: input.pipeline,
    config,
    schedule,
    videoData,
    contention,
    costs,
    criteria,
    latencyContributors,
    architectureViews: buildArchitectureViews(stages, {
      aircraftName: config.videoProfile?.droneModel ?? "Oryx",
    }),
    overview,
  };
}

export function compareWorkbenchModels(a: WorkbenchModel, b: WorkbenchModel): ScenarioComparison {
  const fmt = (n: number | null, suffix = "") =>
    n == null ? "TBD" : `${n.toFixed(suffix === "%" ? 1 : 2)}${suffix}`;
  return {
    scenarioA: { id: a.flightScenario.id, name: a.flightScenario.name },
    scenarioB: { id: b.flightScenario.id, name: b.flightScenario.name },
    deltas: [
      {
        label: "Flight hours / day",
        valueA: fmt(a.schedule.flightHoursPerDay),
        valueB: fmt(b.schedule.flightHoursPerDay),
        delta: fmt(a.schedule.flightHoursPerDay - b.schedule.flightHoursPerDay),
      },
      {
        label: "Video TB / month",
        valueA: fmt(a.videoData.tbPerMonth),
        valueB: fmt(b.videoData.tbPerMonth),
        delta: fmt(a.videoData.tbPerMonth - b.videoData.tbPerMonth),
      },
      {
        label: "WOLF monthly cost (USD)",
        valueA: fmt(a.overview.wolfTotalMonthlyUsd, "$"),
        valueB: fmt(b.overview.wolfTotalMonthlyUsd, "$"),
        delta: fmt(
          (a.overview.wolfTotalMonthlyUsd ?? 0) - (b.overview.wolfTotalMonthlyUsd ?? 0),
          "$",
        ),
      },
      {
        label: "Upload headroom (Mbps)",
        valueA: fmt(a.contention.uploadHeadroomMbps),
        valueB: fmt(b.contention.uploadHeadroomMbps),
        delta: fmt(a.contention.uploadHeadroomMbps - b.contention.uploadHeadroomMbps),
      },
      {
        label: "Known minimum latency (ms)",
        valueA: fmt(a.overview.knownMinimumMs),
        valueB: fmt(b.overview.knownMinimumMs),
        delta: fmt(a.overview.knownMinimumMs - b.overview.knownMinimumMs),
      },
    ],
  };
}

export function recomputePipelineSummary(stages: PipelineStage[]): PipelineSummary {
  return computePipelineSummary(stages);
}
