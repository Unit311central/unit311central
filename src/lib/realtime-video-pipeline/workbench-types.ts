import type { PipelineScenario, PipelineSummary, PipelineStage } from "@/lib/realtime-video-pipeline/types";

export type ValueStatus =
  | "Verified Specification"
  | "Reference Assumption"
  | "Calculated"
  | "Measured"
  | "User Input"
  | "TBD";

export type ArchitectureMode = "cloud" | "edge_cloud" | "on_site";

export type CriterionStatus = "PASS" | "WARNING" | "FAIL" | "NOT TESTED";

export type ContentionStatus = "GREEN" | "AMBER" | "RED";

export type FlightLeg = {
  id: string;
  label: string;
  missionProfileSlug: string;
  durationHours: number;
  gapAfterHours: number;
  sortOrder: number;
};

export type VideoProfile = {
  droneModel: string;
  cameraModel: string;
  recordingResolution: string;
  recordingFps: number;
  recordingCodec: string;
  maxRecordingBitrateMbps: number;
  maxRecordingBitrateStatus: ValueStatus;
  nominalFlightTimeMin: number;
  operationalFlightTimeMin: number;
  liveStreamResolution: string;
  liveStreamFps: number;
  liveStreamCodec: string;
  liveStreamBitrateMbps: number;
  liveStreamBitrateStatus: ValueStatus;
  protocolOverheadPct: number;
  source: string;
  sourceUrl: string;
};

export type MissionProfile = {
  slug: string;
  name: string;
  description: string;
  resolution: string;
  fps: number;
  liveBitrateMbps: number;
  inferenceFrequencyHz: number;
  aiModels: string[];
  frameSamplingPct: number;
  gpuIntensity: number;
  cpuIntensity: number;
  memoryGb: number;
  storageGbPerHour: number;
  expectedLatencyMs: number | null;
  processingIntensity: "low" | "medium" | "high" | "very_high";
  status: ValueStatus;
};

export type StarlinkProfileTier = "conservative" | "reference" | "optimistic";

export type ConnectivityProfile = {
  label: string;
  location: string;
  provider: string;
  downloadMbps: number;
  uploadMbps: number;
  latencyMs: number | null;
  jitterMs: number | null;
  packetLossPct: number | null;
  availabilityPct: number | null;
  monthlyCostUsd: number | null;
  hardwareCostUsd: number | null;
  dataAllocationGb: number | null;
  starlinkTier: StarlinkProfileTier;
  status: ValueStatus;
  source: string;
  sourceUrl: string;
  paidBy: "safari";
};

export type ParkContentionModel = {
  guestCapacity: number;
  concurrentGuestPct: number;
  avgGuestBandwidthMbps: number;
  staffCount: number;
  avgStaffBandwidthMbps: number;
  operationalTrafficMbps: number;
  safetyHeadroomPct: number;
};

export type GpuConfig = {
  provider: string;
  region: string;
  manufacturer: string;
  model: string;
  gpuCount: number;
  vramGb: number;
  hourlyPriceUsd: number | null;
  hourlyPriceStatus: ValueStatus;
  inferenceFps: number | null;
  cpuCores: number;
  memoryGb: number;
  storageGb: number;
  otherComputeHourlyUsd: number;
  source: string;
  sourceDate: string;
};

export type SuccessCriterion = {
  id: string;
  label: string;
  metric:
    | "end_to_end_latency_ms"
    | "detection_latency_ms"
    | "ai_inference_ms"
    | "min_fps"
    | "max_bandwidth_mbps"
    | "min_availability_pct"
    | "max_packet_loss_pct"
    | "upload_headroom_mbps";
  targetValue: number;
  warningThresholdPct: number;
  unit: string;
  higherIsBetter: boolean;
};

export type CostLineItem = {
  id: string;
  label: string;
  category: "wolf" | "safari";
  unit: "hour" | "day" | "month" | "gb" | "flight_hour" | "flat";
  unitCostUsd: number | null;
  estimatedQuantity: number;
  status: ValueStatus;
  source: string;
};

export type WorkbenchConfig = {
  location: string;
  daysPerWeek: number;
  daysPerMonth: number;
  operatingMonths: number;
  flightSchedule: FlightLeg[];
  videoProfile: VideoProfile;
  connectivity: ConnectivityProfile;
  parkContention: ParkContentionModel;
  activeConnectivityTier: StarlinkProfileTier;
  connectivityTiers: Record<StarlinkProfileTier, ConnectivityProfile>;
  missionProfiles: MissionProfile[];
  gpuConfig: GpuConfig;
  gpuAlternatives: GpuConfig[];
  architectureMode: ArchitectureMode;
  successCriteria: SuccessCriterion[];
  costLineItems: CostLineItem[];
  currency: string;
};

export type ScenarioKind = "pipeline" | "flight";

export type ExtendedStageDetails = {
  manufacturer?: string;
  technology?: string;
  hardwareSoftware?: string;
  location?: string;
  deploymentType?: "cloud" | "edge" | "on_site" | "hybrid" | "TBD";
  input?: string;
  output?: string;
  throughputMbps?: number | null;
  measuredLatencyMs?: number | null;
  cpuRequirement?: string;
  gpuRequirement?: string;
  gpuCount?: number | null;
  memoryGb?: number | null;
  vramGb?: number | null;
  utilisationPct?: number | null;
  costProvider?: string;
  costService?: string;
  costUnit?: string;
  costUnitPriceUsd?: number | null;
  costEstimatedUsage?: number | null;
  failureImpact?: string;
  failureFallback?: string;
  failureRecovery?: string;
};

export type VideoDataVolumes = {
  mbps: number;
  gbPerHour: number;
  gbPerDay: number;
  gbPerWeek: number;
  gbPerMonth: number;
  tbPerMonth: number;
  tbPerYear: number;
  status: ValueStatus;
};

export type OperatingSchedule = {
  flightsPerDay: number;
  flightHoursPerDay: number;
  flightHoursPerWeek: number;
  flightHoursPerMonth: number;
  weightedGpuIntensity: number;
  weightedCpuIntensity: number;
};

export type ContentionResult = {
  totalDownloadMbps: number;
  totalUploadMbps: number;
  backgroundConsumptionMbps: number;
  wolfRequiredMbps: number;
  uploadHeadroomMbps: number;
  downloadHeadroomMbps: number;
  status: ContentionStatus;
  wolfUploadUtilisationPct: number;
};

export type PeriodCost = {
  months: number;
  wolfTotalUsd: number | null;
  safariTotalUsd: number | null;
  systemTotalUsd: number | null;
  costPerFlightUsd: number | null;
  costPerFlightHourUsd: number | null;
  dailyCostUsd: number | null;
  weeklyCostUsd: number | null;
  monthlyCostUsd: number | null;
  cumulativeCostUsd: number | null;
};

export type CriterionEvaluation = {
  criterion: SuccessCriterion;
  currentValue: number | null;
  targetValue: number;
  difference: number | null;
  headroom: number | null;
  status: CriterionStatus;
  currentStatus: ValueStatus;
};

export type LatencyContributor = {
  stageId: string;
  component: string;
  pipelineSection: string;
  latencyMs: number;
  pctOfTotal: number;
  measurementStatus: string;
  suggestion: string;
};

export type ArchitectureNode = {
  id: string;
  label: string;
  section: string;
  valueLabel: string | null;
  latencyMs: number | null;
  enabled: boolean;
  pathKind: string | null;
};

export type ArchitectureView = {
  id: string;
  title: string;
  nodes: ArchitectureNode[];
  edges: { from: string; to: string }[];
};

export type WorkbenchModel = {
  flightScenario: PipelineScenario;
  pipelineScenario: PipelineScenario | null;
  pipeline: ScenarioWithSummaryLite | null;
  config: WorkbenchConfig;
  schedule: OperatingSchedule;
  videoData: VideoDataVolumes;
  contention: ContentionResult;
  costs: PeriodCost[];
  criteria: CriterionEvaluation[];
  latencyContributors: LatencyContributor[];
  architectureViews: ArchitectureView[];
  overview: WorkbenchOverview;
};

export type ScenarioWithSummaryLite = {
  stages: PipelineStage[];
  summary: PipelineSummary;
};

export type WorkbenchOverview = {
  endToEndLatencyMs: number | null;
  endToEndStatus: CriterionStatus;
  endToEndTargetMs: number | null;
  flightHoursPerDay: number;
  flightsPerDay: number;
  videoGbPerHour: number;
  videoTbPerMonth: number;
  gpuModel: string;
  gpuCostPerHourUsd: number | null;
  cloudCostPerDayUsd: number | null;
  cloudCostPerMonthUsd: number | null;
  cost12MonthUsd: number | null;
  cost24MonthUsd: number | null;
  wolfTotalMonthlyUsd: number | null;
  safariTotalMonthlyUsd: number | null;
  systemTotalMonthlyUsd: number | null;
  usableUploadMbps: number;
  wolfUploadMbps: number;
  uploadHeadroomMbps: number;
  systemStatus: ContentionStatus;
  completeLatencyTbd: boolean;
  knownMinimumMs: number;
};

export type ScenarioComparison = {
  scenarioA: { id: string; name: string };
  scenarioB: { id: string; name: string };
  deltas: {
    label: string;
    valueA: string;
    valueB: string;
    delta: string;
  }[];
};
