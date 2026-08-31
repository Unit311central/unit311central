import type {
  CONFIDENCE_LEVELS,
  MEASUREMENT_STATUSES,
  MILESTONES,
  PATH_KINDS,
  PIPELINE_SECTIONS,
  SOURCE_TYPES,
} from "@/lib/realtime-video-pipeline/constants";

export type PipelineSection = (typeof PIPELINE_SECTIONS)[number];
export type MeasurementStatus = (typeof MEASUREMENT_STATUSES)[number];
export type ConfidenceLevel = (typeof CONFIDENCE_LEVELS)[number];
export type SourceType = (typeof SOURCE_TYPES)[number];
export type PathKind = (typeof PATH_KINDS)[number];
export type PipelineMilestone = (typeof MILESTONES)[number];

export type ScenarioConfig = {
  droneModel?: string;
  camera?: string;
  videoCodec?: string;
  resolution?: string;
  fps?: number | null;
  bitrateMbps?: number | null;
  droneDistanceKm?: number | null;
  hqLocation?: string;
  hqInternetUploadMbps?: number | null;
  hqInternetDownloadMbps?: number | null;
  cloudProvider?: string;
  cloudRegion?: string;
  videoProvider?: string;
  aiProvider?: string;
  aiGpu?: string;
  aiModel?: string;
  browser?: string;
};

export type SyncConfig = {
  videoFrameTimestamp?: string;
  aiInferenceTimestamp?: string;
  detectionTimestamp?: string;
  overlayTimestamp?: string;
  synchronisationOffsetMs?: number | null;
  frameAgeMs?: number | null;
};

export type StageDetails = {
  dataType?: string;
  codec?: string;
  resolution?: string;
  fps?: number | null;
  bitrateMbps?: number | null;
  streamingProtocol?: string;
  transportProtocol?: string;
  connectionType?: string;
  sourceEndpoint?: string;
  destinationEndpoint?: string;
  port?: number | null;
  uploadMbps?: number | null;
  downloadMbps?: number | null;
  rttMs?: number | null;
  packetLossPct?: number | null;
  jitterMs?: number | null;
  bufferSize?: string;
  bufferTimeMs?: number | null;
  queueTimeMs?: number | null;
  queueDepth?: number | null;
  memoryType?: string;
  persistentStorage?: boolean;
  processingJitterMs?: number | null;
  distance?: number | null;
  distanceUnit?: "m" | "km";
  propagationMedium?: string;
  propagationTimeMs?: number | null;
  aiModel?: string;
  modelType?: string;
  aiRuntime?: string;
  gpuProvider?: string;
  gpuModel?: string;
  gpuVramGb?: number | null;
  aiInputResolution?: string;
  inferenceFps?: number | null;
  inferenceTimeMs?: number | null;
  aiQueueTimeMs?: number | null;
  detectionConfidencePct?: number | null;
  identificationConfidencePct?: number | null;
  provider?: string;
  managedServiceName?: string;
  region?: string;
  serviceEndpoint?: string;
  managed?: boolean;
  customerManaged?: boolean;
};

export type PipelineStage = {
  id: string;
  workspaceId: string;
  scenarioId: string;
  stageOrder: number;
  stageNumber: number;
  enabled: boolean;
  pipelineSection: PipelineSection;
  component: string;
  whatHappens: string;
  detailedDescription: string;
  processingMs: number | null;
  transmissionMs: number | null;
  bufferMs: number | null;
  queueMs: number | null;
  aiInferenceMs: number | null;
  processingMinMs: number | null;
  processingTypicalMs: number | null;
  processingMaxMs: number | null;
  measurementStatus: MeasurementStatus;
  source: string;
  sourceUrl: string | null;
  sourceType: SourceType;
  confidence: ConfidenceLevel;
  parallel: boolean;
  branchGroup: string | null;
  pathKind: PathKind | null;
  milestone: PipelineMilestone | null;
  details: StageDetails;
  createdAt: string;
  updatedAt: string;
};

export type PipelineScenario = {
  id: string;
  workspaceId: string;
  slug: string;
  name: string;
  description: string;
  isDefault: boolean;
  config: ScenarioConfig;
  syncConfig: SyncConfig;
  createdAt: string;
  updatedAt: string;
};

export type StageLatencyParts = {
  processingMs: number | null;
  transmissionMs: number | null;
  bufferMs: number | null;
  queueMs: number | null;
  aiInferenceMs: number | null;
};

export type StageTotals = StageLatencyParts & {
  totalMs: number | null;
  /** Sum of known latency parts; always defined even when totalMs is incomplete. */
  knownMinimumMs: number;
  isComplete: boolean;
};

export type PipelineSummary = {
  stageCount: number;
  enabledStageCount: number;
  measuredStages: number;
  manufacturerStages: number;
  calculatedStages: number;
  estimatedStages: number;
  assumedStages: number;
  tbdStages: number;
  totalProcessingMs: number | null;
  totalTransmissionMs: number | null;
  totalBufferMs: number | null;
  totalQueueMs: number | null;
  totalAiInferenceMs: number | null;
  completeLatencyMs: number | null;
  knownMinimumMs: number;
  tbdStageCount: number;
  rawVideoLatencyMs: number | null;
  aiDetectionLatencyMs: number | null;
  aiIdentificationLatencyMs: number | null;
  aiAnnotatedLatencyMs: number | null;
  minimumEndToEndMs: number | null;
  typicalEndToEndMs: number | null;
  maximumEndToEndMs: number | null;
  sectionBreakdown: { section: PipelineSection; totalMs: number | null; knownMinimumMs: number }[];
};

export type ScenarioWithSummary = PipelineScenario & {
  summary: PipelineSummary;
  stages: PipelineStage[];
};

export type CreateStageInput = Partial<
  Omit<PipelineStage, "id" | "workspaceId" | "scenarioId" | "stageNumber" | "createdAt" | "updatedAt">
> & {
  pipelineSection: PipelineSection;
  component: string;
};

export type UpdateStageInput = Partial<
  Omit<PipelineStage, "id" | "workspaceId" | "scenarioId" | "stageNumber" | "createdAt" | "updatedAt">
>;
