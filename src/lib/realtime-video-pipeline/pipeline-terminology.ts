import type { PipelineSection } from "@/lib/realtime-video-pipeline/types";

export type PipelineLocation =
  | "AIRCRAFT"
  | "ON-SITE / RESERVE"
  | "GROUND STATION"
  | "PARK NETWORK"
  | "INTERNET / WAN"
  | "CLOUD"
  | "WOLF PLATFORM"
  | "OPERATOR DEVICE"
  | "TBD";

export const SECTION_LOCATION: Record<PipelineSection, PipelineLocation> = {
  Drone: "AIRCRAFT",
  "RF Transmission": "ON-SITE / RESERVE",
  "HQ Ground Station": "GROUND STATION",
  "HQ Network": "PARK NETWORK",
  Internet: "INTERNET / WAN",
  "Cloud Video Ingest": "CLOUD",
  "Cloud Media Processing": "CLOUD",
  "AI Infrastructure": "CLOUD",
  "AI Detection": "CLOUD",
  "AI Identification": "CLOUD",
  "WOLF Backend": "WOLF PLATFORM",
  Database: "WOLF PLATFORM",
  "Browser Delivery": "OPERATOR DEVICE",
  Browser: "OPERATOR DEVICE",
};

export const LATENCY_CATEGORY_DEFINITIONS = {
  processing: {
    label: "Processing latency",
    description:
      "Time spent actively transforming or processing data — encoding, decoding, frame extraction, preprocessing, post-processing, annotation, transcoding.",
    examples: "encoding · decoding · frame extraction · preprocessing · transcoding",
  },
  transmission: {
    label: "Transmission latency",
    description:
      "Time spent moving data between components across a link or network hop.",
    examples: "aircraft → ground · ground → Internet · Internet → cloud · cloud → WOLF · WOLF → browser",
  },
  buffer: {
    label: "Buffer latency",
    description:
      "Time data is intentionally or necessarily held before continuing downstream.",
    examples: "jitter buffer · video buffer · frame accumulation · stream synchronisation",
  },
  queue: {
    label: "Queue latency",
    description: "Time data waits for an available processing resource before work begins.",
    examples: "GPU queue · CPU queue · message queue · video-processing queue",
  },
  aiInference: {
    label: "AI inference latency",
    description:
      "Time for the AI model to process the relevant input and produce an inference result. Kept separate even when it contributes to total processing latency.",
    examples: "object detection · tracking · re-identification · event generation",
  },
} as const;

export const MILESTONE_LATENCY_DEFINITIONS = {
  rawVideoLatencyMs: {
    label: "Raw video latency",
    description:
      "Time from video/frame capture until the live video is available at the defined viewing destination (operator browser).",
  },
  aiDetectionLatencyMs: {
    label: "AI detection latency",
    description:
      "Time from frame capture until an object or event is detected in the video stream.",
  },
  aiIdentificationLatencyMs: {
    label: "AI identification latency",
    description:
      "Time from frame capture until the detected object/event is classified or individually identified.",
  },
  aiAnnotatedLatencyMs: {
    label: "AI annotated video latency",
    description:
      "Time from frame capture until the AI result is incorporated into the video/output visible at the defined destination.",
  },
  totalProcessingMs: {
    label: "Total processing latency",
    description: "Sum of applicable processing latency components across enabled stages.",
  },
  totalTransmissionMs: {
    label: "Total transmission latency",
    description: "Sum of applicable transmission latency components across enabled stages.",
  },
  totalBufferMs: {
    label: "Total buffering latency",
    description: "Sum of applicable buffer latency components across enabled stages.",
  },
  totalQueueMs: {
    label: "Total queue latency",
    description: "Sum of applicable queue/waiting latency components across enabled stages.",
  },
  totalAiInferenceMs: {
    label: "Total AI inference latency",
    description: "Sum of AI inference latency across enabled AI stages.",
  },
} as const;

export const ARCHITECTURE_STATUS_LABELS = {
  reference: "Reference Architecture",
  decisionRequired: "Architecture Decision Required",
  measured: "Measured",
  tbd: "TBD",
} as const;
