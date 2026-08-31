import type { PipelineStage, StageDetails } from "@/lib/realtime-video-pipeline/types";
import { SECTION_LOCATION } from "@/lib/realtime-video-pipeline/pipeline-terminology";

type StageTerminologyPatch = {
  component?: string;
  whatHappens?: string;
  detailedDescription?: string;
  details?: Partial<StageDetails>;
};

/** Idempotent renames and detail enrichment for vague legacy component labels. */
export const STAGE_TERMINOLOGY_UPDATES: Record<string, StageTerminologyPatch> = {
  "WOLF cloud ingress": {
    component: "Cloud Video Ingestion Service",
    whatHappens: "Cloud network edge receives the inbound live video stream from the reserve uplink.",
    detailedDescription:
      "Regional cloud ingress endpoint (target region eu-west-2). Provider and product not yet selected — separate from Vercel application hosting.",
    details: {
      location: "CLOUD",
      provider: "TBD / Reference Architecture",
      technology: "Video streaming / ingestion service",
      architectureStatus: "Architecture Decision Required",
      inputDescription: "Live compressed video stream from Internet/WAN",
      outputDescription: "Authenticated media stream to cloud media plane",
      streamingProtocol: "TBD (SRT / RTSP / WebRTC / proprietary)",
    },
  },
  "Media processing": {
    component: "Cloud Media Processing Service",
    details: {
      location: "CLOUD",
      provider: "TBD / Reference Architecture",
      technology: "Live media processing / transrating",
      architectureStatus: "Reference Architecture",
      inputDescription: "Normalised live media stream",
      outputDescription: "Processed stream for SFU and AI branches",
    },
  },
  "Initial stream processing": {
    component: "Stream Normalisation & Clock Sync",
    details: {
      location: "CLOUD",
      provider: "TBD / Reference Architecture",
      technology: "Media normalisation / timestamping",
      architectureStatus: "Reference Architecture",
      inputDescription: "Ingested live stream",
      outputDescription: "Timestamp-aligned stream for fan-out",
    },
  },
  "Internet propagation/routing": {
    component: "Internet WAN Routing (Reserve → Cloud)",
    whatHappens: "IP packets traverse ISP, peering, and backbone networks toward the cloud region.",
    details: {
      location: "INTERNET / WAN",
      provider: "TBD",
      technology: "BGP-routed IP transport",
      architectureStatus: "Reference Architecture",
      inputDescription: "Video packets from park/reserve uplink",
      outputDescription: "Video packets at cloud region edge",
    },
  },
  "WOLF API": {
    component: "WOLF Application API",
    details: {
      location: "WOLF PLATFORM",
      provider: "Unit311 / Vercel (application hosting)",
      technology: "HTTPS REST / application API",
      architectureStatus: "Reference Architecture",
      inputDescription: "AI events and control/metadata",
      outputDescription: "Persisted records and realtime fan-out triggers",
    },
  },
  "WOLF realtime event service": {
    component: "WOLF Realtime Event Service",
    details: {
      location: "WOLF PLATFORM",
      provider: "TBD / Reference Architecture",
      technology: "WebSocket / SSE / WebRTC data channel (TBD)",
      architectureStatus: "Architecture Decision Required",
      inputDescription: "AI overlay events from backend",
      outputDescription: "Realtime metadata to operator browser",
    },
  },
  "Real-time media distribution": {
    component: "Live Media Distribution (SFU)",
    details: {
      location: "CLOUD",
      provider: "TBD / Reference Architecture",
      technology: "Selective Forwarding Unit (WebRTC SFU)",
      architectureStatus: "Architecture Decision Required",
      inputDescription: "Processed live media stream",
      outputDescription: "WebRTC streams to browser + AI input branch",
      streamingProtocol: "WebRTC",
    },
  },
  "Video ingest endpoint": {
    component: "Live Stream Ingest Endpoint",
    details: {
      location: "CLOUD",
      provider: "TBD / Reference Architecture",
      technology: "Managed live ingest endpoint",
      architectureStatus: "Architecture Decision Required",
    },
  },
  "Stream receiver": {
    component: "Ingest Stream Receiver & Jitter Buffer",
    details: {
      location: "CLOUD",
      technology: "Ingest receiver with jitter buffer",
      architectureStatus: "Reference Architecture",
    },
  },
  "GPU inference endpoint": {
    component: "Managed GPU Inference Service",
    details: {
      location: "CLOUD",
      provider: "TBD / Reference Architecture",
      technology: "Managed GPU inference runtime",
      architectureStatus: "Architecture Decision Required",
      gpuProvider: "TBD",
      gpuModel: "TBD",
    },
  },
  "AI queue": {
    component: "GPU Inference Queue",
    details: {
      location: "CLOUD",
      technology: "GPU work queue / scheduler",
      architectureStatus: "Reference Architecture",
    },
  },
  "Load balancer": {
    component: "Ingest Load Balancer",
    details: {
      location: "CLOUD",
      provider: "TBD / Reference Architecture",
      technology: "L4/L7 load balancer",
      architectureStatus: "Architecture Decision Required",
    },
  },
  "Cloud network edge": {
    component: "Cloud Network Edge & Security Perimeter",
    details: {
      location: "CLOUD",
      provider: "TBD / Reference Architecture",
      technology: "Edge firewall / DDoS / routing",
      architectureStatus: "Architecture Decision Required",
    },
  },
};

export function resolveStageLocation(stage: PipelineStage): string {
  return stage.details.location ?? SECTION_LOCATION[stage.pipelineSection] ?? "TBD";
}

export function resolveStageProvider(stage: PipelineStage): string {
  return stage.details.provider ?? "TBD";
}

export function resolveStageTechnology(stage: PipelineStage): string {
  return stage.details.technology ?? stage.details.managedServiceName ?? "TBD";
}

export function applyStageTerminologyPatch(stage: PipelineStage): PipelineStage | null {
  const patch = STAGE_TERMINOLOGY_UPDATES[stage.component];
  if (!patch) {
    const location = stage.details.location ?? SECTION_LOCATION[stage.pipelineSection];
    if (location && stage.details.location !== location) {
      return {
        ...stage,
        details: { ...stage.details, location },
      };
    }
    return null;
  }
  return {
    ...stage,
    component: patch.component ?? stage.component,
    whatHappens: patch.whatHappens ?? stage.whatHappens,
    detailedDescription: patch.detailedDescription ?? stage.detailedDescription,
    details: {
      ...stage.details,
      location:
        patch.details?.location ??
        stage.details.location ??
        SECTION_LOCATION[stage.pipelineSection],
      ...patch.details,
    },
  };
}
