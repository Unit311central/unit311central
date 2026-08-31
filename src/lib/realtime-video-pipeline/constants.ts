export const PIPELINE_SECTIONS = [
  "Drone",
  "RF Transmission",
  "HQ Ground Station",
  "HQ Network",
  "Internet",
  "Cloud Video Ingest",
  "Cloud Media Processing",
  "AI Infrastructure",
  "AI Detection",
  "AI Identification",
  "WOLF Backend",
  "Database",
  "Browser Delivery",
  "Browser",
] as const;

export const MEASUREMENT_STATUSES = [
  "Measured",
  "Manufacturer Specification",
  "Calculated",
  "Engineering Estimate",
  "Assumed",
  "TBD",
] as const;

export const CONFIDENCE_LEVELS = ["High", "Medium", "Low", "Unknown"] as const;

export const SOURCE_TYPES = [
  "",
  "Manufacturer",
  "Cloud Provider",
  "Protocol Specification",
  "Measured",
  "Calculated",
  "Engineering Estimate",
  "Internal Test",
] as const;

export const PATH_KINDS = ["shared", "video", "ai", "overlay", "control", "metadata"] as const;

export const MILESTONES = [
  "capture",
  "raw_video_visible",
  "ai_detection",
  "ai_identification",
  "ai_annotated",
  "operator_visible",
] as const;

export const REFERENCE_SCENARIO_SLUG = "reference-drone-to-wolf-ai-pipeline";

export const SPEED_OF_LIGHT_M_S = 299_792_458;

/** RF propagation for 10 km — calculated, not total radio latency. */
export const RF_10KM_PROPAGATION_MS = (10_000 / SPEED_OF_LIGHT_M_S) * 1000;
