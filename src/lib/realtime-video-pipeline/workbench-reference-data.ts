import type {
  ConnectivityProfile,
  FlightLeg,
  GpuConfig,
  MissionProfile,
  SuccessCriterion,
  VideoProfile,
  WorkbenchConfig,
} from "@/lib/realtime-video-pipeline/workbench-types";

export const BCN_FLIGHT_SCENARIO_SLUG = "south-africa-bcn-daily-reserve-operations";

export const DEFAULT_SUCCESS_CRITERIA: SuccessCriterion[] = [
  {
    id: "e2e-latency",
    label: "Maximum end-to-end latency",
    metric: "end_to_end_latency_ms",
    targetValue: 5000,
    warningThresholdPct: 90,
    unit: "ms",
    higherIsBetter: false,
  },
  {
    id: "detection-latency",
    label: "Maximum detection latency",
    metric: "detection_latency_ms",
    targetValue: 3000,
    warningThresholdPct: 90,
    unit: "ms",
    higherIsBetter: false,
  },
  {
    id: "ai-inference",
    label: "Maximum AI inference",
    metric: "ai_inference_ms",
    targetValue: 250,
    warningThresholdPct: 90,
    unit: "ms",
    higherIsBetter: false,
  },
  {
    id: "min-fps",
    label: "Minimum processing FPS",
    metric: "min_fps",
    targetValue: 20,
    warningThresholdPct: 90,
    unit: "FPS",
    higherIsBetter: true,
  },
  {
    id: "upload-headroom",
    label: "Minimum upload headroom",
    metric: "upload_headroom_mbps",
    targetValue: 2,
    warningThresholdPct: 50,
    unit: "Mbps",
    higherIsBetter: true,
  },
];

/** DJI Mavic 3 Enterprise-class reference — manufacturer specs where cited. */
export const REFERENCE_VIDEO_PROFILE: VideoProfile = {
  droneModel: "DJI Mavic 3 Enterprise (reference class)",
  cameraModel: "Wide camera (reference class)",
  recordingResolution: "5280×3956",
  recordingFps: 30,
  recordingCodec: "H.265 / HEVC",
  maxRecordingBitrateMbps: 200,
  maxRecordingBitrateStatus: "Verified Specification",
  nominalFlightTimeMin: 45,
  operationalFlightTimeMin: 35,
  liveStreamResolution: "1080p",
  liveStreamFps: 30,
  liveStreamCodec: "H.264",
  liveStreamBitrateMbps: 8,
  liveStreamBitrateStatus: "Reference Assumption",
  protocolOverheadPct: 12,
  source: "DJI Mavic 3 Enterprise specs (recording); live stream bitrate is engineering reference assumption",
  sourceUrl: "https://enterprise.dji.com/mavic-3-enterprise",
};

function starlinkTier(
  tier: "conservative" | "reference" | "optimistic",
  download: number,
  upload: number,
  latency: number | null,
): ConnectivityProfile {
  return {
    label: `Starlink / LEO — ${tier}`,
    location: "South African safari reserve (reference)",
    provider: "Starlink / LEO (reference)",
    downloadMbps: download,
    uploadMbps: upload,
    latencyMs: latency,
    jitterMs: tier === "conservative" ? 40 : tier === "reference" ? 25 : 15,
    packetLossPct: tier === "conservative" ? 1.5 : tier === "reference" ? 0.5 : 0.2,
    availabilityPct: tier === "conservative" ? 97 : tier === "reference" ? 99 : 99.5,
    monthlyCostUsd: tier === "conservative" ? 120 : tier === "reference" ? 120 : 120,
    hardwareCostUsd: tier === "reference" ? 599 : null,
    dataAllocationGb: null,
    starlinkTier: tier,
    status: "Reference Assumption",
    source: "Starlink consumer/business plan reference — verify with BCN field measurements",
    sourceUrl: "https://www.starlink.com",
    paidBy: "safari",
  };
}

export const REFERENCE_MISSION_PROFILES: MissionProfile[] = [
  {
    slug: "fence-inspection",
    name: "Fence inspection / containment",
    description: "Perimeter patrol with moderate live video and detection load.",
    resolution: "1080p",
    fps: 30,
    liveBitrateMbps: 6,
    inferenceFrequencyHz: 2,
    aiModels: ["Perimeter detector (TBD)"],
    frameSamplingPct: 50,
    gpuIntensity: 0.4,
    cpuIntensity: 0.3,
    memoryGb: 4,
    storageGbPerHour: 2,
    expectedLatencyMs: null,
    processingIntensity: "medium",
    status: "Reference Assumption",
  },
  {
    slug: "animal-counting",
    name: "Animal counting",
    description: "Compute-intensive detection, tracking, and counting mission.",
    resolution: "1080p",
    fps: 30,
    liveBitrateMbps: 8,
    inferenceFrequencyHz: 5,
    aiModels: ["Animal detector (TBD)", "Tracker (TBD)"],
    frameSamplingPct: 100,
    gpuIntensity: 0.85,
    cpuIntensity: 0.5,
    memoryGb: 8,
    storageGbPerHour: 4,
    expectedLatencyMs: null,
    processingIntensity: "very_high",
    status: "Reference Assumption",
  },
  {
    slug: "fire-flood-injury",
    name: "Fire / flood / injured animal detection",
    description: "Event detection with moderate-high GPU load.",
    resolution: "1080p",
    fps: 30,
    liveBitrateMbps: 8,
    inferenceFrequencyHz: 4,
    aiModels: ["Event detector (TBD)"],
    frameSamplingPct: 80,
    gpuIntensity: 0.7,
    cpuIntensity: 0.45,
    memoryGb: 6,
    storageGbPerHour: 3,
    expectedLatencyMs: null,
    processingIntensity: "high",
    status: "Reference Assumption",
  },
  {
    slug: "anti-poaching-thermal",
    name: "Anti-poaching / thermal monitoring",
    description: "Night thermal monitoring — high compute reference assumption.",
    resolution: "720p",
    fps: 25,
    liveBitrateMbps: 6,
    inferenceFrequencyHz: 6,
    aiModels: ["Thermal detector (TBD)", "Re-ID (TBD)"],
    frameSamplingPct: 100,
    gpuIntensity: 0.9,
    cpuIntensity: 0.55,
    memoryGb: 10,
    storageGbPerHour: 5,
    expectedLatencyMs: null,
    processingIntensity: "very_high",
    status: "Reference Assumption",
  },
];

export const BCN_FLIGHT_SCHEDULE: FlightLeg[] = [
  {
    id: "flight-1",
    label: "Fence inspection / containment",
    missionProfileSlug: "fence-inspection",
    durationHours: 2,
    gapAfterHours: 1,
    sortOrder: 1,
  },
  {
    id: "flight-2",
    label: "Animal counting",
    missionProfileSlug: "animal-counting",
    durationHours: 2,
    gapAfterHours: 1,
    sortOrder: 2,
  },
  {
    id: "flight-3",
    label: "Fire / flood / injured animal detection",
    missionProfileSlug: "fire-flood-injury",
    durationHours: 2,
    gapAfterHours: 1,
    sortOrder: 3,
  },
  {
    id: "flight-4",
    label: "Anti-poaching / thermal monitoring",
    missionProfileSlug: "anti-poaching-thermal",
    durationHours: 2,
    gapAfterHours: 0,
    sortOrder: 4,
  },
];

export const REFERENCE_GPU_CONFIG: GpuConfig = {
  provider: "AWS (reference)",
  region: "af-south-1 / eu-west-2 (TBD)",
  manufacturer: "NVIDIA",
  model: "NVIDIA L4 (reference)",
  gpuCount: 1,
  vramGb: 24,
  hourlyPriceUsd: 0.86,
  hourlyPriceStatus: "Reference Assumption",
  inferenceFps: null,
  cpuCores: 4,
  memoryGb: 16,
  storageGb: 100,
  otherComputeHourlyUsd: 0.15,
  source: "AWS EC2 G6/L4 public pricing reference — verify at deploy time",
  sourceDate: "2026-08",
};

export const GPU_ALTERNATIVES: GpuConfig[] = [
  REFERENCE_GPU_CONFIG,
  {
    ...REFERENCE_GPU_CONFIG,
    model: "NVIDIA A10 (reference)",
    vramGb: 24,
    hourlyPriceUsd: 1.2,
    hourlyPriceStatus: "Reference Assumption",
    source: "AWS g5/A10 public pricing reference",
  },
  {
    ...REFERENCE_GPU_CONFIG,
    model: "NVIDIA T4 (reference)",
    vramGb: 16,
    hourlyPriceUsd: 0.55,
    hourlyPriceStatus: "Reference Assumption",
    source: "AWS g4dn/T4 public pricing reference",
  },
];

export function createBcnWorkbenchConfig(): WorkbenchConfig {
  const connectivityTiers = {
    conservative: starlinkTier("conservative", 80, 12, 45),
    reference: starlinkTier("reference", 130, 20, 30),
    optimistic: starlinkTier("optimistic", 200, 35, 20),
  };

  return {
    location: "South African safari reserve (BCN reference)",
    daysPerWeek: 7,
    daysPerMonth: 30,
    operatingMonths: 12,
    flightSchedule: BCN_FLIGHT_SCHEDULE,
    videoProfile: REFERENCE_VIDEO_PROFILE,
    connectivity: connectivityTiers.reference,
    parkContention: {
      guestCapacity: 36,
      concurrentGuestPct: 15,
      avgGuestBandwidthMbps: 2,
      staffCount: 25,
      avgStaffBandwidthMbps: 1.5,
      operationalTrafficMbps: 10,
      safetyHeadroomPct: 20,
    },
    activeConnectivityTier: "reference",
    connectivityTiers,
    missionProfiles: REFERENCE_MISSION_PROFILES,
    gpuConfig: REFERENCE_GPU_CONFIG,
    gpuAlternatives: GPU_ALTERNATIVES,
    architectureMode: "cloud",
    successCriteria: DEFAULT_SUCCESS_CRITERIA,
    costLineItems: [
      {
        id: "gpu-compute",
        label: "GPU inference compute",
        category: "wolf",
        unit: "hour",
        unitCostUsd: 0.86,
        estimatedQuantity: 0,
        status: "Reference Assumption",
        source: "AWS L4 reference hourly",
      },
      {
        id: "video-ingest",
        label: "Video ingest & media processing",
        category: "wolf",
        unit: "hour",
        unitCostUsd: 0.12,
        estimatedQuantity: 0,
        status: "Reference Assumption",
        source: "Managed media reference estimate",
      },
      {
        id: "storage",
        label: "Cloud storage (metadata/events)",
        category: "wolf",
        unit: "month",
        unitCostUsd: 45,
        estimatedQuantity: 1,
        status: "Reference Assumption",
        source: "Engineering estimate",
      },
      {
        id: "monitoring",
        label: "Logging & monitoring",
        category: "wolf",
        unit: "month",
        unitCostUsd: 25,
        estimatedQuantity: 1,
        status: "Reference Assumption",
        source: "Engineering estimate",
      },
      {
        id: "starlink",
        label: "Starlink / park connectivity",
        category: "safari",
        unit: "month",
        unitCostUsd: 120,
        estimatedQuantity: 1,
        status: "Reference Assumption",
        source: "Starlink plan reference",
      },
    ],
    currency: "USD",
  };
}

export const BCN_FLIGHT_SCENARIO_NAME = "South Africa — BCN Daily Reserve Operations";

export const BCN_FLIGHT_SCENARIO_DESCRIPTION =
  "Reference BCN/ WOLF daily operating model: 4 flights, 8 flight-hours per day across fence inspection, animal counting, event detection, and night anti-poaching. All values are editable reference assumptions until BCN field data is measured.";

/** Merge stored partial config with BCN reference defaults. */
export function resolveWorkbenchConfig(partial?: Partial<WorkbenchConfig> | null): WorkbenchConfig {
  const defaults = createBcnWorkbenchConfig();
  if (!partial || Object.keys(partial).length === 0) return defaults;

  return {
    ...defaults,
    ...partial,
    videoProfile: { ...defaults.videoProfile, ...partial.videoProfile },
    connectivity: { ...defaults.connectivity, ...partial.connectivity },
    parkContention: { ...defaults.parkContention, ...partial.parkContention },
    gpuConfig: { ...defaults.gpuConfig, ...partial.gpuConfig },
    connectivityTiers: {
      conservative: {
        ...defaults.connectivityTiers.conservative,
        ...partial.connectivityTiers?.conservative,
      },
      reference: {
        ...defaults.connectivityTiers.reference,
        ...partial.connectivityTiers?.reference,
      },
      optimistic: {
        ...defaults.connectivityTiers.optimistic,
        ...partial.connectivityTiers?.optimistic,
      },
    },
    flightSchedule:
      partial.flightSchedule && partial.flightSchedule.length > 0
        ? partial.flightSchedule
        : defaults.flightSchedule,
    missionProfiles:
      partial.missionProfiles && partial.missionProfiles.length > 0
        ? partial.missionProfiles
        : defaults.missionProfiles,
    successCriteria:
      partial.successCriteria && partial.successCriteria.length > 0
        ? partial.successCriteria
        : defaults.successCriteria,
    costLineItems:
      partial.costLineItems && partial.costLineItems.length > 0
        ? partial.costLineItems
        : defaults.costLineItems,
    gpuAlternatives:
      partial.gpuAlternatives && partial.gpuAlternatives.length > 0
        ? partial.gpuAlternatives
        : defaults.gpuAlternatives,
  };
}
